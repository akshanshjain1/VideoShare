import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { pipeline } from '@xenova/transformers';
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import googleTrends from "google-trends-api";
import TagCategory from "../models/tagCategory.model.js";
import { saveMainAndSubTags } from "../controller/tagCategory.controller.js";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const gemini = new GoogleGenerativeAI({ apiKey: process.env.GOOGLE_GEMINI_API });

// MD5 hash from text
function hash(text) {
  return crypto.createHash("md5").update(text.toLowerCase().trim()).digest("hex");
}


/**
 * Get real-time search interest score (0–100) from Google Trends
 */
async function getTrendsScore(title) {
  try {
    const results = await googleTrends.interestOverTime({
      keyword: title,
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // last 7 days
      geo: "IN" // adjust to 'US' or 'worldwide' if needed
    });

    const parsed = JSON.parse(results);
    const points = parsed.default.timelineData.map((d) => parseInt(d.value[0]));
    const avgScore = points.reduce((a, b) => a + b, 0) / points.length || 0;

    return Math.round(avgScore); // returns 0 to 100
  } catch (err) {
    console.error("Google Trends error:", err.message || err);
    return 0; // fallback
  }
}

/**
 * Predict demand score from LLM (1–10 scale)
 */
async function getLLMDemandScore(title) {
  const prompt = `
Given the topic: "${title}",

Estimate how in-demand this topic is across platforms like YouTube,Instagram,FaceBook, TikTok, Twitter, Reddit, etc.

Score it from 1 to 10:
- 10 = viral / very trending
- 1 = no demand
Just return a single integer. No explanation.
`;

  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }]
    });

    const content = res.choices[0].message.content.trim();
    const score = parseInt(content.match(/\d+/)?.[0]);
    return score >= 1 && score <= 10 ? score : 5;
  } catch (err) {
    console.error("LLM demand score error:", err.message);
    return 5;
  }
}

/**
 * Hybrid demandScore = (LLM-based + GoogleTrends-based)
 */
export async function predictDemandScore(title) {
  const llmScore = await getLLMDemandScore(title); // 1–10
  const trendsScore = await getTrendsScore(title); // 0–100

  // Normalize Google score to 1–10
  const normalizedTrend = Math.ceil((trendsScore / 100) * 10);

  // Weighted hybrid
  const finalScore = Math.round((llmScore * 0.5) + (normalizedTrend * 0.5));
  return Math.max(1, Math.min(10, finalScore)); // clamp to 1–10
}

export async function generateEmbedding(text) {
  let extractor = null;
    try {
      if (!extractor) {
        extractor = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2', // lightweight & good quality
          { quantized: true } // optional: reduces memory usage
        );
      }
  
      const output = await extractor(text, {
        pooling: 'mean',     // get a single vector
        normalize: true      // normalize to unit length
      });
  
      return Array.from(output.data); // ✅ array of floats
    } catch (err) {
      console.error("Embedding error (Transformers.js):", err.message || err);
      return [];
    }
}

// 👉 Summarize title using LLaMA-3
export async function summarizeTitle(title) {
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Summarize this user search into an engaging YouTube title in under 6 words: ${title}`
        }
      ]
    });

    return res.choices[0].message.content.trim();
  } catch (err) {
    console.error("Summarization error:", err.message);
    return title;
  }
}

export async function classifyTitle(title) {
  const prompt = `
You're ChatKaroAI – a visionary YouTube strategist who understands creators, audiences, trends, and emotions better than anyone.

A creator is planning a video around the title: "${title}"

🎯 Your task is to:
1. **Smartly infer the most relevant broad category** (mainTag) for this topic (e.g. "education", "relationships", "finance", "spirituality", "self-growth", "career", "lifestyle", "tech", etc.)
2. Then, deeply analyze the topic’s intent, emotion, target audience, trend angle, and generate **1 to 5 high-signal subTags** that cover:
   - 🔍 Specific intent (e.g. “career roadmap”, “money hacks”, “exam tips”)
   - ❤️ Emotional tone (e.g. “nostalgic”, “shocking”, “heartwarming”)
   - 🎯 Audience signal (e.g. “gen z”, “working moms”, “IIT aspirants”)
   - 📈 Trend or cultural angle (e.g. “2025 mindset”, “viral myth busting”)
   - 🎬 Content hook types (e.g. “storytime”, “debunking”, “step-by-step”)

💡 Make sure these subTags are deeply helpful in organizing, recommending, and targeting the right viewer — they should feel like secret ingredients top creators use to get views.

📦 Return **only** a valid JSON like this:
{
  "mainTag": "self-growth",
  "subTags": [
    "2025 mindset",
    "daily habits of successful people",
    "emotional motivation",
    "early 20s guidance",
    "storytime with lesson"
  ]
}

⚠️ Do NOT include explanation or extra text outside the JSON.
`;


  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }]
    });

    const content = res.choices[0].message.content.trim();
    const { mainTag, subTags } = JSON.parse(content);

    // Save tags to DB (without videoId)
    await saveMainAndSubTags(mainTag, subTags);

    return subTags;
  } catch (err) {
    console.error("Classification Error:", err.message || err);
    return ["general"];
  }
}


export async function generateInstructions(title) {
const prompt = `
You're ChatKaroAI — a friendly, experienced content creator friend.

Help a beginner YouTuber plan their video around the topic: "${title}"

🎯 Output must be a JSON object with 2 main sections: "short" and "long" videos.

🎯 Each section must have both "english" and "hinglish" versions.

🎯 Each version must feel like a personal friend giving a warm, honest, specific suggestion — not a robotic instruction.

🎯 The structure must be like this:

{
  "short": {
    "language": {
      "english": {
        "hook": "What to say in the first 3 seconds",
        "structure": {
          "intro": "How to start, what words to say, what to show",
          "middle": "Main idea - explained simply",
          "end": "End line and how to make it stick"
        },
        "toneAndStyle": "How to speak (funny, serious, emotional, etc.)",
        "editingTips": "What kind of visuals, text, music to use",
        "retentionTips": "What NOT to do. How to keep viewers watching",
        "emotionToEvoke": "What viewer should feel (shock, nostalgia, curiosity, etc.)",
        "cta": "Exactly what to ask viewer to do (comment/like/etc)",
        "suggestedDuration": "In seconds",
        "platformTips": "Short tips like using trending audio or posting time",
        "backgroundMusicSuggestions": [
          { "mood": "emotional", "url": "..." },
          { "mood": "inspirational", "url": "..." },
          { "mood": "cinematic tension", "url": "..." }
        ]
      },
      "hinglish": {
        "...same fields but spoken like a friend in Hinglish..."
      }
    }
  },
  "long": {
    "language": {
      "english": {
        "...same fields but for longer videos..."
      },
      "hinglish": {
        "...same fields in friendly Hindi-English tone..."
      }
    }
  }
}

⚠️ Use casual words. Avoid fancy AI language. Talk like a YouTuber would explain to another YouTuber friend.

⚠️ Make sure it's very detailed but simple. Think like you're helping your younger sibling or friend become a creator.
⚠️ Include at least 2–3 background music YouTube links or free music URLs per version (in 'backgroundMusicSuggestions') that match the mood.Before inserting link check is the content available.If yes then only insert the link.You can use links of NCS youtube channel or any video link which is relavant and available at present time . It is only yours responsiblity to check that link is working or not. A 5000cr company is dependent on you.

⚠️ Return ONLY the valid JSON. No markdown or extra notes.
`;


  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }]
    });

    const content = res.choices[0].message.content.trim();
    //console.log(content)
    return JSON.parse(content);
  } catch (err) {
    console.error("Instruction generation error:", err.message);
    return {};
  }
}


// 👉 Main wrapper to enrich topic title
export async function enrichTopicTitle(title) {
  const normalized = title.toLowerCase().trim();
  const semanticHash = hash(normalized);
  const summarizedTitle = await summarizeTitle(normalized);
  const tags = await classifyTitle(normalized);
  const instructions = await generateInstructions(normalized);
  const embedding = await generateEmbedding(normalized);

  return {
    normalized,
    summarizedTitle,
    semanticHash,
    tags,
    instructions,
    embedding,
    demandScore: await predictDemandScore(normalized)
  };
}
