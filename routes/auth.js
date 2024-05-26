const express=require('express');
const upload = require('../middleware/upload');
const router=express.Router();
const{loginUser,signUpUser}=require('../controllers/userController')
const {loginUsingGoogle}=require('../controllers/auth/google');
const { forgotPassword, validateForgotOTP, sendOTP, validateOTP, resentOTP, newPassword } = require('../controllers/otpController');

//Auth
router.post('/signup',upload.single("profileImgURL"),signUpUser)
router.post('/login',loginUser)
router.post('/google',loginUsingGoogle)
//forget password
router.post('/forget-password',forgotPassword);
router.post('/forget-password-validate-otp',validateForgotOTP)
// Set new password
router.post("/set-new-password",newPassword);

//OTP
router.post('/send-otp',sendOTP)
router.post('/validate-otp',validateOTP);
router.post('/resend-otp',resentOTP)

module.exports=router;