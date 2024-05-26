const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { Schema } = mongoose;
const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    phoneNumber: {
      type: Number,
    },
    dateOfBirth: {
      type: Date,
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "admin", "superAdmin"],
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    profileImgURL: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
const referralCodeGenerator = (username) => {
  const referralCodeNumberPart = Math.floor(Math.random() * 9000) + 1000;
  const referralCode = `${username}${referralCodeNumberPart}`;
  return referralCode;
};

UserSchema.statics.signup = async function (
  userCredentials,
  role,
  isEmailVerified
) {
  const { email, password, passwordAgain, firstName, lastName } =
    userCredentials;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !passwordAgain ||
    !role
  ) {
    throw Error("All fields are required");
  }

  if (firstName.trim() === "" || lastName.trim() === "") {
    throw Error("All Fields are required");
  }

  if (password !== passwordAgain) {
    throw Error("Password does not match");
  }

  if (!validator.isEmail(email)) {
    throw Error("Email is not valid");
  }

  if (!validator.isStrongPassword(password)) {
    throw Error("Password is not strong enough");
  }

  const exists = await this.findOne({ email });
  if (exists) {
    throw Error("Email already in use");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const referralCode = referralCodeGenerator(firstName.toLowerCase());

  userCredentials.password = hash;
  userCredentials.referralCode = referralCode;

  delete userCredentials.passwordAgain;

  const user = await this.create({
    ...userCredentials,
    isActive: true,
    role,
    isEmailVerified,
  });

  user.password = "";

  return user;
};

UserSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    throw Error("All fields must be filled");
  }
  if (!validator.isEmail(email)) {
    throw Error("Email is not a valid");
  }
  let user = await this.findOne({ email });
  if (!user) {
    throw Error("No users found please signup");
  }
  if (!user.isActive) {
    throw Error("your account is blocked by admin");
  }
  const macth = await bcrypt.compare(password, user.password);
  if (!macth) {
    throw Error("Incorrect Password");
  }
  user.password = "";
  return user;
};
const User = mongoose.model("User", UserSchema);
module.exports = User;
