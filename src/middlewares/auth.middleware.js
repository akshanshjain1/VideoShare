import { User } from "../models/user.model.js";
import Apierror from "../utils/apierror.js";
import { asynchandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";
export const verifyjwt=asynchandler(async(req,_,next)=>{
    try {
        const token=req.cookies?.accesstoken|| req.header("Authorization")?.replace('Bearer ','');
        if(!token){
            
            throw new Apierror(401,'unauthorized request')}
    
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const finduser=await  User.findById(decodedToken?._id).select(
            '-password -refreshtoken'
        );
        if(!finduser)
            throw new Apierror(401,'invalid access token');
        req.user=finduser;
        
        next();
    
    } catch (error) {
        throw new Apierror(401,error?.message || 'invalid access token')
    }
})
