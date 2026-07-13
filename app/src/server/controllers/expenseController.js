const Expense = require("../models/expenseModel");

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching expenses" });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    if (!title || !title.trim())
      return res.status(400).json({ message: "Expense title is required" });
    if (amount === undefined || amount === null || Number(amount) < 0)
      return res.status(400).json({ message: "A valid amount is required" });
    if (!category || !category.trim())
      return res.status(400).json({ message: "Category is required" });
    if (!date) return res.status(400).json({ message: "Date is required" });

    const expense = new Expense({
      title: title.trim(),
      amount: Number(amount),
      category: category.trim(),
      date,
      description: (description || "").trim(),
    });
    await expense.save();
    res.status(201).json({ message: "Expense logged", expense });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date, description } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (!title || !title.trim())
      return res.status(400).json({ message: "Expense title is required" });
    if (amount === undefined || amount === null || Number(amount) < 0)
      return res.status(400).json({ message: "A valid amount is required" });
    if (!category || !category.trim())
      return res.status(400).json({ message: "Category is required" });
    if (!date) return res.status(400).json({ message: "Date is required" });

    expense.title = title.trim();
    expense.amount = Number(amount);
    expense.category = category.trim();
    expense.date = date;
    expense.description = (description || "").trim();

    await expense.save();
    res.status(200).json({ message: "Expense updated", expense });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Expense not found" });
    res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
