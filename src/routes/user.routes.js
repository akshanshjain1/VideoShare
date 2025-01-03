import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { addabout, addwatchhistory, changecurrentpassword, generateaihelp, getcurrentuser, 
    getuserchannelprofile, getuserchannelprofilebyId, getwatchhistory, 
    loginuser, logoutuser, 
    refreshaccesstoken, registernewuser, updateaccountdetails, 
    updateuseravatar, updateusercoverimage } from "../controller/user.controller.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";
const router=Router()
router.route("/registernewuser").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverimage",
            maxCount:1

        }
    ]),
    registernewuser)
// router.route("/registernewuser").get(registernewuser)
router.route('/login').post(loginuser)

//secured routes
router.route('/logout').post(verifyjwt,logoutuser)
router.route('/refresh-token').post(refreshaccesstoken)
router.route('/changepassword').post(verifyjwt,changecurrentpassword)
router.route('/current-user').get(verifyjwt,getcurrentuser);

router.route('/update-account').patch(verifyjwt,updateaccountdetails)
router.route('/update-avatar').patch(verifyjwt,upload.single('avatar'),updateuseravatar)
router.route('/update-coverimage').patch(verifyjwt,upload.single('coverimage'),updateusercoverimage);
router.route('/c/:username').get(verifyjwt,getuserchannelprofile);
router.route('/c/byuserid/:userId').get(getuserchannelprofilebyId)
router.route('/watch-history').get(verifyjwt,getwatchhistory);
router.route('/current-user/update-watch-history/:VideoId').post(verifyjwt,addwatchhistory)
router.route('/generatetext').post(generateaihelp)
router.route('/addabout').post(verifyjwt,addabout)
export default router