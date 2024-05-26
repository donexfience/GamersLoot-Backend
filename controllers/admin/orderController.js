const mongoose = require("mongoose");
const Payment = require("../../model/paymentModel");
const Order = require("../../model/orderModel");
const uuid = require("uuid");
const Counter = require("../../model/counterModel");
const Wallet = require("../../model/walletModel");

const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    //empty object for stroring queries
    let finder = {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      find._id = id;
    } else {
      finder.orderId = id;
    }
    const order = await Order.findOne(find).populate("products.producId", {
      imageURL: 1,
      name: 1,
    });

    if (!order) {
      throw Error("No Such Order");
    }

    res.status(200).json({ order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    let finder = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      finder._id = id;
    } else {
      finder.orderId = id;
    }
    const date = new Date();
    console.log(date,"------------")
    const { status, paymentStatus, description } = req.body;
    console.log(req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID!!!");
    }

    const statusExisted = await Order.findOne({
      ...finder,
      "statusHistory.status": status,
    });

    let updateOptions = {
      $set: {
        status,
      },
    };

    // if the status is not ther wec creaing
    if (!statusExisted) {
      const currentDate = new Date();
      const returnDate = new Date(currentDate);
      returnDate.setDate(returnDate.getDate() + 7);
      updateOptions.$push = {
        statusHistory: {
          status,
          description,
          date: date,
          returndate: returnDate,
        },
      };
    }
    console.log(updateOptions, "--=-=-=-=-=-=-=-=-=-=-=");

    const updated = await Order.findOneAndUpdate(finder, updateOptions, {
      new: true,
    });
    if (!updated) {
      throw Error("Something went wrong");
    }

    if (paymentStatus === "yes") {
      await Payment.create({
        order: updated._id,
        payment_id: `cod_${uuid.v4()}`,
        user: updated.user,
        status: "success",
        paymentMode: "cashOnDelivery",
      });
    }

    if (paymentStatus === "no") {
      await Payment.create({
        order: updated._id,
        user: updated.user,
        status: "pending",
        paymentMode: "cashOnDelivery",
      });
    }

    const order = await Order.findOne(finder, {
      address: 0,
      products: { $slice: 1 },
    })
      .populate("user", { firstName: 1, lastName: 1 })
      .populate("products.productId", { imageURL: 1, name: 1 });

    res.status(200).json({ order });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
const getOrders = async (req, res) => {
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

    if (startingDate) {
      const date = new Date(startingDate);
      filter.createdAt = { $gte: date };
    }
    if (endingDate) {
      const date = new Date(endingDate);
      filter.createdAt = { ...filter.createdAt, $lte: date };
    }

    if (status) {
      filter.status = status;
    } else {
      filter.status = {
        $in: [
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "returned",
        ],
      };
    }

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter._id = search;
      } else {
        const searchAsNumber = Number(search);
        if (!isNaN(searchAsNumber)) {
          filter.orderId = searchAsNumber;
        } else {
          throw new Error("Please search using order Id");
        }
      }
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .select("-address")
      .select("statusHistory")
      .slice("products", 1)
      .skip(skip)
      .limit(limit)
      .populate("user", { firstName: 1, lastName: 1 })
      .populate("products.productId", { imageURL: 1, name: 1 })
      .sort({ createdAt: -1 });

    const totalAvailableOrders = await Order.countDocuments(filter);

    res.status(200).json({ orders, totalAvailableOrders });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const clearOrder = async (req, res) => {
  try {
    const data = await Order.deleteMany({});

    res.status(200).json({ status: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//return order getting

const getReturnOrders = async (req, res) => {
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

    if (startingDate) {
      const date = new Date(startingDate);
      filter.createdAt = { $gte: date };
    }
    if (endingDate) {
      const date = new Date(endingDate);
      filter.createdAt = { ...filter.createdAt, $lte: date };
    }

    if (status) {
      filter.status = status;
    } else {
      filter.status = {
        $in: [
          "return request",
          "returned",
          "return rejected",
          "return approved",
        ],
      };
    }

    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter._id = search;
      } else {
        const searchAsNumber = Number(search);
        if (!isNaN(searchAsNumber)) {
          filter.orderId = searchAsNumber;
        } else {
          throw new Error("Please search using order Id");
        }
      }
    }
    console.log(search);

    const skip = (page - 1) * limit;
    console.log("fffffffffffffffffff", filter);
    const orders = await Order.find(filter)
      .select("-address")
      .select("statusHistory")
      .slice("products", 1)
      .skip(skip)
      .limit(limit)
      .populate("user", { firstName: 1, lastName: 1 })
      .populate("products.productId", { imageURL: 1, name: 1 })
      .sort({ createdAt: -1 });

    const totalAvailableOrders = await Order.countDocuments(filter);
    res.status(200).json({ orders, totalAvailableOrders });
    console.log(orders);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const updateReturnOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    let finder = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      finder._id = id;
    } else {
      finder.orderId = id;
    }
    const { status, date, paymentStatus, description, pickupdate, reason } =
      req.body;
    console.log(req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Error("Invalid ID!!!");
    }

    const statusExisted = await Order.findOne({
      ...finder,
      "statusHistory.status": status,
    });

    let updateOptions = {
      $set: {
        status,
      },
    };

    // if the status is not there we're creating
    if (!statusExisted) {
      updateOptions.$push = {
        statusHistory: {
          status,
          description,
          date: new Date(date),
          pickupdate,
          ...(reason ? { reason } : {}),
        },
      };
    }
    console.log(updateOptions, "--=-=-=-=-=-=-=-=-=-=-=");

    const updated = await Order.findOneAndUpdate(finder, updateOptions, {
      new: true,
    });
    console.log(updated, ",.,.,.,.,.,,.,.,.,");
    if (!updated) {
      throw Error("Something went wrong");
    }

    if (paymentStatus === "yes") {
      //same logic of cancel order

      let counter = await Counter.findOne({
        model: "wallet",
        field: "transaction_id",
      });
      if (counter) {
        counter.count += 1;
        await counter.save();
      } else {
        counter = await Counter.create({
          field: "transaction_id",
          model: "wallet",
        });
      }

      const exists = await Wallet.findOne({ user: updated.user });
      console.log(exists, "user data waleerr[][][][][]");
      if (exists) {
        exists.transactions.push({
          transaction_id: counter.count,
          amount: updated.totalPrice,
          type: "credit",
          description: `Refund for order return with order id ${updated._id}`,
          order: updated._id,
        });
        exists.balance += updated.totalPrice;
        await exists.save();
      } else {
        const wallet = await Wallet.create({
          user: _id,
          balance: updated.totalPrice,
          transactions: [
            {
              transaction_id: counter.count + 1,
              amount: order.totalPrice,
              type: "credit",
              description: `Refund for order cancelation with order id ${updated._id}`,
              order: updated._id,
            },
          ],
        });
      }
    }

    const order = await Order.findOne(finder, {
      address: 0,
      products: { $slice: 1 },
    })
      .populate("user", { firstName: 1, lastName: 1 })
      .populate("products.productId", { imageURL: 1, name: 1 });

    res.status(200).json({ order });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  clearOrder,
  getOrder,
  getOrders,
  updateReturnOrderStatus,
  updateOrderStatus,
  getReturnOrders,
};
