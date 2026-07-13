const Shift = require("../models/shiftModel");
const Order = require("../models/orderModel");

exports.getCurrentShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ status: "open" });
    res.status(200).json(shift);
  } catch (error) {
    res.status(500).json({ message: "Error fetching shift" });
  }
};

exports.getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ openedAt: -1 });
    res.status(200).json(shifts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching shifts" });
  }
};

exports.openShift = async (req, res) => {
  try {
    const existing = await Shift.findOne({ status: "open" });
    if (existing)
      return res.status(400).json({ message: "A shift is already open" });

    const { openingCash } = req.body;
    const numericOpeningCash = Number(openingCash) || 0;
    if (numericOpeningCash < 0) {
      return res
        .status(400)
        .json({ message: "Opening cash cannot be negative" });
    }
    const shift = new Shift({
      openedBy: req.user._id,
      openedByName: req.body.openedByName || "",
      openingCash: numericOpeningCash,
      status: "open",
    });
    await shift.save();
    res.status(201).json({ message: "Shift opened", shift });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "A shift is already open" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.closeShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { closingCash } = req.body;
    const numericClosingCash = Number(closingCash) || 0;
    if (numericClosingCash < 0) {
      return res
        .status(400)
        .json({ message: "Closing cash cannot be negative" });
    }

    const shift = await Shift.findByIdAndUpdate(
      id,
      {
        status: "closed",
        closedAt: new Date(),
        closingCash: numericClosingCash,
      },
      { new: true },
    );
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    res.status(200).json({ message: "Shift closed", shift });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
