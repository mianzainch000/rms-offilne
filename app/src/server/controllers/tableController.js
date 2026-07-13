const Table = require("../models/tableModel");

exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ name: 1 });
    res.status(200).json(tables);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tables" });
  }
};

exports.addTable = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: "Table name is required" });

    const trimmedName = name.trim();
    const existing = await Table.findOne({
      name: {
        $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });
    if (existing)
      return res
        .status(400)
        .json({ message: `A table named "${trimmedName}" already exists.` });

    const table = new Table({ name: trimmedName, status: "free" });
    await table.save();
    res.status(201).json({ message: "Table added", table });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    if (name && name.trim()) {
      const trimmedName = name.trim();
      const existing = await Table.findOne({
        _id: { $ne: id },
        name: {
          $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      });
      if (existing)
        return res
          .status(400)
          .json({ message: `A table named "${trimmedName}" already exists.` });
    }

    const updated = await Table.findByIdAndUpdate(
      id,
      { name: name?.trim(), status },
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Table not found" });

    res.status(200).json({ message: "Table updated", table: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Table.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Table not found" });
    res.status(200).json({ message: "Table removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
