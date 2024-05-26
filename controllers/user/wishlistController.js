const jwt = require("jsonwebtoken");
const Product = require("../../model/ProductModel");
const Wishlist = require("../../model/wishlistModel");
const mongoose = require("mongoose");
const Cart = require("../../model/cartModel");

const getWishlist = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    console.log(token);
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid user Id");
    }
    console.log(_id);
    const wishlist = await Wishlist.findOne({ user: _id })
      .populate("items.product", {
        name: 1,
        imageURL: 1,
        price: 1,
        markup: 1,
        status:1
      })
      .sort({ createdAt: -1 });
      console.log(wishlist,"---------")
    res.status(200).json({ wishlist });
    
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: error.message });
  }
};
const addTowishlist = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    const items = req.body;
    const product = await Product.findById(items.product);
    if (!product) {
      throw Error("No such product ");
    }
    let wishlist = {};
    const exist = await Wishlist.findOne({ user: _id });
    if (exist) {
      const existingProductIndex = exist.items.findIndex((item) => {
        return item.product.equals(items.product);
      });
    console.log(exist,existingProductIndex,"exxxxist",)

      if (existingProductIndex !== -1) {
        wishlist = await Wishlist.findOneAndUpdate(
          {
            "items.product": items.product,
            user: _id,
          },
          { new: true }
        );
      } else {
        wishlist = await Wishlist.findOneAndUpdate(
          {
            user: _id,
          },
          { $push: { items: { product: items.product } } },
          { new: true }
        );
      }
    } else {
      wishlist = await Wishlist.create({
        user: _id,
        items: [{ product: items.product }],
      });
    }
    console.log(wishlist,"-----------")
    res.status(200).json({ wishlist: wishlist });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteWishlist = async (req, res) => {
  try {
    console.log(req.params)
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID");
    }
    const wishlistItem = await Wishlist.findOneAndDelete({ _id: id });
    if (!wishlistItem) {
      throw Error("No such Cart");
    }
    res.status(200).json({ wishlistItem });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const deleteOneProductw = async (req, res) => {
  try {
    console.log(req.params)
    const { wishlist, productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw Error("Invalid Product !!!");
    }
    if (!mongoose.Types.ObjectId.isValid(wishlist)) {
      throw Error("Invalid wishlist !!!");
    }
    const updatedWishlist = await Wishlist.findByIdAndUpdate(wishlist, {
      $pull: {
        items: { product: productId },
      },
    });
    if (!updatedWishlist) {
      throw Error("invalid Product");
    }
    res.status(200).json({ productId });
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: error.message });
  }
};
const addToCartFromWishlist = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    const items = req.body;
    console.log("🚀 ~ file: cartController.js:32 ~ addToCart ~ items:", items);

    const product = await Product.findById(items.product);
    if (!product) {
      throw new Error("product not found");
    }
    if (product.stockQuantity < items.quantity) {
      throw new Error("Insufficient stock Quantity");
    }
    let cart = {};
    const exists = await Cart.findOne({ user: _id });
    console.log(
      "🚀 ~ file: cartController.js:43 ~ addToCart ~ exists:",
      exists
    );

    //checking product exist
    if (exists) {
      const existingProductIndex = exists.items.findIndex((item) => {
        return item.product.equals(items.product);
      });
      console.log(
        "🚀 ~ file: cartController.js:50 ~ existingProductIndex ~ existingProductIndex:",
        existingProductIndex
      );

      if (existingProductIndex !== -1) {
        //checking product quantity existence
        if (
          product.stockQuantity < exists.items[existingProductIndex].quantity
        ) {
          throw Error("Not enough Product Available to add ");
        }
        cart = await Cart.findOneAndUpdate(
          { "items.product": items.product, user: _id },
          {
            $inc: {
              "items.$.quantity": items.quantity,
            },
          },
          { new: true }
        );
        console.log(cart, "---------------------------");
      } else {
        //if product doesnt exist in the cart, add it
        cart = await Cart.findOneAndUpdate(
          { user: _id },
          {
            $push: {
              items: { product: items.product, quantity: items.quantity },
            },
          },
          { new: true }
        );
      }
    } else {
      //If the cart doesn't exist,create new one with item
      cart = await Cart.create({
        user: _id,
        items: [{ product: items.product, quantity: items.quantity }],
      });
    }
    res.status(200).json({ cart: cart });
  } catch (error) {
    console.log("🚀 ~ file: cartController.js:83 ~ addToCart ~ error:", error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getWishlist,
  addTowishlist,
  deleteOneProductw,
  deleteWishlist,
  addToCartFromWishlist
};
