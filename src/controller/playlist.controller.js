import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import Apierror from "../utils/apierror.js";
import Apiresponse from "../utils/apiresponse.js";
import { asynchandler } from "../utils/async-handler.js";
import uploadoncloudinary from "../utils/cloudinary-fileupload.js";
import deletefromcloudinary from "../utils/cloudinary-filedelete.js";

const createPlaylist = asynchandler(async (req, res) => {
  const { name, description } = req.body;
  const UserId = req.user?._id;
  if (!UserId) return res.json(new Apierror(200, "user not authenticated"));
  const playlist = new Playlist({
    owner: UserId,
    name,
    description,
    thumbnail: `https://res.cloudinary.com/dakzbhfni/image/upload/v1734449651/iewusxwr7ik80a55g6wu.jpg`,
  });
  await playlist.save();
  return res.json(new Apiresponse(200, [], "Playlist Created"));
});

const getUserPlaylists = asynchandler(async (req, res) => {
  const { userId } = req.params;
  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "onwerdetails",
      },
    },
    {
      $addFields: {
        size: {
          $size: "$videos",
        },
      },
    },
    {
      $project: {
        owner: 1,
        videos: 1,
        name: 1,
        description: 1,
        size: 1,
        onwerdetails: 1,
        createdAt: 1,
        thumbnail: 1,
      },
    },
  ]);
  return res.json(
    new Apiresponse(200, playlist, "Playlist Fetched SuccessFully")
  );
});

const getPlaylistById = asynchandler(async (req, res) => {
  const { playlistId } = req.params;
  // const playlist=await Playlist.findById(playlistId)
  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "onwerdetails",
      },
    },
    {
      $addFields: {
        size: {
          $size: "$videos",
        },
      },
    },
    {
      $project: {
        owner: 1,
        videos: 1,
        name: 1,
        description: 1,
        size: 1,
        onwerdetails: 1,
        createdAt: 1,
        updatedAt: 1,
        thumbnail: 1,
      },
    },
  ]);
  return res.json(new Apiresponse(200, playlist, "Fetched Successfully"));
});

const addVideoToPlaylist = asynchandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const playlist = await Playlist.findById(playlistId);
  if (!playlist.videos.includes(videoId)) playlist.videos.push(videoId);
  await playlist.save();
  return res.json(new Apiresponse(200, [], "Video Added Successfully"));
});

const removeVideoFromPlaylist = asynchandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const playlist = await Playlist.findById(playlistId);
  const newVideolist = playlist.videos.filter((videoid) => videoid != videoId);
  playlist.videos = newVideolist;
  await playlist.save();

  return res.json(new Apiresponse(200, [], "Video removed Successfully"));
});

const deletePlaylist = asynchandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await Playlist.findByIdAndDelete(playlistId);

  return res.json(new Apiresponse(200, [], "Playlist Deleted"));
});

const updatePlaylist = asynchandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const playlist = await Playlist.findByIdAndUpdate(playlistId, {
    name,
    description,
  });

  return res.json(new Apiresponse(200, [], "Playlist Updated"));
});
const getVideoDetails = asynchandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    // {
    //     $unwind:'$videos'
    // },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videodetails",
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
        owner_username: {
          $first: "$ownerdetails.username",
        },
        owner_avatar: {
          $first: "$ownerdetails.avatar",
        },
        owner_fullname: {
          $first: "$ownerdetails.fullname",
        },
      },
    },
    {
      $project: {
        owner: 1,
        name: 1,
        description: 1,
        videos: 1,
        videodetails: 1,
        owner_username: 1,
        owner_avatar: 1,
        owner_fullname: 1,
      },
    },
  ]);
  return res.json(new Apiresponse(200, playlist, "Fetched Video SuccessFully"));
});

const updatethumbnail = asynchandler(async (req, res) => {
  const UserId = req.user?._id;
  const { playlistId } = req.params;

  const thumbnailpath = req.file?.path;

  if (!thumbnailpath) throw new Apierror(400, "thumbnail is required");

  const thumbnail = await uploadoncloudinary(thumbnailpath);

  if (!thumbnail.url) throw new Apierror(400, "thumbnail is not updated");

  const playlist = await Playlist.findById(playlistId);

  const oldthumbnail = playlist.thumbnail;

  playlist.thumbnail = thumbnail.url;
  await playlist.save();

  await deletefromcloudinary(oldthumbnail);

  return res.json(new Apiresponse(200, [], "Thumbnail updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getVideoDetails,
  updatethumbnail,
};
