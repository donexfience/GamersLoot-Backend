const mongoose = require("mongoose");
const User = require("./userModel");
const Product = require("./ProductModel");

const { Schema } = mongoose;

const wishlistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  items: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: Product,
      },
    },
  ],
},{timestamps:true});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
module.exports = Wishlist;
