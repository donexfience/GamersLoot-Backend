const express = require("express");
const {
  logoutUser,
  getUserDataFirst,
  editUser,
} = require("../controllers/userController");
const {
  getProducts,
  getProduct,
  getAvailableQuantity,
} = require("../controllers/user/productController");
const { getCategories } = require("../controllers/user/CategoryController");
const {
  getCart,
  addToCart,
  deleteCart,
  deleteOneProduct,
  incrementQuantity,
  decrementQuantity,
  productAvailable,
  couponAvailable,
} = require("../controllers/user/cartController");
const {
  getAddresses,
  getAddress,
  createAddress,
  deleteAddress,
  updateAddress,
} = require("../controllers/user/addressController");
const {
  createOrder,
  getOrder,
  getOrders,
  cancelOrder,
  orderCount,
  returnOrder,
  getCouponUsedOrders,
  getOrdersWithCoupon,
  generateInvoiceOrder,
  RepaymentOrder,
  createfailOrder,
  Reorder,
} = require("../controllers/user/orderController");
const upload = require("../middleware/upload");
const {
  readProductReviews,
  readProductReview,
  createNewReview,
  EditReview,
  readOrderReview,
} = require("../controllers/user/reviewController");
const {
  applyCoupon,
  removeCoupon,
  getSearchcoupon,
} = require("../controllers/user/couponController");
const {
  createRazorPayOrder,
  getKey,
  verifyPayment,
} = require("../controllers/user/paymentController");
const {
  addTowishlist,
  deleteOneProductw,
  deleteWishlist,
  getWishlist,
  addToCartFromWishlist,
} = require("../controllers/user/wishlistController");
const {
  getWalletBalance,
  getWallet,
} = require("../controllers/user/walletController");
const {
  generateInvoicePDF,
} = require("../controllers/user/Invoice/InvoicePdfGen");
const router = express.Router();
//Logout

router.get("/logout", logoutUser);

//to get user data at initial load;

router.get("/", getUserDataFirst);

//edit user profile

router.post("/edit-profile", upload.single("profileImgURL"), editUser);

//products on Dashboard

router.get("/product", getProducts);
router.get("/product/:id", getProduct);
router.get("/product/quantity/:id", getAvailableQuantity);

//getting category for user dashboard

// Category

router.get("/categories", getCategories);

//cart

router.get("/cart", getCart);
router.post("/cart", addToCart);
router.delete("/cart/:id", deleteCart);
router.delete("/cart/:cartId/item/:productId", deleteOneProduct);
router.patch(
  "/cart-increment-quantity/:cartId/item/:ProductId",
  incrementQuantity
);
router.patch(
  "/cart-decrement-quantity/:cartId/item/:productId",
  decrementQuantity
);
//deleting cart if the product is blocked by admin or making stockquantitiy to 0
router.post("/productAvailabile", productAvailable);
//removing the coupon when the admin is removed
router.post('/couponAvailable',couponAvailable)
//address
router.get("/address", getAddresses);
router.get("/address/:id", getAddress);
router.post("/address", createAddress);
router.delete("/address/:id", deleteAddress);
router.patch("/address/:id", updateAddress);

//order
router.post("/order", createOrder);
router.get("/orders", getOrders);
router.get("/RepaymentOrder/:id", RepaymentOrder);
router.get("/getCouponOrders", getOrdersWithCoupon);
router.get("/order/:id", getOrder);
router.post("/cancel-order/:id", cancelOrder);
router.get("/order-count", orderCount);
router.post("/return-order/:id", returnOrder);
router.post("/faildorder", createfailOrder);
router.post("/Reorder", Reorder);

//review
// Reviews
router.get("/reviews/:id", readProductReviews);
router.get("/review/:id", readProductReview);
router.post("/review", createNewReview);
router.patch("/review/:id", EditReview);
// Review on order details page
router.get("/order-review/:id", readOrderReview);

//coupon apply and remove

router.post("/coupon-apply", applyCoupon);
router.get("/coupon-remove", removeCoupon);
router.get("/searchedcoupons", getSearchcoupon);

//razorpay payment config

router.get("/razor-key", getKey);
router.post("/razor-order", createRazorPayOrder);
router.post("/razor-verify", verifyPayment);

//wishlist

router.post("/wishlist", addTowishlist);
router.get("/wishlist", getWishlist);
router.delete("/wishlist/:id", deleteWishlist);
router.delete("/wishlist/:wishlist/item/:productId", deleteOneProductw);
router.post("/wishlist/addToCart", addToCartFromWishlist);

// wallet
router.get("/wallet", getWallet);
router.get("/wallet-total", getWalletBalance);

//invoice for an order

router.get("/order-invoice-pdf/:id", generateInvoiceOrder);
module.exports = router;
