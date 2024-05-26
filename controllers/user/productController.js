const Product = require("../../model/ProductModel");
const mongoose = require("mongoose");
const Order = require("../../model/orderModel");
const findProductWithMostOrders = async () => {
  try {
    const productOrdersCount = await Order.aggregate([
      { $unwind: "$products" },
      { $group: { _id: "$products.productId", ordersCount: { $sum: 1 } } },
      { $sort: { ordersCount: -1 } },
      { $limit: 1 },
    ]);

    if (productOrdersCount.length > 0) {
      const productId = productOrdersCount[0]._id;
      const mostOrderedProduct = await Product.find({ _id: productId });
      console.log(mostOrderedProduct, "==============================");
      return mostOrderedProduct;
    }

    return null;
  } catch (error) {
    console.error("Error finding product with most orders:", error);
    throw error;
  }
};
async function getProductsSortedByRating() {
  try {
    // Aggregate pipeline to calculate average rating
    const pipeline = [
      {
        $match: { status: "published" },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "product",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" }, // Calculate average rating
        },
      },
      {
        $sort: { averageRating: -1 }, // Sort products by average rating descending
      },
    ];

    const products = await Product.aggregate(pipeline);

    return products;
  } catch (error) {
    console.error("Error getting products sorted by rating:", error);
    throw error;
  }
}
const getProducts = async (req, res) => {
  try {
    const { category, price, search, sort, page = 1, limit = 8 } = req.query;
    let filter = {};
    if (category) {
      filter.category = { $in: category.split(",") };
    }
    if (search) {
      filter.name = { $regex: new RegExp(search, "i") };
    }
    let products;

    console.log(
      "🚀 ~ file: productController.js:15 ~ getProducts ~ price:",
      price
    );
    if (price) {
      if (price === "Above 10000") {
        filter.price = { $gte: 10000 };
      }
      if (price === "5000-10000") {
        filter.price = { $gte: 5000, $lte: 10000 };
      }
      if (price === "2000-5000") {
        filter.price = { $gte: 2000, $lte: 4999 };
      }
      if (price === "1000-1999") {
        filter.price = { $gte: 1000, $lte: 1999 };
      }
      if (price === "500-999") {
        filter.price = { $gte: 500, $lte: 1000 };
      }
      if (price === "below 499") {
        filter.price = { $lte: 499 };
      }
    }

    console.log(
      "🚀 ~ file: productController.js:33 ~ getProducts ~ filter.price:",
      filter.price
    );
    let sortOptions = {};
    if (sort === "created-desc") {
      sortOptions.createdAt = -1;
    }
    if (sort === "featured") {
      products = await findProductWithMostOrders();
      const totalAvailableProducts = await Product.countDocuments({
        status: { $in: ["published", "low quantity"] },
        ...filter,
      });

      return res.status(200).json({ products, totalAvailableProducts });
    } else if (sort === "popular") {
      // Find popular products based on number of orders
      products = await Product.aggregate([
        {
          $match: {
            status: { $in: ["published", "low quantity"] },
            ...filter,
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "products.productId",
            as: "orders",
          },
        },
        {
          $addFields: {
            orderCount: { $size: "$orders" },
          },
        },
        {
          $sort: { orderCount: -1 },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: parseInt(limit),
        },
        {
          $project: {
            name: 1,
            imageURL: 1,
            price: 1,
            markup: 1,
            numberOfReviews: 1,
            rating: 1,
            offer: 1,
            orderCount: 1,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: "$category",
        },
      ]);
      const totalAvailableProducts = await Product.countDocuments({
        status: { $in: ["published", "low quantity"] },
        ...filter,
      });
      return res.status(200).json({ products, totalAvailableProducts });
    } else if (sort === "averagerating") {
      // Calculate average rating using aggregation
      products = await getProductsSortedByRating();
      console.log(products, "---------------average rating--------------");
      const totalAvailableProducts = await Product.countDocuments({
        status: { $in: ["published", "low quantity"] },
        ...filter,
      });
      return res.status(200).json({ products, totalAvailableProducts });
    } else {
      if (sort === "price-asc") {
        sortOptions.price = 1;
      }
      if (sort === "price-desc") {
        sortOptions.price = -1;
      }
      if (sort === "name-dsc") {
        sortOptions.name = -1;
      }
      if (sort === "name-asc") {
        sortOptions.name = 1;
      }

      if (!sort) {
        sortOptions.createdAt = -1;
      }
      const skip = (page - 1) * limit;
      products = await Product.find(
        {
          status: { $in: ["published", "low quantity"] },
          ...filter,
        },
        {
          name: 1,
          imageURL: 1,
          price: 1,
          markup: 1,
          numberOfReviews: 1,
          rating: 1,
          offer: 1,
        }
      )
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("category", { name: 1 });
      const totalAvailableProducts = await Product.countDocuments({
        status: { $in: ["published", "low quantity"] },
        ...filter,
      });
      console.log(
        products,
        "-----==============products of home ----------------============"
      );
      res.status(200).json({ products, totalAvailableProducts });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID!!!");
    }

    const product = await Product.findOne({ _id: id }).populate("category", {
      name: 1,
    });

    const similarProducts = await Product.find({
      status: { $in: ["published", "low quantity"] },
      category: product.category,
    }).limit(5);
    res.status(200).json({ product, similarProducts });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const getAvailableQuantity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID!!!");
    }
    const stockQuantity = await Product.findOne(
      { _id: id },
      { stockQuantity: 1 }
    );

    res.status(200).json({ stockQuantity: stockQuantity.stockQuantity });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports = {
  getAvailableQuantity,
  getProduct,
  getProducts,
};
