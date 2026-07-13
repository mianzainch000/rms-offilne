const ExpenseCategory = require("../models/expenseCategoryModel");
const Expense = require("../models/expenseModel");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.getExpenseCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories" });
  }
};

exports.addExpenseCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: "Category name is required" });

    const trimmedName = name.trim();
    const existing = await ExpenseCategory.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
    });
    if (existing)
      return res.status(400).json({ message: "Category already exists" });

    const category = new ExpenseCategory({ name: trimmedName });
    await category.save();
    res.status(201).json({ message: "Category added", category });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateExpenseCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await ExpenseCategory.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    if (!name || !name.trim())
      return res.status(400).json({ message: "Category name is required" });

    const trimmedName = name.trim();
    const duplicate = await ExpenseCategory.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
    });
    if (duplicate)
      return res
        .status(400)
        .json({ message: "Another category already has this name" });

    const oldName = category.name;
    category.name = trimmedName;
    await category.save();

    if (oldName !== category.name) {
      await Expense.updateMany(
        { category: oldName },
        { category: category.name },
      );
    }

    res.status(200).json({ message: "Category updated", category });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteExpenseCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await ExpenseCategory.findById(id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const inUse = await Expense.countDocuments({ category: category.name });
    if (inUse > 0)
      return res
        .status(400)
        .json({
          message: "Remove or re-categorize expenses using this category first",
        });

    await ExpenseCategory.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
