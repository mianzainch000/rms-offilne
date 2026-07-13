const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const Shift = require("../models/shiftModel");
const Settings = require("../models/settingsModel");
const MenuItem = require("../models/menuItemModel");

async function getNextBillNumber() {
  const settings = await Settings.findOneAndUpdate(
    {},
    { $inc: { billSequence: 1 } },
    { new: true, upsert: true },
  );
  const prefix = settings?.billPrefix || "";
  const seq = settings?.billSequence || 1;
  return `${prefix}${seq}`;
}

function computeTotals(order) {
  const subtotal = order.items.reduce((s, it) => s + it.price * it.qty, 0);
  const rawDiscountAmt =
    order.discountType === "percent"
      ? Math.round((subtotal * (order.discountValue || 0)) / 100)
      : Number(order.discountValue || 0);

  const discountAmt = Math.min(Math.max(rawDiscountAmt, 0), subtotal);
  const taxAmt = Math.round(
    ((subtotal - discountAmt) * (order.taxPercent || 0)) / 100,
  );
  const deliveryAmt = Number(order.deliveryCharge || 0);
  const rawGrandTotal =
    subtotal -
    discountAmt +
    taxAmt +
    Number(order.serviceCharge || 0) +
    deliveryAmt;
  const grandTotal = Math.max(rawGrandTotal, 0);
  return { subtotal, discountAmt, taxAmt, deliveryAmt, grandTotal };
}

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ order, totals: computeTotals(order) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { type, tableId, tableName } = req.body;

    const activeShift = await Shift.findOne({ status: "open" });
    const settings = await Settings.findOne();

    const finalType = type || "dine-in";
    const order = new Order({
      type: finalType,
      tableId: tableId || null,
      tableName: tableName || "",
      items: [],
      status: "open",
      taxPercent: settings?.taxPercent || 0,
      deliveryCharge:
        finalType === "delivery" ? settings?.defaultDeliveryCharge || 0 : 0,
      shiftId: activeShift?._id || null,
      createdBy: req.user._id,
    });
    await order.save();

    if (tableId) {
      await Table.findByIdAndUpdate(tableId, {
        status: "occupied",
        currentOrderId: order._id,
      });
    }

    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      items,
      discountType,
      discountValue,
      taxPercent,
      serviceCharge,
      deliveryCharge,
      status,
    } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (["paid", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        message: `This order is already ${order.status} and can no longer be edited.`,
      });
    }

    if (status === "open" && order.status === "bill_pending") {
      order.status = "open";
      if (order.tableId) {
        await Table.findByIdAndUpdate(order.tableId, { status: "occupied" });
      }
    }

    if (items) {
      const menuItemIds = items.map((it) => it.menuItemId).filter(Boolean);
      const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
      const menuItemMap = new Map(menuItems.map((m) => [String(m._id), m]));

      order.items = items.map((it) => {
        const qty = Math.max(1, Number(it.qty) || 1);
        const menuItem = it.menuItemId
          ? menuItemMap.get(String(it.menuItemId))
          : null;

        if (menuItem) {
          return {
            menuItemId: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            qty,
          };
        }

        return {
          menuItemId: null,
          name: String(it.name || "Custom item"),
          price: Math.max(0, Number(it.price) || 0),
          qty,
        };
      });
    }
    if (discountType) order.discountType = discountType;
    if (discountValue !== undefined) order.discountValue = discountValue;
    if (taxPercent !== undefined) order.taxPercent = taxPercent;
    if (serviceCharge !== undefined) order.serviceCharge = serviceCharge;
    if (deliveryCharge !== undefined) order.deliveryCharge = deliveryCharge;

    await order.save();
    res
      .status(200)
      .json({ message: "Order updated", order, totals: computeTotals(order) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendToKitchen = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { status: "kitchen" },
      { new: true },
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Sent to kitchen", order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.markReady = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { status: "ready" },
      { new: true },
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, { status: "ready" });
    }

    res.status(200).json({ message: "Order marked ready to serve", order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.serveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { status: "open" },
      { new: true },
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, { status: "occupied" });
    }

    res.status(200).json({ message: "Order being served", order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.generateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (["paid", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        message: `This order is already ${order.status}; a bill can't be generated for it.`,
      });
    }
    if (!order.items.length)
      return res.status(400).json({ message: "Cannot bill an empty order" });

    if (!order.serviceCharge) {
      const settings = await Settings.findOne();
      const pct = settings?.serviceChargePercent || 0;
      if (pct > 0) {
        const subtotal = order.items.reduce(
          (s, it) => s + it.price * it.qty,
          0,
        );
        const discountAmt =
          order.discountType === "percent"
            ? Math.round((subtotal * (order.discountValue || 0)) / 100)
            : Number(order.discountValue || 0);
        order.serviceCharge = Math.round(
          ((subtotal - discountAmt) * pct) / 100,
        );
      }
    }
    if (order.type === "delivery" && !order.deliveryCharge) {
      const settings = await Settings.findOne();
      order.deliveryCharge = settings?.defaultDeliveryCharge || 0;
    }

    if (!order.billNumber) {
      order.billNumber = await getNextBillNumber();
    }
    order.status = "bill_pending";
    await order.save();

    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, { status: "bill_pending" });
    }

    res
      .status(200)
      .json({ message: "Bill generated", order, totals: computeTotals(order) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.payOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body;

    if (!method || !String(method).trim()) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "paid") {
      return res
        .status(400)
        .json({ message: "This order has already been paid." });
    }
    if (order.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "This order was cancelled and cannot be paid." });
    }

    const { grandTotal } = computeTotals(order);

    order.status = "paid";
    order.paidAt = new Date();
    order.payment = { method, status: "paid", paidAmount: grandTotal };
    if (!order.billNumber) {
      order.billNumber = await getNextBillNumber();
    }
    await order.save();

    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        status: "free",
        currentOrderId: null,
      });
    }

    res.status(200).json({ message: "Payment recorded", order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "paid") {
      return res.status(400).json({
        message:
          "This order has already been paid and cannot be cancelled. Use a refund process instead if needed.",
      });
    }
    if (order.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "This order is already cancelled." });
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    await order.save();

    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        status: "free",
        currentOrderId: null,
      });
    }

    res.status(200).json({ message: "Order cancelled", order });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
