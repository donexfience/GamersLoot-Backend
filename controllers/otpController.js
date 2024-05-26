const jwt = require("jsonwebtoken");
const validator = require("validator");
const bcrypt = require("bcrypt");
const { sendOTPMail, passwordChangedMail } = require("../util/mailFunction");
const User = require("../model/userModel");
const OTP = require("../model/otpModel");

//sending otp

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw Error("Provide an Email");
    }
    if (!validator.isEmail(email)) {
      throw Error("Invalid Email");
    }
    const user = await User.findOne({ email });
    if (user) {
      throw Error("Email is already registerd");
    }
    let otp = Math.floor(Math.random() * 900000) + 100000;
    console.log(otp, "otp for signup");
    const exists = await OTP.findOne({ email });
    if (exists) {
      throw Error("OTP alredy send");
    }
    await OTP.create({ email, otp });
    res.status(200).json({ success: true, message: "OTP sent sucecessfully" });
  } catch (error) {
    console.log(error, "-=----------------");
    res.status(400).json({ error: error.message });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw Error("Provide an Email");
    }

    if (!validator.isEmail(email)) {
      throw Error("Invalid Email");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw Error("Email is not Registered");
    }

    const otpExists = await OTP.findOne({ email });

    if (otpExists) {
      await OTP.findOneAndDelete({ _id: otpExists._id });
    }

    let otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    console.log(otp);

    await OTP.create({ email, otp });

    res
      .status(200)
      .json({ msg: "OTP is send to your email Address", success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
const validateOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const data = await OTP.findOne({ email });
    console.log(data);
    if (!data) {
      throw Error("OTP EXPIRED");
    }
    if (data.otp !== otp) {
      throw Error("OTP IS NOT MATCHED");
    }
    res.status(200).json({
      success: true,
      message: "OTP Validation Success",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Validating forgot OTP
const validateForgotOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw Error("All fields are required");
    }

    if (!validator.isEmail(email)) {
      throw Error("Invalid Email");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw Error("Email is not Registered");
    }

    const validOTP = await OTP.findOne({ email });

    if (otp !== validOTP.otp) {
      throw Error("Wrong OTP. Please Check again");
    }

    res.status(200).json({ success: true, message: "OTP validation Success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Resending OTP if the user dont receieve otp
const resentOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw Error("Email is required");
    }

    if (!validator.isEmail(email)) {
      throw Error("Invalid Email");
    }

    const otpData = await OTP.findOne({ email });

    if (!otpData) {
      throw Error("No OTP found in this email. Try again...");
    }

    if (otpData.otp) {
      sendOTPMail(email, otpData.otp);
    } else {
      throw Error("Cannot find OTP");
    }

    res.status(200).json({ message: "OTP resend successfully", success: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
// Setting up new password
const newPassword = async (req, res) => {
  try {
    const { email, password, passwordAgain } = req.body;

    if (!email || !password || !passwordAgain) {
      throw Error("All fields are required");
    }

    if (!validator.isEmail(email)) {
      throw Error("Invalid Email");
    }

    if (!validator.isStrongPassword(password)) {
      throw Error("Password is not Strong enough");
    }

    if (password !== passwordAgain) {
      throw Error("Passwords are not same");
    }

    const oldUserData = await User.findOne({ email });

    const match = await bcrypt.compare(password, oldUserData.password);

    if (match) {
      throw Error("Provide new Password");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          password: hash,
        },
      }
    );

    if (user) {
      try {
        passwordChangedMail(email);
      } catch (error) {
        console.log("Error occurred while sending email: ", error);
        throw error;
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  sendOTP,
  newPassword,
  validateOTP,
  forgotPassword,
  validateForgotOTP,
  resentOTP,
};
