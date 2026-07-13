const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, default: "My Restaurant" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    billPrefix: { type: String, default: "" },
    billSequence: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    tagline: { type: String, default: "" },
    footerNote: { type: String, default: "Thank you for dining with us!" },
    serviceChargePercent: { type: Number, default: 0 },
    defaultDeliveryCharge: { type: Number, default: 0 },
    printerPaperSize: { type: String, enum: ["58mm", "80mm"], default: "80mm" },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
