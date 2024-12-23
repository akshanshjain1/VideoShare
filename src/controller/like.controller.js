import mongoose from "mongoose"
import {Like} from "../models/like.model.js"
import Apierror from '../utils/apierror.js'
import Apiresponse from "../utils/apiresponse.js"
import {asynchandler} from "../utils/async-handler.js"
import { Video } from "../models/video.model.js"
const toggleVideoLike = asynchandler(async (req, res) => {
    const {videoId} = req.params
    const userid=req.user?._id
    const oldlike=await Like.find({video:videoId,likedby:userid})
    
    if(oldlike.length>0){
        await Like.deleteOne({_id:oldlike[0]?._id})
        return res.json(new Apiresponse(200,[],'Unliked Successfully'))
    }
    const newlike=new Like({
        video:videoId,
        likedby:userid
    })
    await newlike.save()
    return res.json(new Apiresponse(200,[],'Liked Successfully'))
})

const toggleCommentLike = asynchandler(async (req, res) => {
    const {commentId} = req.params
    const userid=req.user?._id
    const oldlike=await Like.find({comment:commentId,likedby:userid})
    
    if(oldlike.length>0){
        await Like.deleteOne({_id:oldlike[0]?._id})
        return res.json(new Apiresponse(200,[],'Unliked Successfully'))
    }
    const newlike=new Like({
        comment:commentId,
        likedby:userid
    })
    await newlike.save()
    return res.json(new Apiresponse(200,[],'Liked Successfully'))

})

const toggleTweetLike = asynchandler(async (req, res) => {
    const {tweetId} = req.params
    const userid=req.user?._id
    const oldlike=await Like.find({tweet:tweetId,likedby:userid})
    
    if(oldlike.length>0){
        await Like.deleteOne({_id:oldlike[0]?._id})
        return res.json(new Apiresponse(200,[],'Unliked Successfully'))
    }
    const newlike=new Like({
        tweet:tweetId,
        likedby:userid
    })
    await newlike.save()
    return res.json(new Apiresponse(200,[],'Liked Successfully'))
}
)

const getLikedVideos = asynchandler(async (req, res) => {
    const userId=req.user?._id
    const likedvideos=await Like.aggregate([{
        $match:{
            likedby:new mongoose.Types.ObjectId(userId),
            video:{
                $exists:true,
                $ne:null
                
            }
        },
        
    },
    {
        $lookup:{
            from:'videos',
            localField:'video',
            foreignField:'_id',
            as:'videodetails'
        }
    }
    ,{
        $addFields:{
            videoid:{
                $first:'$videodetails._id'
            },
            title:{
                $first:'$videodetails.title'
            },
            views:{
                $first:'$videodetails.views'
            },
            thumbnail:{
                $first:'$videodetails.thumbnail'
            },
            duration:{
                 $first:'$videodetails.duration'
            },
            videofile:{
                 $first:'$videodetails.videofile'
            }
        }
    },{
        $project:{
            videodetails:1,
            videoid:1,
            title:1,
            videofile:1,
            duration:1,
            thumbnail:1,
            views:1,
            createdAt:1

        }
    }
    
    ])
    if(!likedvideos && likedvideos.length===0)
        return res.json(new Apierror(400,'Not found Likded Video'))
    return res.json(new Apiresponse(200,likedvideos,'Video Fetched Successfully'))
})
    const getvideolike=asynchandler(async(req,res)=>{
        const {videoId}=req.params;
        const likedvideos=await Like.aggregate([
            {
                $match:{
                    video:new mongoose.Types.ObjectId(videoId)
                }
            }
        ])
        if(!likedvideos) return res.json(new Apierror(400,'cannot fetch videos'))
        return res.json(new Apiresponse(200,likedvideos.length,'Fetched likes successfully'))
})
const getcommentlike=asynchandler(async(req,res)=>{
    const {commentId}=req.params;
    const likedcomments=await Like.aggregate([
        {
            $match:{
                comment:new mongoose.Types.ObjectId(commentId)
            }
        }
    ])
    if(!likedcomments) return res.json(new Apierror(400,'cannot fetch comments'))
    return res.json(new Apiresponse(200,likedcomments.length,'Fetched likes successfully'))
})
const getisVideoLiked=asynchandler(async(req,res)=>{
    const UserId=req.user?._id;
    const {VideoId}=req.params;
    const isliked=await Like.find({likedby:UserId,video:VideoId});
    if(Array.isArray(isliked) && isliked.length>0)
        return res.json(new Apiresponse(200,true,'Fetched successfully'))
    return res.json(new Apiresponse(200,false,'Fetched successfully'))
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getvideolike,
    getcommentlike,
    getisVideoLiked
}