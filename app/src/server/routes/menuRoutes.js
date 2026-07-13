const express = require("express");
const router = express.Router();
const {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/getMenuItems", authenticate, authorize([]), getMenuItems);
router.post("/addMenuItem", authenticate, authorize(["admin"]), addMenuItem);
router.put(
  "/updateMenuItem/:id",
  authenticate,
  authorize(["admin"]),
  updateMenuItem,
);
router.delete(
  "/deleteMenuItem/:id",
  authenticate,
  authorize(["admin"]),
  deleteMenuItem,
);

module.exports = router;
