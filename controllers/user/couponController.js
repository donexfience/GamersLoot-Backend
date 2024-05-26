const Coupon = require("../../model/couponModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Cart = require("../../model/cartModel");
const getCoupons = async (req, res) => {
  try {
    const TodayDate = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      expirationDate: { $gt: TodayDate },
    });
    return res.status(200).json({ coupons });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    // Find the coupon by code, ensuring it's active and not expired
    const TodayDate = new Date();
    const coupon = await Coupon.findOne({
      code,
      expirationDate: { $gt: TodayDate },
      isActive: true,
    });
    if (!coupon) {
      throw Error("coupon not found");
    }
    if (coupon.used)
      if (!coupon) {
        throw Error("Coupon not found or inactive");
      }

    // Check if the coupon usage limit is reached
    if (coupon.used === coupon.maximumUses) {
      throw Error("Coupon usage limit reached");
    }
    // Verify user ID from JWT token
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid user ID");
    }

    // Find the user's cart and populate items
    const cart = await Cart.findOne({ user: _id }).populate("items.product", {
      name: 1,
      price: 1,
      markup: 1,
    });

    if (!cart) {
      throw Error("Cart is empty");
    }

    // Calculate total price and quantity of items in the cart
    let totalQuantity = 0;
    let sum = 0;
    cart.items.forEach((item) => {
      sum += (item.product.price + item.product.markup) * item.quantity;
      totalQuantity += item.quantity;
    });

    // Check if the total price meets the minimum purchase amount required by the coupon
    if (sum < coupon.minimumPurchaseAmount) {
      throw Error("Total price is less than the coupon purchase limit");
    }
    if (coupon.type === "fixed") {
      if (coupon.value > sum) {
        throw Error("Coupon cant be applied");
      }
    }
    // Update the cart with the coupon details
    const updatedCart = await Cart.findOneAndUpdate(
      { _id: cart._id },
      {
        $set: {
          coupon: coupon._id,
          couponCode: code,
          discount: coupon.value,
          type: coupon.type,
        },
      }
    );

    if (!updatedCart) {
      throw Error("Cart update failed");
    }
    // if we want to reduce the coupon count when removing a coupon
    // coupon.used++;
    // await coupon.save();

    res.status(200).json({
      discount: coupon.value,
      couponType: coupon.type,
      couponCode: code,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
const removeCoupon = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid user ID");
    }

    const cart = await Cart.findOne({ user: _id });
    const couponId = cart.coupon;

    if (!couponId) {
      throw Error("No coupon applied to remove");
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { user: _id },
      { $set: { coupon: null, couponCode: null, discount: null, type: null } },
      { new: true }
    );

    if (!updatedCart) {
      throw Error("Cart update failed");
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw Error("Coupon not found");
    }

    // if we want to reduce the coupon count when removing a coupon
    // coupon.used--;
    // await coupon.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const getSearchcoupon = async (req, res) => {
  const { code, expirationDate, type, minimumPurchaseAmount } = req.query;
  let filter = {};
  if (code) {
    filter.code = code;
  }
  if (expirationDate) {
    filter.expirationDate = expirationDate;
  }
  if (type) {
    filter.type = type;
  }
  if (minimumPurchaseAmount) {
    const minPurchaseAmount = parseFloat(minimumPurchaseAmount);
    // Check if minPurchaseAmount is a valid number
    if (!isNaN(minPurchaseAmount)) {
      filter.minimumPurchaseAmount = minPurchaseAmount;
    }
  }
  const currentDate = new Date();
  filter.expirationDate = { $gte: currentDate };
  try {
    const coupons = await Coupon.find(filter);
    res.status(200).json({ coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getCoupons,
  applyCoupon,
  removeCoupon,
  getSearchcoupon,
};
