const Category = require("../models/categoryModel");
const MenuItem = require("../models/menuItemModel");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories" });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: "Category name is required" });

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
    });
    if (existing)
      return res.status(400).json({ message: "Category already exists" });

    const category = new Category({ name: name.trim() });
    await category.save();
    res.status(201).json({ message: "Category added", category });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, active } = req.body;

    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    if (name !== undefined) {
      if (!name.trim())
        return res.status(400).json({ message: "Category name is required" });

      const duplicate = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
      });
      if (duplicate)
        return res
          .status(400)
          .json({ message: "Another category already has this name" });

      const oldName = category.name;
      category.name = name.trim();

      if (oldName !== category.name) {
        await MenuItem.updateMany(
          { category: oldName },
          { category: category.name },
        );
      }
    }

    if (active !== undefined) {
      category.active = !!active;
    }

    await category.save();
    res.status(200).json({ message: "Category updated", category });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const inUse = await MenuItem.countDocuments({ category: category.name });
    if (inUse > 0) {
      return res
        .status(400)
        .json({ message: "Remove all items from this category first" });
    }

    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
