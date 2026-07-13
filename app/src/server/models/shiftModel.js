const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    openedByName: String,
    openingCash: {
      type: Number,
      default: 0,
      min: [0, "Opening cash cannot be negative"],
    },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    closingCash: {
      type: Number,
      default: null,
      min: [0, "Closing cash cannot be negative"],
    },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true },
);

shiftSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: "open" } },
);

module.exports = mongoose.models.Shift || mongoose.model("Shift", shiftSchema);
