import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,

})

const uploadoncloudinary=async(localfilepath)=>{
    try{
        if(!localfilepath) {
            throw new Error('could not file path')
        }
       const response= await cloudinary.uploader.upload(localfilepath,{
            resource_type:'auto',
            
        },(error,result)=>{
            if(error)
                    console.log('error in upload',error);
            else console.log('success in upload')    
        })
        
        
        fs.unlinkSync(localfilepath);
        return response;

    }
    catch(error){
        fs.unlinkSync(localfilepath) 
           
        
        return null;
    }
}
export default uploadoncloudinary