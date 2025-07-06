import { UnwatchedTopicIdea } from "../models/unwatchedtopicIdea.js";
import { computeSemanticInfo,cosineSimilarity } from "../utils/sematicHash.js";
import { enrichTopicTitle,predictDemandScore } from "../services/topicAI.utils.js";
import TagCategory from "../models/tagCategory.model.js"
import crypto from "crypto";

export const trackUnwatchedTopic = async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const normalized = title.toLowerCase().trim();

  // Step 1: Compute embedding + hash
  const { embedding, hash } = await computeSemanticInfo(normalized);
  if (!embedding) return res.status(500).json({ error: "Embedding failed" });

  // Step 2: Check for semantic duplicates
  const existingTopics = await UnwatchedTopicIdea.find();
  for (const topic of existingTopics) {
    if (topic.embedding?.length > 0) {
      const sim = cosineSimilarity(embedding, topic.embedding);
      if (sim >= 0.88) {
        topic.searchCount += 1;
        topic.demandScore += await predictDemandScore(normalized);
        await topic.save();
        return res.status(200).json({ message: "Similar topic already exists. Updated score." });
      }
    }
  }

  // Step 3: Enrich + insert
  const enriched = await enrichTopicTitle(normalized);
  await UnwatchedTopicIdea.create({
    title: normalized,
    summarizedTitle: enriched.summarizedTitle,
    semanticHash: hash,
    tags: enriched.tags,
    instructions: enriched.instructions,
    embedding,
    demandScore: enriched.demandScore,
    searchCount: 1,
    videoCreatedCount: 0,
    creatorsSuggestedTo: [],
    autoDeleteAfterCount: 5
  });

  return res.status(200).json({ message: "Topic enriched and saved." });
};

export const getAllTags = async (req, res) => {
  try {
    const tags = await TagCategory.find();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch tags" });
  }
};

export const getTopicsByTag = async (req, res) => {
  const {subTags}=req.body;
  try {
    const topics = await UnwatchedTopicIdea.find({
      tags: { $in: subTags }
    })
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch topics by tag" });
  }
};

export const getTrendingTopics = async (req, res) => {
  try {
    const topics = await UnwatchedTopicIdea.find().sort({ demandScore: -1, searchCount: -1 }).limit(15);
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trending topics" });
  }
};

export const markTopicAsVideoCreated = async (req, res) => {
  const { topicId } = req.params;
  const creatorId = req.user?._id; // Set by verifyjwt middleware

  try {
    const topic = await UnwatchedTopicIdea.findById(topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    topic.videoCreatedCount += 1;

    if (!topic.creatorsSuggestedTo.includes(creatorId)) {
      topic.creatorsSuggestedTo.push(creatorId);
    }

    if (topic.videoCreatedCount >= topic.autoDeleteAfterCount) {
      const deletedTitle = topic.title;
      const baseEmbedding = topic.embedding;

      await topic.deleteOne();

      // 🧠 Delete semantically similar topics (threshold = 0.85)
      if (baseEmbedding?.length) {
        const all = await UnwatchedTopicIdea.find();
        const threshold = 0.85;

        for (const t of all) {
          if (t.embedding?.length) {
            const sim = cosineSimilarity(baseEmbedding, t.embedding);
            if (sim >= threshold) {
              console.log(`🧹 Auto-deleting similar topic: "${t.title}" (similar to "${deletedTitle}")`);
              await t.deleteOne();
            }
          }
        }
      }

      return res.json({ message: "Topic and similar ones auto-deleted after enough usage." });
    }

    await topic.save();
    res.json({ message: "Marked as used", count: topic.videoCreatedCount });
  } catch (err) {
    console.error("Failed to mark topic used:", err);
    res.status(500).json({ error: "Failed to mark as used" });
  }
};

export const getTopicById = async (req, res) => {
  try {
    const topic = await UnwatchedTopicIdea.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: "Not found" });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch topic" });
  }
};

export const getAllTopics = async (_req, res) => {
  try {
    const topics = await UnwatchedTopicIdea.find().sort({ createdAt: -1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch topics" });
  }
};
