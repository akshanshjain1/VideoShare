import mongoose from 'mongoose'
import { DB_NAME } from './src/constants.js'
import connectdb from './src/db/dbconnect.js'
import dotenv from 'dotenv'
import server from './src/server.js'

dotenv.config({
    path:'./env'
})

connectdb().then(()=>{
   server.listen(process.env.PORT||8000,()=>{
        console.log('server connected')
    }).timeout = 120000;
}).catch((error)=>{
    console.log("mongo connnection failed",error)
});





// 1st approach 
// iife
// import express from 'express'
// const app=exrpess() 
// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//         app.on('error',(error)=>{
//             console.log('error',error);
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log("done")
//         })
//     }
//     catch(error){
//         console.log("error",error)
//         throw error
//     }
// })()