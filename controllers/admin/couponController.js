const mongoose = require("mongoose");
const Coupon = require("../../model/couponModel");

//getting single coupon using id

const getCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("not valid coupon id");
    }
    const coupon = await Coupon.findOne({ _id: id });
    return res.status(200).json({ coupon });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const addCoupon = async (req, res) => {
  try {
    const body = req.body;
    const nameRegex = new RegExp(body.code, "i");
    const existingCoupon = await Coupon.findOne({ code: nameRegex });
    if (existingCoupon) {
      throw new Error("A coupon with the same name already exists");
    }
    if (body.type === "percentage" && body.value > 100) {
      throw new Error(
        "Value must be less than or equal to 100 for percentage type"
      );
    }
    // Create the coupon
    const coupon = await Coupon.create(body);
    return res.status(200).json({ coupon });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getCoupons = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      startingDate,
      endingDate,
    } = req.query;

    let filter = {};
    // Date queries
    if (startingDate) {
      const date = new Date(startingDate);
      filter.createdAt = { $gte: date };
    }
    if (endingDate) {
      const date = new Date(endingDate);
      filter.createdAt = { ...filter.createdAt, $lte: date };
    }

    if (status) {
      if (status === "active") {
        filter.isActive = true;
      } else {
        filter.isActive = false;
      }
    }

    if (search) {
      filter.code = { $regex: new RegExp(search, "i") };
    }

    const skip = (page - 1) * limit;

    const coupons = await Coupon.find(filter, {
      description: 0,
      minimumPurchaseAmount: 0,
      maximumUses: 0,
    })
      .skip(skip)
      .limit(limit);

    const totalAvailableCoupons = await Coupon.countDocuments(filter);

    return res.status(200).json({ coupons, totalAvailableCoupons });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID!!!");
    }

    const coupon = await Coupon.findOneAndDelete({ _id: id });

    if (!coupon) {
      throw Error("No such Coupon");
    }

    res.status(200).json({ coupon });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const editCoupon = async (req, res) => {
  try {
    const formData = req.body;
    const { id } = req.params;

    console.log("Form Data:", formData);
    console.log("Coupon ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid coupon ID");
    }

    const nameRegex = new RegExp(`^${formData.code}$`, "i");
    const existingCoupon = await Coupon.findOne({
      code: nameRegex,
      _id: { $ne: id },
    });

    console.log("Existing Coupon Check:", existingCoupon);

    if (existingCoupon) {
      throw new Error("A coupon with the same code already exists");
    }

    if (formData.type === "percentage" && formData.value > 100) {
      throw new Error(
        "Value must be less than or equal to 100 for percentage type"
      );
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: formData },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      throw new Error("No such Coupon");
    }

    console.log("Updated Coupon:", coupon);

    res.status(200).json({ coupon });
  } catch (error) {
    console.error("Coupon Error:", error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getCoupon,
  getCoupons,
  addCoupon,
  editCoupon,
  deleteCoupon,
};
