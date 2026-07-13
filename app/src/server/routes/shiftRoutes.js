const express = require("express");
const router = express.Router();
const {
  getCurrentShift,
  getShifts,
  openShift,
  closeShift,
} = require("../controllers/shiftController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/getCurrentShift", authenticate, authorize([]), getCurrentShift);
router.get(
  "/getShifts",
  authenticate,
  authorize(["admin", "manager"]),
  getShifts,
);
router.post(
  "/openShift",
  authenticate,
  authorize(["admin", "manager", "cashier"]),
  openShift,
);
router.put(
  "/closeShift/:id",
  authenticate,
  authorize(["admin", "manager", "cashier"]),
  closeShift,
);

module.exports = router;
