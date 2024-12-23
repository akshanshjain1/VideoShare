import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getvideolike,
    getcommentlike,
    getisVideoLiked,
} from '../controller/like.controller.js'
import { verifyjwt } from '../middlewares/auth.middleware.js';


const router = Router();
router.route('/getvideolike/:videoId').get(getvideolike)
router.use(verifyjwt); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);
router.route('/isvideoliked/:VideoId').get(getisVideoLiked)

router.route('/getcommentlike/:commentId').get(getcommentlike)
export default router