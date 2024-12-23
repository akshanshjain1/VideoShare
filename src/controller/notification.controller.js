import mongoose from "mongoose";
import { Notification } from "../models/notification.model.js";
import { Subscription } from "../models/subscription.model.js";
import { io } from "../server.js";
import { asynchandler } from "../utils/async-handler.js";
import Apiresponse from "../utils/apiresponse.js";
import { User } from "../models/user.model.js";

const getsubscribers = async (userid) => {
  try {
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(userid),
        },
      },
    ]);
    return subscribers;
  } catch (error) {
    
    return [];
  }
};

const sendnotifications = async (videodetails,origin) => {
  
  
  const ownerid = videodetails.owner;
  const ownerdetail = await User.findById(ownerid);
  const subscribers = await getsubscribers(ownerid);
  if (!subscribers || (Array.isArray(subscribers) && subscribers.length === 0))
    return res.json(
      new Apiresponse(200, [], "Notification send to all Subscribers")
    );
  for (const subscriber of subscribers) {
    const socketid = io.onlineuser[subscriber.subscriber];
    const notification = new Notification({
      userId: subscriber.subscriber,
      content: `${ownerdetail.fullname} has posted a new video:${videodetails.title}
                  <a href="${origin}/video/${videodetails._id}">Click to check out</a>`,
      isread: false,
      video:videodetails._id
    });
    const newnotification = await notification.save();
    if (socketid) {
      io.to(socketid).emit("newNotification", newnotification);
      io.to(socketid).emit('NotificationAvail',1)
      
    }
  }
  return "notification send successfully"
};
const unreadnotification = asynchandler(async (req, res) => {
  
  const {userId} = req.params;
  
  const unreadnotifications = await Notification.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isread: false,
      },
    },
    {
      $sort:{
        createdAt:-1
      }
    }
    
  ])
  
  await Notification.updateMany({
    userId:userId,isread:false
  },
{
  $set:{
    isread:true
  }
})
  return res.json(new Apiresponse(200,unreadnotifications,"Unread notification fetched successfully")
  );
});

const readnotification = asynchandler(async (req, res) => {
  const {userId} = req.params;

  const readnotifications = await Notification.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isread: true,
      },
    },
    {
      $sort:{
        createdAt:-1
      }
    }
    
  ]);
  return res.json(new Apiresponse(200, readnotifications, "Unread notification fetched successfully"));
});

export { sendnotifications, unreadnotification, readnotification };
