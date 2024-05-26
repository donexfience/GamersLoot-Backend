const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwt = require("jsonwebtoken");
const User = require("../../model/userModel");

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "1d" });
};
const cookieConfig={
    httpOnly:true,
    secure:true,
    maxAge:100*60*60*60
}

const loginUsingGoogle=async (req,res)=>{
    const {token}=req.body;
    const ticket=await client.verifyIdToken({
        idToken:token,
        audience:process.env.GOOGLE_CLIENT_ID
    });
    const {name,email,picture}=ticket.getPayload();
    let user=await User.findOne({email},{password:0})
    if(!user){
        user=await User.create({
            email,
            profileImageURL:picture,
            firstName:name,
            lastName:name,
            isActive:true,
            role:"user",
            isEmailVerified:true
        })

    }
    const user_token=createToken(user._id);
    res.cookie("user_token",user_token,cookieConfig);
    res.status(200).json(user)
}
module.exports={loginUsingGoogle}