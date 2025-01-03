import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getcurrentuservideo,
    
    getvideoautogeneration,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    updatevideoviews,
} from "../controller/video.controller.js"
import { verifyjwt } from '../middlewares/auth.middleware.js';
import {upload} from "../middlewares/multer.middleware.js"


const router = Router();
router.route("/:videoId").get( getVideoById)
router.route('/').get(getAllVideos)
router.route('/updateviews/:videoId').get(updatevideoviews)
router.use(verifyjwt);

router.route("/")
        .post(
        upload.fields([
            {
                name: "videofile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );
router.route('/generatetext').post(getvideoautogeneration)


router.route("/:videoId").delete(deleteVideo)
.patch(upload.single("thumbnail"), updateVideo);

router.route('/current-user-video').post(getcurrentuservideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);



export default router