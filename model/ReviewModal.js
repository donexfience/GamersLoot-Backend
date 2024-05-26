const mongoose = require("mongoose");
const User = require("./userModel");
const Product = require("./ProductModel");
const Order = require("./orderModel");
const { Schema } = mongoose;
const reviewSchema = new Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: User,
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: Product,
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: Order,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Review", reviewSchema);
