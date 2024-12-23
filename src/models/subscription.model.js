import mongoose,{Schema} from 'mongoose'
const subscriptionschema=new Schema ({
    subscriber:{
        //it is a user -one who is subscribing
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        // it is a user-one to whom is subscribing
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true});
export const Subscription=mongoose.model("Subscription",subscriptionschema);