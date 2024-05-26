const mongoose = require("mongoose");
const Product = require("../../model/ProductModel");
const Address = require("../../model/AddressModal");
const Cart = require("../../model/cartModel");
const Order = require("../../model/orderModel");
const Payment = require("../../model/paymentModel");
const jwt = require("jsonwebtoken");
const Counter = require("../../model/counterModel");
const Wallet = require("../../model/walletModel");
const Coupon = require("../../model/couponModel");
const uuid = require("uuid");
const { generateInvoicePDF } = require("./Invoice/InvoicePdfGen");

const getOrders = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid ID");
    }
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const orders = await Order.find(
      { user: _id },
      {
        address: 0,
        paymentMode: 0,
        deliveryDate: 0,
        user: 0,
        statusHistory: 0,
        products: { $slice: 1 },
      }
    )
      .skip(skip)
      .limit(limit)
      .populate("products.productId", { name: 1 })
      .sort({ createdAt: -1 });
    const totalAvailableOrders = await Order.countDocuments({ user: _id });
    res.status(200).json({ orders, totalAvailableOrders });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getOrdersWithCoupon = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid ID");
    }
    const { page = 1, limit = 7 } = req.query;
    const skip = (page - 1) * limit;
    const orders = await Order.find(
      { user: _id, couponCode: { $exists: true, $ne: "" } },
      {
        address: 0,
        paymentMode: 0,
        deliveryDate: 0,
        user: 0,
        statusHistory: 0,
        products: { $slice: 1 },
      }
    )
      .skip(skip)
      .limit(limit)
      .populate("products.productId", { name: 1 })
      .sort({ createdAt: -1 });
    const totalAvailableOrders = await Order.countDocuments({
      user: _id,
      couponCode: { $exists: true, $ne: null },
    });
    console.log(orders, "[[[[[[[[[[[[[[[");
    res.status(200).json({ orders, totalAvailableOrders });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//stock updating
//increment or decremnt product count and updating status

// # we can use it for cancel order and create order

const updateProductList = async (id, count) => {
  const product = await Product.findOne({ _id: id });
  if (count < 0) {
    if (product.stockQuantity - count * -1 < 0) {
      throw Error(`${product.name} doesn\'t have ${count * -1} stock`);
    }
  }
  const updateProduct = await Product.findByIdAndUpdate(
    id,
    { $inc: { stockQuantity: count } },
    { new: true }
  );
  if (
    parseInt(updateProduct.stockQuantity) < 5 &&
    parseInt(updateProduct.stockQuantity) > 0
  ) {
    await Product.findByIdAndUpdate(id, {
      $set: { status: "low quantity" },
    });
  }
  if (parseInt(updateProduct.stockQuantity) === 0) {
    await Product.findByIdAndUpdate(
      id,
      { $set: { status: "out of stock" } },
      { new: true }
    );
  }
  if (parseInt(updateProduct.stockQuantity) > 5) {
    await Product.findByIdAndUpdate(id, {
      $set: { status: "published" },
    });
  }
};

const generateInvoiceOrder = async (req, res) => {
  try {
    const { id } = req.params;

    let find = {};

    if (mongoose.Types.ObjectId.isValid(id)) {
      find._id = id;
    } else {
      find.orderId = id;
    }

    const order = await Order.findOne(find).populate("products.productId");

    const pdfBuffer = await generateInvoicePDF(order);

    // Set headers for the response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");

    res.status(200).end(pdfBuffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid ID");
    }
    const { address, paymentMode, notes, couponCode } = req.body;
    console.log(address, "--------------------------");
    const addressData = await Address.findOne({ _id: address });
    console.log(addressData, "---------------");
    const cart = await Cart.findOne({ user: _id }).populate("items.product", {
      name: 1,
      price: 1,
      markup: 1,
      imageURL: 1,
      offer: 1,
    });
    let sum = 0;
    let totalQuantity = 0;

    cart.items.forEach((item) => {
      const discountAmount =
        ((item.product.price + item.product.markup) * item.product.offer) / 100;
      const discountedPrice =
        item.product.price + item.product.markup - discountAmount;
      sum += discountedPrice * item.quantity;
      totalQuantity += item.quantity;
    });
    let sumWithTax = Math.ceil(sum + sum * 0.08);
    sumWithTax += 40;
    console.log(
      sum,
      sumWithTax,
      sum * 0.08,
      "-----------0---------0-------------"
    );
    const products = cart.items.map((item) => ({
      productId: item.product._id,
      totalPrice: item.product.price + item.product.markup,
      price: item.product.price,
      markup: item.product.markup,
      quantity: item.quantity,
      imageURL: item.product.imageURL,
    }));
    //coupon type getting
    let coupon;
    let couponType;
    let couponValue;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode });
      couponType = coupon.type;
    }
    if (couponType === "percentage") {
      console.log(sumWithTax, "before minus discount");
      let offerPrice = (sumWithTax * cart.discount) / 100;
      console.log(offerPrice, "offer pricen=-=-=-=-==-=-=");
      sumWithTax -= offerPrice;
      console.log(sumWithTax, "after minus discount");
    } else if (couponType === "fixed") {
      sumWithTax -= cart.discount;
    }
    console.log(sumWithTax, "----------------------]]]]]]]]]]]]]");
    let orderData = {
      user: _id,
      couponCode: couponCode,
      couponType: couponType,
      address: addressData,
      products: products,
      subTotal: Math.round(sum),
      tax: Math.ceil(sum * 0.08),
      paymentMode,
      totalPrice: Math.round(sumWithTax),
      discount: cart.discount,
      totalQuantity,
      shipping: 40,
      statusHistory: [
        {
          status: "pending",
        },
      ],
      ...(notes ? notes : {}),
    };
    const updateProductCount = products.map((item) => {
      return updateProductList(item.productId, -item.quantity);
    });
    await Promise.all(updateProductCount);
    const order = await Order.create(orderData);
    console.log(order, "suceessssssssssssssssssssssssssss");
    if (order) {
      await Cart.findByIdAndDelete(cart._id);
    }
    //if the couopn is used
    if (cart.coupon) {
      await Coupon.findOneAndUpdate(
        { code: cart.coupon },
        { $inc: { used: 1 } }
      );
    }

    if (paymentMode === "myWallet") {
      let userWallet = await Wallet.findOne({ user: _id });
      if (!userWallet) {
        throw Error("No such wallet found");
      }
      if (userWallet.balance < order.totalPrice) {
        throw Error("Insufficient balance in wallet");
      }
      userWallet.balance -= order.totalPrice;
      await userWallet.save();
      let counter = await Counter.findOne({
        model: "wallet",
        field: "transaction_id",
      });
      if (counter) {
        counter.count += 1;
        await counter.save();
      } else {
        await Counter.create({ field: "transaction_id", model: "wallet" });
      }
      userWallet.transactions.push({
        transaction_id: counter.count + 1,
        amount: -order.totalPrice,
        type: "debit",
        description: `payment for the order ${order._id}`,
        order: order._id,
      });
      await userWallet.save();
    }
    await Payment.create({
      payment_id: `walletUser${_id}${uuid.v4()}`,
      user: _id,
      order: order._id,
      status: "success",
      paymentMode: "myWallet",
    });
    res.status(200).json({ order });
  } catch (error) {
    console.error(error, "--------------------------");
    res.status(400).json({ error: error.message });
  }
};

//canceling order

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    let finder = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      finder._id = id;
    } else {
      finder.orderId = id;
    }
    const orderDetails = await Order.findOne(finder).populate(
      "products.productId"
    );
    const products = orderDetails.products.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    const updateProductCount = products.map((item) => {
      return updateProductList(item.productId, item.quantity);
    });
    await Promise.all(updateProductCount);
    const order = await Order.findOneAndUpdate(
      finder,
      {
        $set: { status: "cancelled" },
        $push: {
          statusHistory: {
            status: "cancelled",
            date: Date.now(),
            reason: reason,
          },
        },
      },
      { new: true }
    );

    //updating payment of delivery in payment collection
    //if the payment is done by using wallet

    if (order.paymentMode !== "cashOnDelivery") {
      const token = req.cookies.user_token;
      const { _id } = jwt.verify(token, process.env.SECRET);
      //if the order is created by wallet there will be a counter we need to update counter

      let counter = await Counter.findOne({
        field: "transaction_id",
        model: "wallet",
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
      const exists = await Wallet.findOne({ user: _id });
      if (exists) {
        exists.transactions.push({
          transaction_id: counter.count,
          amount: order.totalPrice,
          type: "credit",
          description: `Refund for order cancelation with order id ${order._id}`,
          order: order._id,
        });
        await exists.save();
      } else {
        const wallet = await Wallet.create({
          user: _id,
          balance: order.totalPrice,
          transactions: [
            {
              transaction_id: counter.count + 1,
              amount: order.totalPrice,
              type: "credit",
              description: `Refund for order cancelation with order id ${order._id}`,
              order: order._id,
            },
          ],
        });
      }
      //update payment status to refundedF
      await Payment.updateOne(
        { order: order._id },
        {
          $set: {
            status: "refunded",
          },
        }
      );
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error(error, "error from cancel order");
    res.status(400).json({ error: error.message });
  }
};

//getting single order

const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let finder = {};

    if (mongoose.Types.ObjectId.isValid(id)) {
      find._id = id;
    } else {
      finder.orderId = id;
    }
    const order = await Order.findOne(finder).populate("products.productId", {
      imageURL: 1,
      name: 1,
      description: 1,
      offer: 1,
    });
    if (!order) {
      throw Error("No such order");
    }
    res.status(200).json({ order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// total orders and details

const orderCount = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      {
        throw Error("Invalid Id");
      }
    }
    const totalOrders = await Order.countDocuments({ user: _id });
    const pendingOrders = await Order.countDocuments({
      user: _id,
      status: "pending",
    });
    const completedOrders = await Order.countDocuments({
      user: _id,
      status: "delivered",
    });
    const totalAddresses = await Address.countDocuments({ user: _id });

    // Calculate total products purchased
    const orders = await Order.find({ user: _id });
    let totalProductsPurchased = 0;
    orders.forEach((order) => {
      totalProductsPurchased += order.totalQuantity;
    });
    // Calculate total products available
    const totalProductsAvailable = await Product.countDocuments();

    // Calculate average purchase percentage
    const averagePurchasePercentage =
      (totalProductsPurchased / totalProductsAvailable) * 100;
    res.status(200).json({
      totalAddresses,
      totalProductsPurchased,
      averagePurchasePercentage,
      totalOrders,
      pendingOrders,
      completedOrders,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const returnOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    let finder = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      finder._id = id;
    } else {
      finder.orderId = id;
    }
    const orderDetails = await Order.findOne(finder).populate(
      "products.productId"
    );
    const order = await Order.findOneAndUpdate(
      finder,
      {
        $set: { status: "return request" },
        $push: {
          statusHistory: {
            status: "return request",
            date: Date.now(),
            reason: reason,
          },
        },
      },
      { new: true }
    );
    res.status(200).json({ order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const RepaymentOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await Order.findOne({ orderId: id });
    const totalAvailableOrders = 1;
    res.status(200).json({ orders, totalAvailableOrders });
    console.log(orders, "--------------------");
  } catch (error) {
    console.error(error, "error of repayment order details");
    res.status(400).json({ error: error.message });
  }
};

const createfailOrder = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid ID");
    }
    const { address, paymentMode, notes, couponCode } = req.body;
    console.log(address, "--------------------------");
    const addressData = await Address.findOne({ _id: address });
    console.log(addressData, "---------------");
    const cart = await Cart.findOne({ user: _id }).populate("items.product", {
      name: 1,
      price: 1,
      markup: 1,
      offer: 1,
    });
    let sum = 0;
    let totalQuantity = 0;
    cart.items.forEach((item) => {
      const discountAmount =
        ((item.product.price + item.product.markup) * item.product.offer) / 100;
      const discountedPrice =
        item.product.price + item.product.markup - discountAmount;
      sum += discountedPrice * item.quantity;
      totalQuantity += item.quantity;
    });
    console.log("11111111111111111111111111111111111111111111111111111", sum);
    let sumWithTax = Math.ceil(sum + sum * 0.08);
    console.log(sumWithTax);
    const products = cart.items.map((item) => ({
      productId: item.product._id,
      totalPrice: item.product.price + item.product.markup,
      price: item.product.price,
      markup: item.product.markup,
      quantity: item.quantity,
    }));
    let orderData = {
      user: _id,
      couponCode: couponCode,
      address: addressData,
      products: products,
      subTotal: Math.round(sum),
      tax: Math.ceil(sum * 0.08),
      paymentMode,
      status: "payment failed",
      totalPrice: sumWithTax + 40,
      discount: cart.discount,
      totalQuantity,
      shipping: 40,
      statusHistory: [
        {
          status: "payment failed",
        },
      ],
      ...(notes ? notes : {}),
    };
    console.log(orderData, "000000000000000000000000");
    const updateProductCount = products.map((item) => {
      return updateProductList(item.productId, -item.quantity);
    });
    await Promise.all(updateProductCount);
    const order = await Order.create(orderData);
    console.log(order, "suceessssssssssssssssssssssssssss");
    if (order) {
      await Cart.findByIdAndDelete(cart._id);
    }
    //if the couopn is used
    if (cart.coupon) {
      await Coupon.findOneAndUpdate(
        { code: cart.coupon },
        { $inc: { used: 1 } }
      );
    }

    if (paymentMode === "myWallet") {
      let userWallet = await Wallet.findOne({ user: _id });
      if (!userWallet) {
        throw Error("No such wallet found");
      }
      if (userWallet.balance < order.totalPrice) {
        throw Error("Insufficient balance in wallet");
      }
      await userWallet.save();
      let counter = await Counter.findOne({
        model: "wallet",
        field: "transaction_id",
      });
      if (counter) {
        counter.count += 1;
        await counter.save();
      } else {
        await Counter.create({ field: "transaction_id", model: "wallet" });
      }
      userWallet.transactions.push({
        transaction_id: counter.count + 1,
        amount: -order.totalPrice,
        type: "debit",
        description: `payment for the order ${order._id}`,
        order: order._id,
      });
      await userWallet.save();
    }
    await Payment.create({
      payment_id: `walletUser${_id}${uuid.v4()}`,
      user: _id,
      order: order._id,
      status: "success",
      paymentMode: "myWallet",
    });
    res.status(200).json({ order });
  } catch (error) {
    console.error(error, "--------------------------");
    res.status(400).json({ error: error.message });
  }
};
const Reorder = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid ID");
    }
    const { paymentMode, orderId } = req.body;
    const orders = await Order.findOne({ orderId: orderId });
    if (orders.status === "payment failed") {
      // Update order status to 'pending'
      orders.status = "pending";
      await orders.save();

      if (paymentMode === "myWallet") {
        let userWallet = await Wallet.findOne({ user: _id });
        if (!userWallet) {
          throw Error("No such wallet found");
        }
        if (userWallet.balance < orders.totalPrice) {
          throw Error("Insufficient balance in wallet");
        }
        userWallet.balance -= orders.totalPrice;
        await userWallet.save();
        let counter = await Counter.findOne({
          model: "wallet",
          field: "transaction_id",
        });
        if (counter) {
          counter.count += 1;
          await counter.save();
        } else {
          await Counter.create({ field: "transaction_id", model: "wallet" });
        }
        userWallet.transactions.push({
          transaction_id: counter.count + 1,
          amount: -orders.totalPrice,
          type: "debit",
          description: `payment for the order ${orders._id}`,
          order: orders._id,
        });
        await userWallet.save();
      }
      await Payment.create({
        payment_id: `walletUser${_id}${uuid.v4()}`,
        user: _id,
        order: orders._id,
        status: "success",
        paymentMode: "myWallet",
      });
    }
    res.status(200).json({ orders });
  } catch (error) {
    console.error(error, "--------------------------");
    res.status(400).json({ error: error.message });
  }
};
module.exports = {
  createOrder,
  getOrder,
  getOrders,
  cancelOrder,
  orderCount,
  returnOrder,
  getOrdersWithCoupon,
  generateInvoiceOrder,
  RepaymentOrder,
  createfailOrder,
  Reorder,
};
