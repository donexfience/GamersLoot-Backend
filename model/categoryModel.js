const mongoose=require('mongoose');
const {Schema}=mongoose;
const categorySchema= new Schema({
    name:{
        type:String,
        required:true,
    
    },
    description:{
        type:String
    },
    imgURL:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:true
    },
    offer:{
        type:Number,
        default:0,
    
    },
    offferEndDate:{
        type:Date
    }
},
    {timestamps:true}
)
const Category=mongoose.model("Category",categorySchema);
module.exports=Category