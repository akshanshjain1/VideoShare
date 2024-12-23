import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import {Subscription} from '../models/subscription.model.js'  
import Apierror from "../utils/apierror.js" 
import Apiresponse from '../utils/apiresponse.js'
import {asynchandler} from "../utils/async-handler.js"

const isSubscribed=asynchandler(async(req,res)=>{
    const {channelId} = req.params
    const userId=req?.user._id;
    
    if (!mongoose.isValidObjectId(channelId)) {
        console.error("Invalid channelId");
        return res.status(400).json(new Apiresponse(400, false, "Invalid channelId"));
      }
    
    const subscribe=await Subscription.find({
        subscriber:userId,
        channel:channelId,
    });
    
   if(subscribe.length>0){
        
      return   res.json(new Apiresponse(200,true,'Fetched Successfully'))
    }
    
    return  res.json(new Apiresponse(200,false,'Fetched Successfully'))

})
const toggleSubscription = asynchandler(async (req, res) => {
    const {channelId} = req.params
    const userId=req.user?._id;
    const subscribe=await Subscription.find({subscriber:userId,channel:channelId});
    
    
    if(subscribe.length>0){
        await Subscription.deleteOne({_id:subscribe[0]?._id})
       return  res.json(new Apiresponse(200,[],'Unsubscribed Successfully'))
    }
    const newSubscribe=new Subscription({
        subscriber:userId,
        channel:channelId
    })
    await newSubscribe.save();
  return  res.json(new Apiresponse(200,[],'Subscribed Successfully'))
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
    const {channelId} = req.params
    const subscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
           $lookup:{
                from:'users',
                localField:'subscriber',
                foreignField:'_id',
                as:'subscriberdetails'
           }
        },
        {
            $addFields:{
                name:{
                    $first:'$subscriberdetails.fullname'
                },
                email:{
                    $first:'$subscriberdetails.email'},
                avatar:{
                    $first:'$subscriberdetails.avatar'},
                username:{
                        $first:'$subscriberdetails.username'
                    }    
            }
        },
       
        {
            $project: {
                _id:1,
                username:1,
               name:1,
               email:1,
               avatar:1,
             
            }
        }
    ])
    
    return res.json(new Apiresponse(200,subscribers,'fetched subscribers successfully'))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
    const { subscriberId } = req.params
    const subscribers=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
           $lookup:{
                from:'users',
                localField:'channel',
                foreignField:'_id',
                as:'channeldetails',
                pipeline:[
                    {
                        $lookup:{
                            from:'subscriptions',
                            localField:'_id',
                            foreignField:'channel',
                            as:'channelcount'

                        }
                    }
                ]
           }
        },
        {
            $addFields:{
                name:{
                    $first:'$channeldetails.fullname'
                },
                email:{
                    $first:'$channeldetails.email'},
                avatar:{
                    $first:'$channeldetails.avatar'},
                username:{
                    $first:'$channeldetails.username'
                },
                channelsubscribernumber:{
                    $size:'$channeldetails.channelcount'
                }    
            }
        },
       
        {
            $project: {
                _id:1,
                username:1,
               name:1,
               email:1,
               avatar:1,
                channelsubscribernumber:1
            }
        }
    ])
    
    return res.json(new Apiresponse(200,subscribers,'fetched subscribed channels successfully'))


})

export {
    isSubscribed,
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}