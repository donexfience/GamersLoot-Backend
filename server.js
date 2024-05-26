require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const logger = require("morgan");
const mongoose = require("mongoose");
const cronJob = require("./util/cronJob");

const app = express();

// Mounting necessary middlewares

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

//cors setting
const allowedOrigins = [process.env.CLIENT_URL];
const corsOptions = {
  origin: [allowedOrigins],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(logger("dev"));

//Initial Routes
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const superAdminRoutes = require("./routes/superAdmin");
const publicRoutes = require("./routes/public");

//Authentication Middlewares

const { requireAuth, requireAdminAuth } = require("./middleware/requireAuth");
const checkoffer = require("./util/cronJob");

//Routes Mounting
app.use("/api/auth", authRoutes);
app.use("/api/user", requireAuth, userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/super-admin", requireAdminAuth, superAdminRoutes);
app.use("/api/public", publicRoutes);

//public Api for accessing images

app.use("/api/img", express.static(__dirname + "/public/products/"));
app.use("/api/off", express.static(__dirname + "/public/official/"));

// cron job util call to work when the server start working
// cronJob();
checkoffer()


mongoose.connect(process.env.MONGO_URL).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Listening on Port: ${process.env.PORT}-DB Connected`);
  });
});
