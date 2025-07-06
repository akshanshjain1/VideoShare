import TagCategory from "../models/tagCategory.model.js"
async function saveMainAndSubTags(mainTag, subTags) {
  try {
    let doc = await TagCategory.findOne({ mainTag });

    if (!doc) {
      // Create new mainTag with subTags
      doc = new TagCategory({
        mainTag,
        subTags: subTags.map(tag => ({ name: tag }))
      });
    } else {
      // Update existing doc with new subTags (if not present)
      for (const tag of subTags) {
        const exists = doc.subTags.find(t => t.name === tag);
        if (!exists) {
          doc.subTags.push({ name: tag });
        }
      }
    }

    await doc.save();
  } catch (error) {
    console.error("Tag DB Save Error:", error.message || error);
  }
}
export {
    saveMainAndSubTags
}