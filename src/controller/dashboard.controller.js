import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import Apierror from '../utils/apierror.js'
import Apiresponse from '../utils/apiresponse.js'
import {asynchandler} from "../utils/async-handler.js"

const getChannelStats = asynchandler(async (req, res) => {
    const userId=req?.user?._id;
    const stats={};
    const video=await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:'likes',
                localField:'_id',
                foreignField:'video',
                as:'videolike'
            }
        },
        {
          $group:{
            _id:null,
            totallikes:{$sum:{$size:'$videolike'}},
            totalviews:{$sum:'$views'},
            totalvideo:{$sum:1}
          }  
        }
    ])
    stats.totallikes=video.length>0?video[0].totallikes:0
    stats.totalviews=video.length>0?video[0].totalviews:0
    stats.totalvideo=video.length>0?video[0].totalvideo:0
    const subscriber=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id:null,
                totalsubscribers:{$sum:1}
            }
        }
    ])
    stats.totalsubscribers=subscriber.length>0?subscriber[0].totalsubscribers:0
    return res.json(new Apiresponse(200,stats,'Channel Stats Fetched successfully'))
})


export {
    getChannelStats, 
    
    }