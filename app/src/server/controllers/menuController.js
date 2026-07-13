const MenuItem = require("../models/menuItemModel");

exports.getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, name: 1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu items" });
  }
};

exports.addMenuItem = async (req, res) => {
  try {
    const { name, category, price, description, available } = req.body;
    if (!name || !category || price === undefined) {
      return res
        .status(400)
        .json({ message: "Name, category and price are required" });
    }
    if (Number(price) < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    const item = new MenuItem({
      name,
      category,
      price,
      description,
      available,
    });
    await item.save();
    res.status(201).json({ message: "Menu item added", item });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, description, available } = req.body;

    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    const updated = await MenuItem.findByIdAndUpdate(
      id,
      { name, category, price, description, available },
      { new: true, runValidators: true },
    );
    if (!updated)
      return res.status(404).json({ message: "Menu item not found" });

    res.status(200).json({ message: "Menu item updated", item: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Menu item not found" });
    res.status(200).json({ message: "Menu item removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
