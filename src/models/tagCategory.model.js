import mongoose from "mongoose";

const subTagSchema = new mongoose.Schema({
  name: { type: String, required: true, lowercase: true }
});

const tagCategorySchema = new mongoose.Schema({
  mainTag: { type: String, required: true, unique: true, lowercase: true },
  subTags: [subTagSchema]
});

export default mongoose.model("TagCategory", tagCategorySchema);
