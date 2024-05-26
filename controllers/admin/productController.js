const mongoose = require("mongoose");
const Product = require("../../model/ProductModel");

//getting single product on when clicking edit button

const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id });
    if (!product) {
      throw Error("No such product");
    }
    res.status(200).json({ product });
  } catch (error) {
    console.error(error.message);
    res.status(400).json({ error: error.message });
  }
};

//Getting all products to list on admin Dashboard
const getProduct = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      startingDate,
      endingDate,
    } = req.query;

    const skip = (page - 1) * limit;
    let filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.name = { $regex: new RegExp(search, "i") };
    }
    if (startingDate && endingDate) {
      filter.createdAt = {
        $gte: new Date(startingDate),
        $lte: new Date(endingDate),
      };
    } else if (startingDate) {
      filter.createdAt = { $gte: new Date(startingDate) };
    } else if (endingDate) {
      filter.createdAt = { $lte: new Date(endingDate) };
    }
    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("category", { name: 1 });
    const totalAvailableProducts = await Product.countDocuments(filter);
    res.status(200).json({ products, totalAvailableProducts });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//creating new product
const addProduct = async (req, res) => {
  try {
    let formData = { ...req.body, isActive: true };
    const files = req?.files;

    const attributes = JSON.parse(formData.attributes);
    console.log(req.body, "bodyyyyyyyyyyyyyyyyyyyyyyyyyyyyy");

    formData.attributes = attributes;

    if (files && files.length > 0) {
      formData.moreImageURL = [];
      formData.imageURL = "";
      files.map((file) => {
        if (file.fieldname === "imageURL") {
          formData.imageURL = file.filename;
        } else {
          formData.moreImageURL.push(file.filename);
        }
      });
    }
    console.log(formData, "**********************************");
    const product = await Product.create(formData);

    res.status(200).json({ product });
  } catch (error) {
    console.error(error.message, "=-=-=---=-----==-=");
    res.status(400).json({ error: error.message });
  }
};

//update products
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;
    console.log("Updation: ", formData);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID!!!");
    }

    const files = req?.files;

    if (files && files.length > 0) {
      formData.moreImageURL = [];
      formData.imageURL = "";
      files.map((file) => {
        if (file.fieldname === "imageURL") {
          formData.imageURL = file.filename;
        } else {
          formData.moreImageURL.push(file.filename);
        }
      });

      if (formData.imageURL === "") {
        delete formData.imageURL;
      }

      if (formData.moreImageURL.length === 0 || formData.moreImageURL === "") {
        delete formData.moreImageURL;
      }
    }

    if (formData.moreImageURL === "") {
      formData.moreImageURL = [];
    }

    if (formData.attributes) {
      const attributes = JSON.parse(formData.attributes);
      formData.attributes = attributes;
    }

    const product = await Product.findOneAndUpdate(
      { _id: id },
      { $set: { ...formData } },
      { new: true }
    );

    if (!product) {
      throw Error("No Such Product");
    }

    res.status(200).json({ product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//deleting thte product if needed
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID!!!");
    }

    const product = await Product.findOneAndDelete({ _id: id });

    if (!product) {
      throw Error("No Such Product");
    }

    res.status(200).json({ product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getProduct,
  addProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct
};
