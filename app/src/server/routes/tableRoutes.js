const express = require("express");
const router = express.Router();
const {
  getTables,
  addTable,
  updateTable,
  deleteTable,
} = require("../controllers/tableController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/getTables", authenticate, authorize([]), getTables);
router.post(
  "/addTable",
  authenticate,
  authorize(["admin", "manager"]),
  addTable,
);
router.put(
  "/updateTable/:id",
  authenticate,
  authorize(["admin", "manager"]),
  updateTable,
);
router.delete(
  "/deleteTable/:id",
  authenticate,
  authorize(["admin"]),
  deleteTable,
);

module.exports = router;
