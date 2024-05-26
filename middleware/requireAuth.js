const jwt=require('jsonwebtoken');
const { default: mongoose } = require('mongoose');
const User = require('../model/userModel');
const requireAuth=async (req,res,next)=>{
    try{
        const token=req.cookies.user_token;
        if(!token){
            throw Error("no token found")
        }
        const {_id}=jwt.verify(token,process.env.SECRET);
        if(!mongoose.Types.ObjectId.isValid(_id)){
            throw Error("Invalid ID");
            
        }
        const user=await User.findOne({_id});
        if(!user){
            throw Error("cannot find such a user");
        }
        if(!user.isActive){
             res.status(401);
            throw Error("User is blocked by admin")
        }
        next();
    }
    catch(error){
        console.error("error while auth:",error)
        res.status(404).json({error:error.message})
        
    }
};
const requireAdminAuth =async (req,res,next)=>{
   try{
    const token=req.cookies.user_token;
    const {_id}=jwt.verify(token,process.env.SECRET);
    if(!mongoose.Types.ObjectId.isValid(_id)){
        throw Error("Invalid ID")
    }
    const user=await User.findOne({_id});
    if(!user){
        throw Error("cannot find a user")
    }
    if(!user.isActive){
        res.status(401);
        throw Error("User is blocked by Admin")
    }
    if(user.role!=="admin" && user.role!=="superAdmin"){
        throw Error("Unauthorized access")
    }
    next();
   }
   catch(error){
    console.error(error,'------admin--------------')
    res.status(404).json({error:error.message})
   }
}
module.exports={requireAdminAuth,requireAuth}