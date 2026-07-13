const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["free", "occupied", "ready", "bill_pending"],
      default: "free",
    },
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Table || mongoose.model("Table", tableSchema);
