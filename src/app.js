import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
//some configuration settings
app.use(express.json({
    limit:"16kb"
}))
app.use(express.urlencoded({
    extended:true,  // not necessary to write
    limit:"16kb"
}))
app.use(express.static("public"))
app.use(cookieParser())

// bringing routes
import userrouter from './routes/user.routes.js'
import subscriptionrouter from './routes/subscription.routes.js'
import videorouter from './routes/video.routes.js'
import likerouter from './routes/like.routes.js'
import commentrouter from './routes/comment.route.js'
import playlistrouter from './routes/playlist.route.js'
import tweetrouter from './routes/tweet.route.js'
import notificationrouter from './routes/notification.route.js'
import dashboardrouter from './routes/dashboard.route.js'
import unwatchedtopicrouter from "./routes/unwatchedtopic.js"
import errorHandler from './middlewares/errorhandler.middleware.js';



//acchi practices |routes declaration
app.use("/api/v1/notifications", notificationrouter)
app.use("/api/v1/users", userrouter)
app.use("/api/v1/tweets", tweetrouter)
app.use("/api/v1/subscriptions", subscriptionrouter)
app.use("/api/v1/videos", videorouter)
app.use("/api/v1/comments", commentrouter)
app.use("/api/v1/likes", likerouter)
app.use("/api/v1/playlist", playlistrouter)
app.use("/api/v1/dashboard", dashboardrouter)
app.use("/api/v1/topic-suggestion",unwatchedtopicrouter)

app.use(errorHandler);
//https/localhsot:8000/users/regiter 
export default app