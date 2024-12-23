import mongoose ,{Schema } from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import Apierror from '../utils/apierror.js'
const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        
    },
    fullname:{
        type:String,
        required:true,
        
        trim:true,
        index:true
    },
    avatar:{
        type:String ,// cloudinary url
        required:true,
        
    },
    coverimage:{
        type:String
    },
    watchhistory:[
        {
            type:Schema.Types.ObjectId,
            
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true, "password is  required"]
    },
    refreshtoken:{
        type:String
    },
    about:{
        type:String,
        
    }

},{timestamps:true})
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10)
      next()
    }
    else 
        return next();
    
})
userSchema.methods.ispasswordcorrect=async function(password){
   return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateaccesstoken=function(){
   return jwt.sign({
        //palyload
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname
    },process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generaterefreshtoken=function(){
    return jwt.sign({
        //palyload
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname
    },process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User=mongoose.model("User", userSchema)