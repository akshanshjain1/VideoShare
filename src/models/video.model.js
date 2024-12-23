import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from
 'mongoose-aggregate-paginate-v2'
const videoschema=new Schema({
    videofile:{
        type:String,  // cloudnary url
        required:[true,"video required"]
    },
    thumbnail:{
        type:String,  // cloudnary url
        required:[true,"thumbnail required"]
    },
    title:{
        type:String,  
        required:[true,"title required"]
    },
    description:{
        type:String,  
        required:[true,"description required"]
    },
    duration:{
        type:Number, // cloudnary se duration
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    ispublished:{
        type:Boolean,
        default:true

    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
     

},{timestamps:true});
videoschema.plugin(mongooseAggregatePaginate)
export const Video=mongoose.model("Video",videoschema);