const Order = require("../../model/orderModel");
const User = require("../../model/userModel");

const TotalSales = async (req, res) => {
  try {
    const numberOfDates = parseInt(req.query.numberOfDates) || 7;
    const filter = {};
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numberOfDates);
    filter.createdAt = { $gte: startDate };
    const orders = await Order.find(filter);
    const totalOrdersSold = orders.length;

    const salesData = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSales: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ totalOrdersSold, salesData });
  } catch (error) {
    console.error("Error fetching total sales:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const TotalProfit = async (req, res) => {
  const numberOfDates = parseInt(req.query.numberOfDates) || 7;
  const filter = {};
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - numberOfDates);
  filter.createdAt = { $gte: startDate };

  try {
    const orders = await Order.find(filter);
    const sales = await Order.aggregate([
      {
        $match: filter,
      },
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalSales: {
            $sum: "$products.markup",
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Construct the data for the chart
    const chartData = sales.map((daySale) => ({
      date: daySale._id,
      totalSales: daySale.totalSales,
    }));

    res.status(200).json(chartData);
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(400).json({ error: "Internal server error" });
  }
};

const TotalUserCount = async (req, res) => {
  const numberOfDates = req.query.numberOfDates || 7;
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numberOfDates);

    const userCountByDay = await User.aggregate([
      {
        $match: { role: "user", createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json(userCountByDay);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const TotalRevenue = async (req, res) => {
  const numberOfDates = req.query.numberOfDates || 7;
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numberOfDates);

    const totalRevenue = await Order.aggregate([
      { $match: { createdAt: { $gt: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: {
            $sum: "$totalPrice",
          },
        },
      },
    ]);

    res.json({ totalRevenue });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  TotalSales,
  TotalProfit,
  TotalUserCount,
  TotalRevenue
};
