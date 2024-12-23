import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFromCloudinary = async (url) => {
    try {
        // Extract public_id from the URL by removing the domain and transformation segments
        const regex = /\/(?:v\d+\/)?([^/.]+)(?:\.[a-zA-Z0-9]+)?$/;


        const match = url.match(regex);
        const result = await cloudinary.uploader.destroy(match[1],{invalidate:true});
       
    } catch (error) {
       console.log(error)
    }
};

export default deleteFromCloudinary;

// Sample URL
// "https://res.cloudinary.com/your-cloud-name/video/upload/v1234567890/sample-folder/sample-file.mp4"
