import { asynchandler } from "../utils/async-handler.js";
import Apierror from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import uploadoncloudinary from "../utils/cloudinary-fileupload.js";
import Apiresponse from "../utils/apiresponse.js";
import util from 'util'
import jwt from 'jsonwebtoken'
import deletefromcloudinary from "../utils/cloudinary-filedelete.js";
import mongoose from "mongoose";
import generateresponse from "../utils/generative-ai.js";
// method for register user
let existeduser=null;

const generateAccessAndRefreshTokens=async(userid)=>{
    try{
        const user=await User.findById(userid);
        const accesstoken=user.generateaccesstoken();
        const refreshtoken=user.generaterefreshtoken();
        user.refreshtoken=refreshtoken;
        await user.save({validateBeforeSave:false})
        return {accesstoken,refreshtoken}

    }
    catch(error){
        throw new Apierror(500,'something went wrong while generating access and refresh token')
    }
}

const registernewuser=asynchandler(async (req,res)=>{
    
    
    //get user detail from frontend
    //validation -not empty
    // check if user already exist:through username and email
    // check for images,check for avatar
    //if yes then upload to cloudinary,
    //check whether uploaded to cloudinary
    // create user object -create entry in db
    // remove password and refresh tokeen field from response(which come from mongodb)(response to be send to frontend)
    // check for user creation
    //if yes return response else send error

    const {username,email,password,fullname}=req.body
    
    // if(fullname==="") 
    //     throw new Apierror(400,"fullname is required");
    // checking for all in a while
    if(
        [fullname,email,password,username].some((field)=> field?.trim()==="")
    ){
        throw new Apierror(400,'all fields are required');
    }
    existeduser=await User.findOne({
        $or:[{email},{username}]
    })
    if(existeduser ) 
        throw new Apierror(409,'user already there'); 
    
    if(!req.files || !Array.isArray(req.files.avatar) || !(req.files.avatar.length>0))
        throw new Apierror(400,'avatar is required')
    const avatarlocalpath=req.files?.avatar[0]?.path;
    //const coverlocalpath=req.files?.coverimage[0]?.path;
    if(!avatarlocalpath)
        throw new Apierror(400,'avatar required')
    let coverlocalpath;
    if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length>0)
            coverlocalpath=req.files.coverimage[0].path;
    const avatar=await uploadoncloudinary(avatarlocalpath);
    if(!avatar) throw new Apierror(500,'file not uploaded');
    let coverimage;
    if(coverlocalpath){
         coverimage=await uploadoncloudinary(coverlocalpath)
        if(!coverimage) throw new Apierror(500,'file not uploaded');}
    
    const user=await User.create({
        fullname:fullname,
        avatar:avatar.url,
        coverimage:coverimage?.url||"",
        email,
        password:password,
        username:username.toLowerCase()


    })
   
    //validated that user created
    const createduser=await User.findById(user._id).select(
        "-password -refreshtoken"
    )
    if(!createduser){
        throw new Apierror(500,'something went wrong while registeration')
    }
     return res.status(201).json(
         new Apiresponse(200,createduser,'user registered successfully')
     )
}
)
const loginuser=asynchandler(async(req,res)=>{
    // req body se data
    // userrname or email kisi ek par
    // find the user
    // password check
    // access and refresh token generate and send to user to 
    // send to cookie
    const {email,password,username}=req.body
    
    if(!username && !email){
        throw new Apierror(400,'username or email one is required');
    }
  const finduser=await User.findOne({
    $or:[{email},{username}]
})
    if(!finduser){
        throw new Apierror(404,'user not found');
    }
    const ispassmatch=await finduser.ispasswordcorrect(password) ;
    if(!ispassmatch) 
        throw new Apierror(401,'invalid user credentials - password incorrect'); 
    const {accesstoken,refreshtoken}=await generateAccessAndRefreshTokens(finduser._id)
    const loggedinuser=await User.findById(finduser._id).select(
        "-password -refreshtoken"
    ).lean()
    
    //console.log(util.inspect(loggedinuser,{showhidden:false,depth:null
    //}))

    return res.status(200)
    .cookie("accesstoken",accesstoken,{
        httpOnly:true,
        secure:true,
        maxAge: 60 * 60 * 24 * 3 * 1000
    })
    .cookie("refreshtoken",refreshtoken,{
        httpOnly:true,
        secure:true,
        maxAge: 60 * 60 * 24 * 10 * 1000
    })         
    .json(
        new Apiresponse(200,
            {
                user:loggedinuser,
                accesstoken,
                refreshtoken

            },
            "user log in successfully"
        )
    )

})
const logoutuser=asynchandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshtoken:1
            }
        },{
            new:true
        }

    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
            .clearCookie('accesstoken',options)
            .clearCookie('refreshtoken',options)
            .json(new Apiresponse(200,{},'logged out successfully'))
})

const refreshaccesstoken=asynchandler(async(req,res)=>{
    const incomingrefreshtoken=req.cookies.refreshtoken || 
                                req.body.refreshtoken
    if(!incomingrefreshtoken)
        throw new Apierror(401,'unauthorized request');
    try {
        const decodedtoken=jwt.verify(incomingrefreshtoken,process.env.REFRESH_TOKEN_SECRET)
        const isuserthere=await User.findById(decodedtoken._id);
        if(!isuserthere)
            throw new Apierror(401,'invalid refresh  token')
        if(incomingrefreshtoken!==isuserthere?.refreshtoken)
                throw new Apierror(401,'refresh token is expired or used');
        const options={
            httpOnly:true,
            secure:true
        }
        const {accesstoken,newrefreshtoken}=await  generateAccessAndRefreshTokens(isuserthere._id)    
        return res.status(200)
                    .cookie('accesstoken',accesstoken,options)
                    .cookie('refreshtoken',newrefreshtoken,options)
                    .json(
                        new Apiresponse(200,
                            {
                                accesstoken:accesstoken,refreshatoken:newrefreshtoken
                            },
                             'access token refreshed'
                        )
                    )
    } catch (error) {
        throw new Apierror(401,error?.message || 'invalid refresh token')
    }

})

const changecurrentpassword=asynchandler(async(req,res)=>{
    const {oldPassword,newPassword,confirmpassword}=req.body
    //if(newPassword!=confirmpassword) throw new Apierror(400,'passwords not same')
    const user=await User.findById(req.user?._id);
    const ispasswordcorrect=await user.ispasswordcorrect(oldPassword)
    if(!ispasswordcorrect)
        throw new Apierror(400,'invalid password');
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(
        new Apiresponse(200,{},'password changed successfully')
    )

})

const getcurrentuser=asynchandler(async(req,res)=>{
    return res.status(200).json(new Apiresponse(200,req.user,'current user fetched successfully'))
})

const updateaccountdetails=asynchandler(async(req,res)=>{
    const {fullname,email}=req.body;
    if(!fullname && !email)
        throw new Apierror(400,'all fields are requried');
  const user =await User.findByIdAndUpdate(
        req.user?._id,
        {
           $set:{
            fullname:fullname,
            email:email
           } 
        },
        {new:true} ).select('-password')
        return res.status(200)
                .json(new Apiresponse(200,user,'user detail successfully'))
})

const updateuseravatar=asynchandler(async(req,res)=>{
    const avatarlocalpath=req.file?.path;
    if(!avatarlocalpath)
            throw new Apierror(400,'avatar file is missing');
    const oldavatar=req.user.avatar
    const avatar=await uploadoncloudinary(avatarlocalpath);
    if(!avatar.url)
        throw new Apierror(400,'error while uploading avatar');
   const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },{new:true}
    ).select('-password')
    
   await  deletefromcloudinary(oldavatar);
    return res.status(200).json(
        new Apiresponse(200,user,'avatar updated successfully')
    )
})

const updateusercoverimage=asynchandler(async(req,res)=>{
    const coverimagelocalpath=req.file?.path;
    const oldcoverimage=req.user.coverimage
    if(!coverimagelocalpath)
            throw new Apierror(400,'coverimage file is missing');
    const coverimage=await uploadoncloudinary(coverimagelocalpath);
    if(!coverimage.url)
        throw new Apierror(400,'error while uploading coverimage');
   const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage:coverimage.url
            }
        },{new:true}
    ).select('-password')
   await  deletefromcloudinary(oldcoverimage);
    return res.status(200).json(
        new Apiresponse(200,user,'coverimage updated successfully')
    )
})

const getuserchannelprofile=asynchandler(async(req,res)=>{
    const {username}=req.params;
    if(!username?.trim())
        throw new Apierror(400,'username is missing');
    const channel=await User.aggregate([{
        // will get only one user
        $match:{
            username:username?.toLowerCase()
        }
    },
    {
        $lookup:{
            // user object me andar 
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"

        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"   
    } }
    ,{
        $addFields:{
            //fields to be added
            subscriberscount:{
                $size:"$subscribers"
            },
            channelsubscribedtocount:{
                    $size:"$subscribedTo"
            },
            issubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
            
        }
    },
    {
        $project:{
            _id:1,
            fullname:1,
            username:1,
            email:1,
            subscriberscount:1,
            channelsubscribedtocount:1,
            avatar:1,
            coverimage:1,
            issubscribed:1,
            about:1
        }
    } 
])  
    
    if(channel?.length===0)  
        throw new Apierror(404,'channel does not exist');
    
    return res.status(200)
            .json(new Apiresponse(200,channel[0],'user channel fetched successfully'))

})

const getuserchannelprofilebyId=asynchandler(async(req,res)=>{
    const {userId}=req.params;
    
    const Userid=req?.user?.id || '';
    
    
    
    const channel=await User.aggregate([{
        // will get only one user
        $match:{
            _id:new mongoose.Types.ObjectId(userId)
        }
    },
    {
        $lookup:{
            // user object me andar 
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"

        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"   
    } }
    ,{
        $addFields:{
            //fields to be added
            subscriberscount:{
                $size:"$subscribers"
            },
            channelsubscribedtocount:{
                    $size:"$subscribedTo"
            },
            issubscribed:Userid ?{
                $cond:{
                    if:{$in:[Userid,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            } :false
            
        }
    },
    {
        $project:{
            _id:1,
            fullname:1,
            username:1,
            email:1,
            subscriberscount:1,
            channelsubscribedtocount:1,
            avatar:1,
            coverimage:1,
            issubscribed:1
        }
    } 
])  
    
    if(channel?.length===0)  
        throw new Apierror(404,'channel does not exist');
    
    return res.status(200)
            .json(new Apiresponse(200,channel[0],'user channel fetched successfully'))

})

const getwatchhistory=asynchandler(async(req,res)=>{
    const UserId=req.user?._id
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(UserId),
            },
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'watchhistory',
                foreignField: '_id',
                as: 'videodetails',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'ownerdetails',
                        },
                    },
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            thumbnail:1,
                            createdAt:1,
                            views:1,
                            ownerdetails: { username: 1, avatar: 1,fullname:1 },
                        },
                    },
                ],
            },
        },
        {
            $project: {
                watchhistory: 1,
                videodetails: 1,
            },
        },
    ]);
        return res.status(200)
            .json(new Apiresponse(200,user,'watch history fetched successfully'))
})
const addwatchhistory=asynchandler(async(req,res)=>{
    const UserId=req.user?._id;
    const {VideoId}=req.params
    const user=await User.findById(UserId)
    //return res.json(new Apiresponse(200,,'hello'))
    if(! user.watchhistory.includes((VideoId)))
        user.watchhistory.push((VideoId));
    await user.save();
    return res.json(new Apiresponse(200,[],'Video Added Successfully'));

})
const generateaihelp=asynchandler(async(req,res)=>{
    const {query}=req.query
    const {prevconversation}=req.body
    const prompt=`You are a highly intelligent, friendly, and conversational AI assistant. 
    You provide clear, concise, and helpful answers to any query presented to you. 
    Whenever text is given inside rounded brackets (query) , you must interpret it as a 
    specific question or command to answer .
    Also old Response are given in rouded brackets (old conversation) so if the question Seems to be in continuation then answer accordingly
    not start over again as fresh conversation
    Respond directly to the query, maintaining a 
    polite and approachable tone. Do not include the brackets in your response. If the query 
    is ambiguous, ask for clarification politely. Always aim to enhance user understanding 
    in your responses.
    Now the query is (${query})
    Old Conversation is (${prevconversation})
    Also remember the old Conversions Done So that You can answer current on basis of that
    `
    const response=await generateresponse(prompt);
    return res.json(new Apiresponse(200,[response],'Generated Successfully'))
})
const addabout=asynchandler(async(req,res)=>{
    const userId=req?.user?._id
    const {about}=req.body
    const user=await User.findByIdAndUpdate(userId,{$set:{about:about}});
    return res.json(new Apiresponse(200,[],'About added'))
})

export
   {registernewuser,
    loginuser,logoutuser,
    refreshaccesstoken,changecurrentpassword,
    getcurrentuser,updateaccountdetails,
    updateuseravatar,updateusercoverimage,
     getuserchannelprofile,getuserchannelprofilebyId,getwatchhistory,
    addwatchhistory,
    generateaihelp,
    addabout
}