import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import {
  trackUnwatchedTopic,
  getAllTags,
  getTopicsByTag,
  getTrendingTopics,
  markTopicAsVideoCreated,
  getTopicById,
  getAllTopics
} from "../controller/unwatchedTopic.controller.js";

const router = Router();

router.use(verifyjwt);

router.post("/track", trackUnwatchedTopic);
router.get("/tags", getAllTags);
router.post("/topics-by-tags", getTopicsByTag);
router.get("/trending", getTrendingTopics);
router.post("/used/:topicId", markTopicAsVideoCreated);
router.get("/by-id/:id", getTopicById);
router.get("/all", getAllTopics); // Optional: admin view

export default router;
