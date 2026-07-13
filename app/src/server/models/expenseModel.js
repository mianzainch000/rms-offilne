const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    description: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
