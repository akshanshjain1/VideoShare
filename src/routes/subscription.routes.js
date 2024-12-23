import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, isSubscribed, toggleSubscription } from "../controller/subscription.controller.js";
const router=Router()
router.use(verifyjwt);
router.route('/isSubscribed/c/:channelId').get(isSubscribed)
router.route('/c/:channelId').post(toggleSubscription).get(getUserChannelSubscribers)
router.route("/u/:subscriberId").get( getSubscribedChannels);

export default router