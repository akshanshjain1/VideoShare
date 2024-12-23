import express from 'express'
import app from './app.js'
import {Server} from 'socket.io'
import {createServer} from 'http'
import { Notification } from './models/notification.model.js'
import { sendnotifications } from './controller/notification.controller.js'



const server =createServer(app)
const io=new Server(server,{
    cors:{
    origin:'*',
    methods:["GET","POST"],
    credentials:true
}
})
io.onlineuser={}
io.on('connection',(socket)=>{
    const origin = socket.handshake.headers.origin;
    socket.on('setUser',(userid)=>{
        for (const id in io.onlineuser) {
            if (io.onlineuser[id] === socket.id) delete io.onlineuser[id];
          }
        io.onlineuser[userid]=socket.id
       
        
    })
    socket.on('sendnotification',async(videodetails)=>{
       
        try {
           const result= await sendnotifications(videodetails,origin);
           socket.emit("notificationStatus",{status:"success",message:'Notification send successfully from backend'})
        } catch (error) {
           
            socket.emit("notificationStatus", {
                    status: "error",
                    message: "Failed to send notifications",
      });
        }
    })
    
    socket.on('notificationreaded',async(notificationId)=>{
        try {
            await Notification.findByIdAndUpdate(notificationId,{
                $set:{
                    isread:true
                }
            })
        } catch (error) {
            
        }
})
    socket.on('disconnect',()=>{
        for(const userId in io.onlineuser){
            if(io.onlineuser[userId]===socket.id){
                delete io.onlineuser[userId];
                break;}
        }
    })
})

export {io}
export default server