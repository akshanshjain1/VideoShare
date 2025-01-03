import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectdb=async()=>{
    try{    
      const connectioninstance=  await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
      
    }
    catch(error){
        console.log('error connection fail',error)
        process.exit(1)
    }
}
export default connectdb