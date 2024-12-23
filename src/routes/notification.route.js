import { Router } from "express";
import {
    unreadnotification,
    readnotification
} from '../controller/notification.controller.js'
import { verifyjwt } from "../middlewares/auth.middleware.js";
const router=Router();
router.use(verifyjwt)
router.route('/unread/:userId').get(unreadnotification)
router.route('/read/:userId').get(readnotification)
export default router
