import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment
} from '../controller/comment.controller.js'
import { verifyjwt } from '../middlewares/auth.middleware.js'; 

const router = Router();
router.route("/:videoId").get(getVideoComments)
router.use(verifyjwt); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router