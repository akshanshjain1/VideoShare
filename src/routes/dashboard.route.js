import {Router} from 'express'
import { getChannelStats } from '../controller/dashboard.controller.js'
import {verifyjwt} from '../middlewares/auth.middleware.js'


const router=Router()

router.use(verifyjwt)
router.route('/stats').get(getChannelStats)


export default router