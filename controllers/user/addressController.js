const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Address = require("../../model/AddressModal");

//getting many addresses at initial load
const getAddresses = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid User ID");
    }
    const addresses = await Address.find({ user: _id });
    if (!addresses) {
      throw Error("No address found");
    }
    res.status(200).json({ addresses });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//getting single address

const getAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid ADdress ID");
    }
    const address = await Address.findOne({ _id: id });
    if (!address) {
      throw Error("Address not found");
    }
    res.status(200).json({ address });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// creating address

const createAddress = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid Addresss Id");
    }
    const body = req.body;
    const address = await Address.create({ ...body, user: _id });
    res.status(200).json({ address });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//updating address

const updateAddress = async (req, res) => {
  try {
    const body = req.body;
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid User ID");
    }
    const exists = await Address.findOne({ user: _id });
    if (!exists) {
      throw Error("address not found");
    }
    const address = await Address.findOneAndUpdate(
      { user: _id },
      { $set: { ...body } },
      { new: true }
    );
    res.status(200).json({ address });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid User Id");
    }
    const address = await Address.findByIdAndDelete(id);
    res.status(200).json({ address });
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: error.message });
  }
};

module.exports={
    deleteAddress,
    createAddress,
    updateAddress,
    getAddress,
    getAddresses
}
