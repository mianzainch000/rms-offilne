const express = require("express");
const router = express.Router();
const {
  getExpenseCategories,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} = require("../controllers/expenseCategoryController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get(
  "/getExpenseCategories",
  authenticate,
  authorize(["admin"]),
  getExpenseCategories,
);
router.post(
  "/addExpenseCategory",
  authenticate,
  authorize(["admin"]),
  addExpenseCategory,
);
router.put(
  "/updateExpenseCategory/:id",
  authenticate,
  authorize(["admin"]),
  updateExpenseCategory,
);
router.delete(
  "/deleteExpenseCategory/:id",
  authenticate,
  authorize(["admin"]),
  deleteExpenseCategory,
);

module.exports = router;
