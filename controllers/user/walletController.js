const Wallet = require("../../model/walletModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const getWalletBalance = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    const wallet = await Wallet.findOne({ user: _id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    const walletBalance = wallet.balance;
    res.status(200).json({ balance: walletBalance });
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getWallet = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid ID");
    }

    const wallet = await Wallet.findOne({ user: _id });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const { page = 1, limit = 10 } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = wallet.transactions.length;
    wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);
    const transactions = wallet.transactions.slice(startIndex, endIndex);
    console.log(transactions, "-----------",wallet,"wwwwwwwwww");
    return res.status(200).json({
      wallet: {
        ...wallet.toObject(),
        transactions: transactions,
      },
      totalAvailableWalletTransactions: total,
    });
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getWalletBalance, getWallet };
