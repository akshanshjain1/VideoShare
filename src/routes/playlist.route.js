import { Router } from 'express';
import {

    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    getVideoDetails,
    removeVideoFromPlaylist,
    updatePlaylist,
    updatethumbnail,
} from "../controller/playlist.controller.js"
import {verifyjwt} from "../middlewares/auth.middleware.js"
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.use(verifyjwt); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylist)

router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);
router.route('/video/:playlistId').get(getVideoDetails)

//router.route('/addthumbnail/:playlistId').patch(upload.single('thumbnail'),addthumbnail)
router.route('/updatethumbnail/:playlistId').patch(upload.single('thumbnail'),updatethumbnail)

export default router