import mongoose from "mongoose";
const { Schema } = mongoose;

const unwatchedTopicIdeaSchema = new Schema({
  title: { type: String, required: true, index: true },
  summarizedTitle: { type: String },
  semanticHash: { type: String, index: true },
  tags: { type: [String], default: [] },
  instructions: { type: Schema.Types.Mixed },
  embedding: { type: [Number], default: [] },
  demandScore: { type: Number, default: 0 },
  searchCount: { type: Number, default: 1 },
  creatorsSuggestedTo: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  videoCreatedCount: { type: Number, default: 0 },
  autoDeleteAfterCount: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now }
});

export const UnwatchedTopicIdea = mongoose.model("UnwatchedTopicIdea", unwatchedTopicIdeaSchema);
