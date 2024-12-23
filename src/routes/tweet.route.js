import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controller/tweet.controller.js"
import {verifyjwt} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyjwt); 

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router