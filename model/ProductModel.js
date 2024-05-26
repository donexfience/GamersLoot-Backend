const mongoose = require("mongoose");
const Category = require("./categoryModel");

const { Schema } = mongoose;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    stockQuantity: {
      type: Number,
    },
    imageURL: {
      type: String,
    },
    price: {
      type: Number,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: Category,
    },
    markup: {
      type: Number,
    },
    status: {
      type: String,
      enum: [
        "out of stock",
        "published",
        "low quantity",
        "draft",
        "unpublished",
      ],
    },
    attributes: [
      {
        name: {
          type: String,
        },
        value: {
          type: String,
        },
        isHighlight: {
          type: Boolean,
        },
      },
    ],
    moreImageURL: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
    },
    rating: {
      type: Number,
    },
    numberOfReviews: {
      type: Number,
    },
    offer: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Products", ProductSchema);
module.exports = Product;
