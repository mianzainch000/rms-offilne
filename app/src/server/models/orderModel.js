const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    name: String,
    price: Number,
    qty: Number,
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["dine-in", "takeaway", "delivery"],
      default: "dine-in",
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },
    tableName: { type: String, default: "" },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ["open", "kitchen", "ready", "bill_pending", "paid", "cancelled"],
      default: "open",
    },
    discountType: {
      type: String,
      enum: ["percent", "flat"],
      default: "percent",
    },
    discountValue: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    payment: {
      method: { type: String, default: null },
      status: { type: String, default: "unpaid" },
      paidAmount: { type: Number, default: 0 },
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    billNumber: { type: String, default: null },
    paidAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
