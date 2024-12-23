import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import Apierror from "../utils/apierror.js";
import Apiresponse from "../utils/apiresponse.js";
import { asynchandler } from "../utils/async-handler.js";

const createTweet = asynchandler(async (req, res) => {
  const { content } = req.body;
  const UserId = req.user?._id;
  const tweet = new Tweet({
    content: content,
    owner: UserId,
  });
  const newtweet = await tweet.save();
  return res.json(new Apiresponse(200, newtweet, "Posted Successfully"));
});

const getUserTweets = asynchandler(async (req, res) => {
  const { userId } = req.params;
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "tweetlike",
      },
    },
    {
        $addFields:{
            likes:{
                $size:'$tweetlike'
            },
            islikedbyuser:{
                $cond:{
                    if:{$in:[req.user?._id,"$tweetlike.likedby"]},
                    then:true,
                    else:false
                }
            }
        }
    },
    {
        $project:{
            content:1,
            owner:1,
            createdAt:1,
            updatedAt:1,
            likes:1,
            islikedbyuser:1
        }
    }
  ]);
  return res.json(new Apiresponse(200,tweets , "Fetched Successfully"));
});

const updateTweet = asynchandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const newtweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: content,
      },
    },
    {
      new: true,
    }
  );
  return res.json(new Apiresponse(200, newtweet, "Tweet Updated Successfully"));
});

const deleteTweet = asynchandler(async (req, res) => {
  const { tweetId } = req.params;
  await Tweet.findByIdAndDelete(tweetId);
  return res.json(new Apiresponse(200, [], "Tweetdeleted Successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
