const cron = require("node-cron");
const mongoose = require("mongoose");
const CatOffer = require("../model/categoryoffer");
const Product = require("../model/ProductModel");
const checkoffer = async () => {
  try {
    console.log("cron job working");
    // Find active offers within the date range
    const currentDate = new Date();
    const activeOffers = await CatOffer.find({
      endingDate: { $gte: currentDate },
    });

    for (const offers of activeOffers) {
      const products = await Product.find({ category: offers.category });
      for (const product of products) {
        if (product.offer > 0) {
          product.offer -= offers.offer;
          await product.save();
          console.log("offer deleted successfully");
        }
      }
    }
  } catch (error) {
    console.error(error, "error of updating cateogory offer");
  }
};

// cron.schedule("*/10 * * * * *", async () => {
//   try {
//     await checkoffer();
//   } catch (error) {
//     console.error("Error in cron job:", error);
//   }
// });
module.exports = checkoffer;

//
