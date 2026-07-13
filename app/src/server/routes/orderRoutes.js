const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  sendToKitchen,
  markReady,
  serveOrder,
  generateBill,
  payOrder,
  cancelOrder,
} = require("../controllers/orderController");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/getOrders", authenticate, authorize([]), getOrders);
router.get("/getOrder/:id", authenticate, authorize([]), getOrderById);
router.post("/createOrder", authenticate, authorize([]), createOrder);
router.put("/updateOrder/:id", authenticate, authorize([]), updateOrder);
router.put("/sendToKitchen/:id", authenticate, authorize([]), sendToKitchen);
router.put("/markReady/:id", authenticate, authorize([]), markReady);
router.put("/serveOrder/:id", authenticate, authorize([]), serveOrder);
router.put("/generateBill/:id", authenticate, authorize([]), generateBill);
router.put("/payOrder/:id", authenticate, authorize([]), payOrder);
router.put("/cancelOrder/:id", authenticate, authorize([]), cancelOrder);

module.exports = router;
