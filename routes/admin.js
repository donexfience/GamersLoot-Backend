const express = require("express");
const {
  deleteCategory,
  getCategory,
  getCategories,
  updateCategory,
  createCategory,
  createCatOffer,
} = require("../controllers/admin/categoryController");
const router = express.Router();
const upload = require("../middleware/upload");
const { requireAdminAuth } = require("../middleware/requireAuth");
const {
  getProduct,
  createProducts,
  addProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/admin/productController");
const {
  getCustomer,
  getCustomers,
  blockOrUnblockCustomer,
} = require("../controllers/admin/customerController");
const {
  getOrders,
  clearOrder,
  getOrder,
  updateOrderStatus,
  getReturnOrders,
  updateReturnOrderStatus,
  getCouponUsedOrders,
} = require("../controllers/admin/orderController");
const {
  getCoupons,
  getCoupon,
  addCoupon,
  deleteCoupon,
  editCoupon,
} = require("../controllers/admin/couponController");
const {
  generateOrderPDF,
  generateOrderExcel,
} = require("../controllers/admin/orderExportController");
const {
  BestSellingProducts,
  BestSellingCategory,
} = require("../controllers/admin/BestSellingController");
const {
  TotalSales,
  TotalProfit,
  TotalUserCount,
  TotalRevenue,
} = require("../controllers/admin/dashController");

//category controller functions mounting them to corresponding suiitable routes

router.get("/categories", getCategories);
router.get("/category/:id", getCategory);
router.delete("/category/:id", deleteCategory);
router.patch("/category/:id", upload.single("imgURL"), updateCategory);
router.post(
  "/category",
  requireAdminAuth,
  upload.single("imgURL"),
  createCategory
);
router.post("/category/offer", createCatOffer);

//product controller functions mounting them to corresponding suitabele routes
router.get("/products", getProduct);
router.get("/product/:id", getSingleProduct);
router.patch("/product/:id", upload.any(), updateProduct);
router.delete("product/:id");
router.post("/product", upload.any(), addProduct);
router.delete("/product/:id", deleteProduct);

//customer controller functions mounting them to corresponding suitable routes

router.get("/customers", getCustomers);
router.get("/customer/:id", getCustomer);
router.delete("/customer/:id");
router.patch("/customer/:id");
router.post("/customer", upload.any());
router.patch("/customer-block-unblock/:id", blockOrUnblockCustomer);

//order controller functions mounting them to corresponding suitable routes
router.get("/orders", getOrders);
router.get("/clear-orders", clearOrder);
router.get("/orders/:id", getOrder);
router.patch(`/order-status/:id`, updateOrderStatus);
router.get("/return-orders", getReturnOrders);
router.patch("/order-return-status/:id", updateReturnOrderStatus);

// couopns controller functions mounting them to corresponding suitable routes

router.get("/coupons", getCoupons);
router.get("/coupon/:id", getCoupon);
router.post("/coupons", addCoupon);
router.delete("/coupons/:id", deleteCoupon);
router.patch("/coupon/:id", editCoupon);

router.get("/order-generate-pdf", generateOrderPDF);
router.get("/order-generate-excel", generateOrderExcel);

//Admin DashBoard routes for fetching best selling related item

router.get("/BestSellingProducts", BestSellingProducts);
router.get("/BestSellingCategory", BestSellingCategory);

//Dashboard charts routes

router.get("/TotalSales", TotalSales);
router.get("/TotalProfit", TotalProfit);
router.get("/TotalUsers", TotalUserCount);
router.get('/TotalRevenue',TotalRevenue )
module.exports = router;
