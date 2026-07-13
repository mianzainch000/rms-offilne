require("dotenv").config();
const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const tableRoutes = require("./routes/tableRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const expenseCategoryRoutes = require("./routes/expenseCategoryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    return next();
  } catch (err) {
    console.error("DB connect middleware error:", err);
    return res.status(500).json({ message: "Database connection error" });
  }
});

app.use("/", userRoutes);
app.use("/", tableRoutes);
app.use("/", menuRoutes);
app.use("/", orderRoutes);
app.use("/", shiftRoutes);
app.use("/", categoryRoutes);
app.use("/", settingsRoutes);
app.use("/", expenseRoutes);
app.use("/", expenseCategoryRoutes);

module.exports = app;
