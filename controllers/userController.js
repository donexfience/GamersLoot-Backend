const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Wallet = require("../model/walletModel");
const Counter = require("../model/counterModel");
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "1d" });
};
const cookieConfig = {
  secure: true,
  httpOnly: true,
  maxAge: 100 * 60 * 60 * 24,
};
const referralCodeGenerator = (username) => {
  // Generate a random number between 1000 and 9999
  const referralCodeNumberPart = Math.floor(Math.random() * 9000) + 1000;

  // Combine the username and random number to create the referral code
  const referralCode = `${username}${referralCodeNumberPart}`;

  return referralCode;
};

//to get user data when the first page load
const getUserDataFirst = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    if (!token) {
      throw Error("NO TOKEN FOUND");
    }
    const { _id } = jwt.verify(token, process.env.SECRET);
    const user = await User.findOne({ _id }, { password: 0 });
    if (!user) {
      throw Error("Cannot find the user");
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const editUser = async (req, res) => {
  try {
    const token = req.cookies.user_token;
    const { _id } = jwt.verify(token, process.env.SECRET);
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw Error("Invalid Id");
    }
    let { password, newPassword, confirmPassword, ...formData } = req.body;
    const user = await User.findById(_id);
    if (!user) {
      throw Error("User not found");
    }
    const profileImgURL = req?.file?.filename;
    if (profileImgURL) {
      formData = { ...formData, profileImgURL: profileImgURL };
    } else {
      formData = { ...formData, profileImgURL: "" };
    }

    // Check if newPassword and confirmPassword are provided and match
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      throw Error("New password and confirm password don't match");
    }

    // Check if password is provided and validate it against the user's current password
    if (password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw Error("Old password is not correct");
      }

      // If newPassword is provided, hash it and update the password field
      if (newPassword) {
        const hasedPassword = await bcrypt.hash(newPassword, 10);
        formData.password = hasedPassword;
      }
    }

    // Update the user with the new form data
    const updateUser = await User.findByIdAndUpdate(
      _id,
      { $set: formData },
      { new: true }
    );
    console.log(updateUser, "9999999999999999999999999999");
    if (!updateUser) {
      throw Error("No such User");
    }
    res.status(200).json({ updateUser });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
const signUpUser = async (req, res) => {
  try {
    let userCredentials = req.body;
    console.log(
      userCredentials,
      "signup data================================="
    );
    const profileImgURL = req?.file?.filename;
    if (profileImgURL) {
      userCredentials = { ...userCredentials, profileImgURL };
    }

    if (userCredentials.referralCode) {
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
      let refercode = userCredentials.referralCode;
      const walletUser = await User.findOne({ referralCode: refercode });
      const wallet = await Wallet.findOne({ user: walletUser._id });
      console.log(walletUser, "11111");
      if (wallet) {
        console.log(wallet, "222222222222");
        wallet.balance += 1000;
        await wallet.save();
        console.log("wallet saved....");
      } else {
        console.log("user dont have the wallet");
        const wallet = await Wallet.create({
          user: walletUser._id,
          balance: 1000,
          transactions: [
            {
              transaction_id: counter.count + 1,
              amount: "1000",
              type: "credit",
              description: `Refferal price for the user  order id ${userCredentials.firstName}`,
            },
          ],
        });
        console.log(wallet, "wallet user created and saved");
      }
    }
    const user = await User.signup(userCredentials, "user", true);

    const token = createToken(user._id);
    res.cookie("user_token", token, cookieConfig);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie("user_token", token, cookieConfig);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const logoutUser = async (req, res) => {
  res.clearCookie("user_token");

  res.status(200).json({ msg: "Logged out Successfully" });
};

module.exports = {
  logoutUser,
  loginUser,
  signUpUser,
  getUserDataFirst,
  editUser,
};
