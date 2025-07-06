import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
const gemini = new GoogleGenerativeAI({ apiKey: process.env.GOOGLE_GEMINI_API });
import { pipeline } from '@xenova/transformers';

dotenv.config();



export async function getEmbedding(text) {
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

export function getSemanticHashFromEmbedding(embedding = []) {
  const str = embedding.map(n => n.toFixed(5)).join(",");
  return crypto.createHash("md5").update(str).digest("hex");
}

export function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
}

export async function isSemanticallySimilar(textA, textB, threshold = 0.91) {
  const embA = await getEmbedding(textA);
  const embB = await getEmbedding(textB);
  if (!embA || !embB) return false;
  const sim = cosineSimilarity(embA, embB);
  return sim >= threshold;
}

export async function computeSemanticInfo(text) {
  const embedding = await getEmbedding(text);
  const hash = embedding ? getSemanticHashFromEmbedding(embedding) : null;
  return { embedding, hash };
}
