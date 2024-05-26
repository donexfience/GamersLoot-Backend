const mongoose=require('mongoose');
const { sendOTPMail } = require('../util/mailFunction');

const otpSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    otp:{
        type:Number,
        required:true
    },
    createAt:{
        type:Date,
        default:Date.now,
        expires:60*5
    }

})
async function senderVerificationEmail(email,otp){
    try{
        sendOTPMail(email,otp)
    }
    catch(error){
        console.log("Error occured while sending the email",error);
        throw error
    }
}
otpSchema.pre("save", async function (next) {
    console.log("New document saved to the database");
  
    if (this.isNew) {
      await senderVerificationEmail(this.email, this.otp);
    }
    next();
  });
  module.exports=mongoose.model('OTP',otpSchema);