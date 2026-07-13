const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    description: { type: String, default: "", trim: true },
    available: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);
