const mongoose = require("mongoose");
const Category = require("../../model/categoryModel");
const CatOffer = require("../../model/categoryoffer");
const Product = require("../../model/ProductModel");

//getting all category list to admin dashboard

const getCategories = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    let filter = {};
    console.log(status, "-------status");

    if (status) {
      if (status === "active") {
        filter.isActive = true;
      } else {
        filter.isActive = false;
      }
    }

    if (search) {
      filter.name = { $regex: new RegExp(search, "i") };
    }

    const skip = (page - 1) * limit;

    const categories = await Category.find(filter).skip(skip).limit(limit);

    const totalAvailableCategories = await Category.countDocuments(filter);

    res.status(200).json({ categories, totalAvailableCategories });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//Creatinig a new Category if need for admin

const createCategory = async (req, res) => {
  try {
    let formData = req.body;
    const imgURL = req?.file?.filename;

    if (imgURL) {
      formData = { ...formData, imgURL: imgURL };
    }

    if (formData.name) {
      console.log(formData.name);
      const nameRegex = new RegExp(formData.name, "i");

      // Check existing category
      const existingCategory = await Category.findOne({ name: nameRegex });

      if (existingCategory) {
        throw Error("Category with this name already exists");
      }
    }

    const category = await Category.create(formData);

    res.status(200).json({ category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//deleting cateogory
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID");
    }

    const category = await Category.findOneAndDelete({ _id: id });
    if (!category) {
      throw Error("No such  Cateogry");
    }
    res.status(200).json({ category });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//updating the cateogry
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let formData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID");
    }

    if (formData.name) {
      const nameRegex = new RegExp(formData.name, "i");

      // Check existing categories excluding the current one being updated
      const existingCategory = await Category.findOne({
        name: nameRegex,
        _id: { $ne: id },
      });

      if (existingCategory) {
        throw Error("Category with this name already exists");
      }
    }

    let imgURL = req?.file?.filename;
    if (imgURL) {
      formData = { ...formData, imgURL: imgURL };
    }

    const category = await Category.findOneAndUpdate(
      { _id: id },
      { $set: { ...formData } },
      { new: true }
    );

    if (!category) {
      throw Error("No such Category");
    }

    res.status(200).json({ category });
  } catch (error) {
    console.error(error, "Category update error");
    res.status(400).json({ error: error.message });
  }
};

// Only getting one Category
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID!!!");
    }

    const category = await Category.findOne({ _id: id });

    if (!category) {
      throw Error("No Such Category");
    }

    res.status(200).json({ category });
  } catch (error) {
    console.error("error is thrown", error);
    res.status(400).json({ error: error.message });
  }
};

const createCatOffer = async (req, res) => {
  try {
    const formData = req.body;
    console.log(formData, "ppppppppppppppppp", req.body);
    const newData = await CatOffer.create(formData);
    const products = await Product.find({ category: formData.category });
    console.log("befor", products);
    for (const product of products) {
      if (!product.offer || product.offer < newData.offer) {
        product.offer = newData.offer;
        await product.save();
      }
    }
    console.log(products, "after");
    res.status(200).json({ newData, message: "success" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
module.exports = {
  updateCategory,
  getCategories,
  createCategory,
  deleteCategory,
  getCategory,
  createCatOffer,
};
