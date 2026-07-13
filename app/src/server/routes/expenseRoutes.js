const express = require("express");
const router = express.Router();
const {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/getExpenses", authenticate, authorize(["admin"]), getExpenses);
router.post("/addExpense", authenticate, authorize(["admin"]), addExpense);
router.put(
  "/updateExpense/:id",
  authenticate,
  authorize(["admin"]),
  updateExpense,
);
router.delete(
  "/deleteExpense/:id",
  authenticate,
  authorize(["admin"]),
  deleteExpense,
);

module.exports = router;
