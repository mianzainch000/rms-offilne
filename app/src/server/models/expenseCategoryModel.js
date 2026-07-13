const mongoose = require("mongoose");

const expenseCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.ExpenseCategory ||
  mongoose.model("ExpenseCategory", expenseCategorySchema);
