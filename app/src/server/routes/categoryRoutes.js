const express = require("express");
const router = express.Router();
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/getCategories", authenticate, authorize([]), getCategories);
router.post("/addCategory", authenticate, authorize(["admin"]), addCategory);
router.put(
  "/updateCategory/:id",
  authenticate,
  authorize(["admin"]),
  updateCategory,
);
router.delete(
  "/deleteCategory/:id",
  authenticate,
  authorize(["admin"]),
  deleteCategory,
);

module.exports = router;
