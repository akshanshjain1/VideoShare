import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import Apierror from "../utils/apierror.js";
import Apiresponse from "../utils/apiresponse.js";
import { asynchandler } from "../utils/async-handler.js";
import uploadoncloudinary from "../utils/cloudinary-fileupload.js";
import deletefromcloudinary from "../utils/cloudinary-filedelete.js";
import generateresponse from "../utils/generative-ai.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import deleteFromCloudinaryVideo from "../utils/cloudinary-videodelete.js";
import { Notification } from "../models/notification.model.js";
import { Playlist } from "../models/playlist.model.js";

const getAllVideos = asynchandler(async (req, res) => {
  const {
    page = 1,
    limit = 100,
    query = "",
    sortBy = "views",
    sortType = -1,
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  let matchquery = {};

  if (userId && userId !== "") {
    matchquery.owner = new mongoose.Types.ObjectId(userId);
  } else if (query && query !== "")
    matchquery.title = { $regex: query, $options: "i" };

  if (!query && !userId) matchquery = {};
  matchquery.ispublished = true;

  const videos = await Video.aggregate([
    {
      $match: matchquery,
    },
    {
      $sort: { [sortBy /*[] sortby==(*sortby) in cpp */]: parseInt(sortType) },
    },
    {
      $skip: (parseInt(page) - 1) * parseInt(limit),
    },
    {
      $limit: parseInt(limit),
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
        owneravatar: {
          $first: "$ownerdetails.avatar",
        },
        ownername: {
          $first: "$ownerdetails.fullname",
        },
        ownerusername: {
          $first: "$ownerdetails.username",
        },
      },
    },
    {
      $project: {
        videofile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        ispublished: 1,
        createdAt: 1,
        updatedAt: 1,
        owneravatar: 1,
        ownername: 1,
        ownerusername: 1,
      },
    },
  ]);

 
  if (!videos || videos.length === 0) {
    return res.json(new Apierror(400, "No video exist"));
  }
  return res.json(new Apiresponse(200, videos, "Video Fetched Successfully"));
});

const publishAVideo = asynchandler(async (req, res) => {
  const { title, description } = req.body;
  const UserId = req.user?._id;

  if (
    !req.files ||
    !Array.isArray(req.files.videofile) ||
    !(req.files.videofile.length > 0)
  )
    throw new Apierror(400, "videofile is required");
  const videofilelocalpath = req.files.videofile[0]?.path;
  if (!videofilelocalpath) throw new Apierror(400, "videofile is required");
  
  if (
    !req.files ||
    !Array.isArray(req.files.thumbnail) ||
    !(req.files.thumbnail.length > 0)
  )
    throw new Apierror(400, "thumbnail is required");
  const thumbnaillocalpath = req.files.thumbnail[0]?.path;
  if (!thumbnaillocalpath) throw new Apierror(400, "thumbnail is required");
  

  const videofile = await uploadoncloudinary(videofilelocalpath);
  
  if (!videofile) throw new Apierror(500, "Video not uploaded");
  const thumbnail = await uploadoncloudinary(thumbnaillocalpath);
  if (!thumbnail) throw new Apierror(500, "Could not upload thumbnail");
 

  const newVideo = new Video({
    videofile: videofile.url,
    thumbnail: thumbnail.url,
    title: title,
    description: description,
    duration: videofile.duration,
    views: 0,
    ispublished: true,
    owner: UserId,
  });
  const newvideo=await newVideo.save();
  return res.json(new Apiresponse(200, newvideo, "Video Uploaded Successfully"));
});

const getVideoById = asynchandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  
  if (!video) return res.json(new Apierror(400, "Video not found"));
  return res.json(new Apiresponse(200, video, "Successfully fetched Video"));
});


const updatevideoviews = asynchandler(async (req, res) => {
  const { videoId } = req.params;
  const oldvideo = await Video.findById(videoId);
  oldvideo.views = oldvideo.views + 1;
  await oldvideo.save();
  return res.json(new Apiresponse(200, [], "View increased"));
});
const updateVideo = asynchandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const oldvideo = await Video.findById(videoId);

  const oldthumbnailurl = oldvideo.thumbnail;

  const thumbnaillocalpath = req.file?.path;
  if (!thumbnaillocalpath) throw new Apierror(400, "thumbnail is required");
  

  const thumbnail = await uploadoncloudinary(thumbnaillocalpath);
  if (!thumbnail) throw new Apierror(500, "Could not upload thumbnail");
  await deletefromcloudinary(oldthumbnailurl);

  oldvideo.thumbnail = thumbnail.url;
  oldvideo.title = title;
  oldvideo.description = description;
  await oldvideo.save();
  return res.json(new Apiresponse(200, [], "Video updated successfully"));
});

const deleteVideo = asynchandler(async (req, res) => {
   
    
  const { videoId } = req.params;
  const oldvideo = await Video.findById(videoId);
  if (!oldvideo) return res.json(new Apierror(400, "file not exist"));
  const oldvideourl = oldvideo.videofile;
  const oldthumbnailurl = oldvideo.thumbnail;
  await deletefromcloudinary(oldthumbnailurl);
  await deleteFromCloudinaryVideo(oldvideourl);
  await Like.deleteMany({ video: videoId });
  await Comment.deleteMany({ video: videoId });
  await Notification.deleteMany({ video: videoId });
  await Playlist.updateMany(
    { videos: videoId },
    { $pull: { videos: videoId } }
  );
  await Video.findByIdAndDelete(videoId);
  return res.json(new Apiresponse(200, [], "Video Deleted successfully"));
});
const getcurrentuservideo=asynchandler(async(req,res)=>{
    const userId = req.user?._id;

    const videos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
    ]);
    if (!videos) return res.json(new Apierror(400, "NO video found"));
    return res.json(new Apiresponse(200, videos, "Video Fetched Successfully"));
})

const togglePublishStatus = asynchandler(async (req, res) => {
  const { videoId } = req.params;
  const oldvideo = await Video.findById(videoId);
  if (!oldvideo) return res.json(new Apierror(400, "file not exist"));
  oldvideo.ispublished = !oldvideo.ispublished;
  const ispublished = oldvideo.ispublished;
  await oldvideo.save();
  return res.json(new Apiresponse(200, ispublished, "Toggled Successfully"));
});
const getvideoautogeneration = asynchandler(async (req, res) => {
  const { query } = req.query;
  const prompt = `Here is a query that user written enclosed in brackets (${query})
    now generate 3 different video titles of 5-7 words and corresponding video description  
    on basis of user query making relavance with the query also write some trending 
    hashtag related with topic only whole description should  be  of 50 words, only write plane text
    also when generating generate 
    like title_1|description_1||title_2|description_2||title_3|description_3
    and try to be some what innovative also
    `;
  const response = await generateresponse(prompt);
  
  const titledesarray = response.split("||").map((item) => {
    const [title, description] = item.split("|");
    return {
      title: title.trim(),
      description: description.trim(),
    };
  });
  return res.json(
    new Apiresponse(200, titledesarray, "Generated Successfully")
  );
});
export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  
  updateVideo,
  deleteVideo,
  getvideoautogeneration,
  updatevideoviews,
  togglePublishStatus,
  getcurrentuservideo
};
