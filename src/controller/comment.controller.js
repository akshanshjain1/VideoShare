import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import Apierror from "../utils/apierror.js";
import Apiresponse from "../utils/apiresponse.js";
import { asynchandler } from "../utils/async-handler.js";

const getVideoComments = asynchandler(async (req, res) => {
  //TODO: get all comments for a video
  const UserId = req?.user?._id||'';
  
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const getcomments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },

    {
      $skip: parseInt(page - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "commentlikes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerdetails",
      },
    },
    {
      $addFields: {
        likes: {
          $size: "$commentlikes",
        },
        islikedbyuser:UserId ?{
          $cond: {
            if: { $in: [UserId, "$commentlikes.likedby"] },
            then: true,
            else: false,
          },
        }:false,

        owner_username: {
          $first: "$ownerdetails.username",
        },
        owner_avatar: {
          $first: "$ownerdetails.avatar",
        },
      },
    },
    {
      $project: {
        content: 1,
        likes: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1,
        islikedbyuser: 1,
        owner_username: 1,
        owner_avatar: 1,
      },
    },
  ]);
  if (!getcomments) return res.json(new Apierror(400, "cannot get comments"));
  return res.json(
    new Apiresponse(200, getcomments, "Comments Fetched Successfully")
  );
});

const addComment = asynchandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;
  const newcomment = new Comment({
    content,
    video: videoId,
    owner: userId,
  });
  await newcomment.save();
  return res.json(new Apiresponse(200, [], "Comment added Successfully"));
});

const updateComment = asynchandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const oldcomment = await Comment.findByIdAndUpdate(commentId, {
    $set: {
      content: content,
    },
  });
  return res.json(new Apiresponse(200, "Comment updated Successfully"));
});

const deleteComment = asynchandler(async (req, res) => {
  const { commentId } = req.params;
  await Comment.findByIdAndDelete(commentId);
  return res.json(new Apiresponse(200, "Comment deleted Successfully"));
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  
};
