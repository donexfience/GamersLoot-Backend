const mongoose = require("mongoose");
const User = require("./userModel");
const Counter = require("./counterModel");
const { Schema } = mongoose;
const Product = require("../model/ProductModel");

const StatusHistorySchema = new Schema({
  status: {
    type: String,
    enum: [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "return request",
      "return approved",
      "return rejected",
      "pickup completed",
      "returned",
      "payment failed",
    ],
    default: "pending",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
  },
  reason: {
    type: String,
  },
  returndate: {
    type: Date,
  },
  pickupdate: {
    type: Date,
  },
});

const ProductSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: Product,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  markup: {
    type: Number,
    required: true,
  },
  imageURL: {
    type: String,
  },
  discount: {
    type: Number,
  },
});

const AddressSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
  },
  address: {
    type: String,
  },
  country: {
    type: String,
  },
  regionState: {
    type: String,
  },
  city: {
    type: String,
  },
  pinCode: {
    type: Number,
  },
  email: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
});

const OrderSchema = new Schema(
  {
    orderId: {
      type: Number,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "canceled",
        "return request",
        "return approved",
        "return rejected",
        "pickup completed",
        "returned",
        "payment failed",
      ],
      default: "pending",
    },
    statusHistory: [StatusHistorySchema],
    address: AddressSchema,
    deliveryDate: {
      type: Date,
      default: () => {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 7); // for 1 week
        return currentDate;
      },
    },
    subTotal: {
      type: Number,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    products: [ProductSchema],
    paymentMode: {
      type: String,
      required: true,
      enum: ["cashOnDelivery", "razorPay", "myWallet"],
    },
    totalQuantity: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
    },
    couponCode: {
      type: String,
    },
    discount: {
      type: String,
    },
    couponType: {
      type: String,
    },
    shipping: {
      type: String,
    },
  },
  { timestamps: true }
);

//generating order Id
OrderSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const counter = await Counter.findOne({ model: "Order", field: "orderId" });

    // Checking if order counter is alreaddy exist in counter collection

    if (counter) {
      this.orderId = counter.count + 1;
      counter.count += 1;
      await counter.save();
    } else {
      await Counter.create({ model: "Order", field: "orderId" });
      this.orderId = 9072082624;
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

module.exports = mongoose.model("Order", OrderSchema);
