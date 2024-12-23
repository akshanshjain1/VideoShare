import mongoose, { Schema } from "mongoose";

const notificationschema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    content: {
      type: String,
    },
    isread: {
      type: Boolean,
      default: false,
    },
    
      video:{
        type:Schema.Types.ObjectId,
        ref:'videos',
      }
    
  },
  { timestamps: true }
);
export const Notification=mongoose.model("Notification",notificationschema)