"use client";
import axios from "axios";
import ui from "@/css/ui.module.css";
import Modal from "@/components/Modal";
import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import menuStyles from "@/css/Menu.module.css";
import styles from "@/css/OrderEditor.module.css";
import { useSnackbar } from "@/components/Snackbar";
import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useSearchParams, useRouter } from "next/navigation";
import { printReceipt, buildBillReceiptHTML } from "@/utils/print";

export default function OrderEditorTemplate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = searchParams.get("table");
  const orderType = searchParams.get("type") || "dine-in";
  const orderIdParam = searchParams.get("order");
  const { canManage } = useAuth();
  const showSnackbar = useSnackbar();
  const notify = (message, type = "success") =>
    showSnackbar?.({ message, type });

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [tableName, setTableName] = useState(
    orderType === "dine-in" ? "" : orderType,
  );
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("Cash");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [menuRes, catRes, settingsRes] = await Promise.all([
          axios.get("/menu/api"),
          axios.get("/menu/api/categories"),
          axios.get("/settings/api").catch(() => ({ data: null })),
        ]);
        setSettings(settingsRes.data);
        setMenuItems(menuRes.data || []);
        setCategories(catRes.data || []);

        let currentOrder = null;

        if (tableId) {
          const tablesRes = await axios.get("/tables/api");
          const table = (tablesRes.data || []).find((t) => t._id === tableId);
          setTableName(table?.name || "");

          if (table?.currentOrderId) {
            const orderRes = await axios.get(
              `/order/api/${table.currentOrderId}`,
            );
            currentOrder = orderRes.data.order;

            if (currentOrder.status === "ready") {
              const serveRes = await axios.put(
                `/order/api/${currentOrder._id}/serve`,
              );
              currentOrder = serveRes.data.order;
              notify("Order picked up for serving");
            }
          } else {
            const createRes = await axios.post("/order/api", {
              type: "dine-in",
              tableId,
              tableName: table?.name || "",
            });
            currentOrder = createRes.data.order;
          }
        } else if (orderIdParam) {
          try {
            const orderRes = await axios.get(`/order/api/${orderIdParam}`);
            currentOrder = orderRes.data.order;
          } catch (err) {
            const createRes = await axios.post("/order/api", {
              type: orderType,
              tableName: orderType,
            });
            currentOrder = createRes.data.order;
            router.replace(
              `/order?type=${orderType}&order=${currentOrder._id}`,
            );
          }
        } else {
          const createRes = await axios.post("/order/api", {
            type: orderType,
            tableName: orderType,
          });
          currentOrder = createRes.data.order;

          router.replace(`/order?type=${orderType}&order=${currentOrder._id}`);
        }

        setOrder(currentOrder);
      } catch (err) {
        notify(err.response?.data?.message || "Could not load order.", "error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tableId, orderIdParam]);

  const activeCategoryNames = useMemo(
    () => categories.filter((c) => c.active !== false).map((c) => c.name),
    [categories],
  );
  const catNames = useMemo(
    () => ["All", ...activeCategoryNames],
    [activeCategoryNames],
  );
  const filteredMenu =
    activeCategory === "All"
      ? menuItems.filter((i) => activeCategoryNames.includes(i.category))
      : menuItems.filter((i) => i.category === activeCategory);

  const totals = useMemo(() => {
    if (!order)
      return {
        subtotal: 0,
        discount: 0,
        tax: 0,
        service: 0,
        delivery: 0,
        total: 0,
      };
    const subtotal = (order.items || []).reduce(
      (s, i) => s + (i.price || 0) * (i.qty || 0),
      0,
    );
    const rawDiscount =
      order.discountType === "percent"
        ? Math.round((subtotal * (order.discountValue || 0)) / 100)
        : Number(order.discountValue || 0);

    const discount = Math.min(Math.max(rawDiscount, 0), subtotal);
    const tax = Math.round(
      ((subtotal - discount) * (order.taxPercent || 0)) / 100,
    );
    const service = Number(order.serviceCharge || 0);
    const delivery = Number(order.deliveryCharge || 0);
    const total = subtotal - discount + tax + service + delivery;
    return { subtotal, discount, tax, service, delivery, total };
  }, [order]);

  const persistItems = async (items) => {
    setOrder((o) => ({ ...o, items }));
    try {
      await axios.put(`/order/api/${order._id}`, { items });
    } catch (err) {
      notify(err.response?.data?.message || "Could not update cart.", "error");
    }
  };

  const addItem = (menuItem) => {
    if (!order) return;
    const items = [...(order.items || [])];
    const idx = items.findIndex((i) => i.menuItemId === menuItem._id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], qty: items[idx].qty + 1 };
    } else {
      items.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        qty: 1,
      });
    }
    persistItems(items);
  };

  const changeQty = (menuItemId, delta) => {
    if (!order) return;
    let items = (order.items || [])
      .map((i) =>
        i.menuItemId === menuItemId ? { ...i, qty: i.qty + delta } : i,
      )
      .filter((i) => i.qty > 0);
    persistItems(items);
  };

  const sendToKitchen = async () => {
    if (!order) return;
    setBusy(true);
    try {
      await axios.put(`/order/api/${order._id}/kitchen`);
      notify("Sent to kitchen");
      router.push("/kitchen");
    } catch (err) {
      notify(
        err.response?.data?.message || "Could not send to kitchen.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const generateBill = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const res = await axios.put(`/order/api/${order._id}/bill`);
      setOrder(res.data.order);
      notify("Bill generated");
    } catch (err) {
      notify(
        err.response?.data?.message || "Could not generate bill.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const updateBillField = async (field, value) => {
    const updated = { ...order, [field]: value };
    setOrder(updated);
    try {
      await axios.put(`/order/api/${order._id}`, { [field]: value });
    } catch (err) {
      notify(err.response?.data?.message || "Could not update bill.", "error");
    }
  };

  const confirmPayment = async () => {
    if (!order) return;
    setBusy(true);
    try {
      await axios.put(`/order/api/${order._id}/pay`, { method: payMethod });
      setPayModalOpen(false);
      notify("Payment recorded — bill closed");
      router.push("/tables");
    } catch (err) {
      notify(
        err.response?.data?.message || "Could not record payment.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async () => {
    if (!order) return;
    setBusy(true);
    try {
      await axios.put(`/order/api/${order._id}/cancel`);
      notify("Order cancelled");
      router.push("/tables");
    } catch (err) {
      notify(err.response?.data?.message || "Could not cancel order.", "error");
    } finally {
      setBusy(false);
    }
  };

  const reopenOrder = async () => {
    if (!order) return;
    setBusy(true);
    try {
      await axios.put(`/order/api/${order._id}`, { status: "open" });
      setOrder((o) => ({ ...o, status: "open" }));
      notify("Order reopened");
    } catch (err) {
      notify(err.response?.data?.message || "Could not reopen order.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading order…" />;

  if (order?.status === "bill_pending") {
    return (
      <div className={styles.orderLayout}>
        <div className={`${ui.card}`} style={{ padding: 20 }}>
          <div className={ui.sectionTitle}>
            Bill {order.billNumber}{" "}
            <span
              className={ui.muted}
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              {tableName}
            </span>
          </div>
          <table className={ui.dataTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((it) => (
                <tr key={it.menuItemId}>
                  <td>{it.name}</td>
                  <td style={{ textAlign: "center" }}>{it.qty}</td>
                  <td className={ui.mono} style={{ textAlign: "right" }}>
                    Rs {(it.price * it.qty).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ maxWidth: 280, marginLeft: "auto", marginTop: 16 }}>
            <div className={styles.receiptLine}>
              <span>Subtotal</span>
              <span>Rs {totals.subtotal.toLocaleString()}</span>
            </div>
            <div className={styles.receiptLine}>
              <span>Discount</span>
              <span>− Rs {totals.discount.toLocaleString()}</span>
            </div>
            <div className={styles.receiptLine}>
              <span>Tax</span>
              <span>Rs {totals.tax.toLocaleString()}</span>
            </div>
            <div className={styles.receiptLine}>
              <span>Service Charge</span>
              <span>Rs {totals.service.toLocaleString()}</span>
            </div>
            {order.type === "delivery" || totals.delivery > 0 ? (
              <div className={styles.receiptLine}>
                <span>Delivery Charge</span>
                <span>Rs {totals.delivery.toLocaleString()}</span>
              </div>
            ) : null}
            <div className={`${styles.receiptLine} ${styles.receiptLineTotal}`}>
              <span>Grand Total</span>
              <span>Rs {totals.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className={`${ui.card} ${styles.cartPanel}`}>
          <div className={ui.sectionTitle}>Payment</div>
          {canManage ? (
            <>
              <div className={ui.field}>
                <label>Discount</label>
                <div className={`${ui.flex} ${ui.gap8}`}>
                  <select
                    style={{ width: 90 }}
                    value={order.discountType}
                    onChange={(e) =>
                      updateBillField("discountType", e.target.value)
                    }
                  >
                    <option value="percent">%</option>
                    <option value="flat">Rs</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    max={order.discountType === "percent" ? 100 : undefined}
                    value={order.discountValue || 0}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      let val = Number(e.target.value) || 0;
                      if (val < 0) val = 0;
                      if (order.discountType === "percent" && val > 100)
                        val = 100;
                      updateBillField("discountValue", val);
                    }}
                  />
                </div>
              </div>
              <div className={ui.field}>
                <label>Tax (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={order.taxPercent || 0}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    let val = Number(e.target.value) || 0;
                    if (val < 0) val = 0;
                    if (val > 100) val = 100;
                    updateBillField("taxPercent", val);
                  }}
                />
              </div>
              <div className={ui.field}>
                <label>Service Charge (Rs)</label>
                <input
                  type="number"
                  min="0"
                  value={order.serviceCharge || 0}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    let val = Number(e.target.value) || 0;
                    if (val < 0) val = 0;
                    updateBillField("serviceCharge", val);
                  }}
                />
              </div>
              {order.type === "delivery" ? (
                <div className={ui.field}>
                  <label>Delivery Charge (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    value={order.deliveryCharge || 0}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      let val = Number(e.target.value) || 0;
                      if (val < 0) val = 0;
                      updateBillField("deliveryCharge", val);
                    }}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary} ${ui.wFull}`}
            disabled={busy}
            onClick={() => setPayModalOpen(true)}
          >
            Take Payment
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnOutline} ${ui.wFull}`}
            style={{ marginTop: 8 }}
            onClick={() =>
              printReceipt(buildBillReceiptHTML({ settings, order, totals }))
            }
          >
            🖨 Print Bill
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnOutline} ${ui.wFull}`}
            style={{ marginTop: 8 }}
            disabled={busy}
            onClick={reopenOrder}
          >
            ← Reopen Order (edit items)
          </button>
        </div>

        <Modal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          title="Take Payment"
          footer={
            <>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnOutline}`}
                onClick={() => setPayModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnPrimary}`}
                disabled={busy}
                onClick={confirmPayment}
              >
                {busy
                  ? "Processing…"
                  : `Confirm Rs ${totals.total.toLocaleString()}`}
              </button>
            </>
          }
        >
          <div className={ui.field} style={{ marginBottom: 8 }}>
            <label>Payment Method</label>
            <div className={styles.payMethodGrid}>
              {[
                { key: "Cash", icon: "💵" },
                { key: "Card", icon: "💳" },
                { key: "Online", icon: "📱" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`${styles.payMethodBtn} ${payMethod === m.key ? styles.payMethodBtnActive : ""}`}
                  onClick={() => setPayMethod(m.key)}
                >
                  <span className={styles.payMethodIcon}>{m.icon}</span>
                  {m.key}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  if (order?.status === "paid" || order?.status === "cancelled") {
    return (
      <div className={ui.card} style={{ padding: 20, maxWidth: 640 }}>
        <div className={ui.sectionTitle}>
          Bill {order.billNumber || "—"}{" "}
          <span
            className={`${ui.badge} ${order.status === "paid" ? ui.badgePaid : ui.badgeCancelled}`}
          >
            {order.status}
          </span>
        </div>
        <table className={ui.dataTable}>
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: "center" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((it) => (
              <tr key={it.menuItemId}>
                <td>{it.name}</td>
                <td style={{ textAlign: "center" }}>{it.qty}</td>
                <td className={ui.mono} style={{ textAlign: "right" }}>
                  Rs {(it.price * it.qty).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ maxWidth: 260, marginLeft: "auto", marginTop: 14 }}>
          <div className={styles.receiptLine}>
            <span>Subtotal</span>
            <span>Rs {totals.subtotal.toLocaleString()}</span>
          </div>
          {totals.discount > 0 ? (
            <div className={styles.receiptLine}>
              <span>Discount</span>
              <span>− Rs {totals.discount.toLocaleString()}</span>
            </div>
          ) : null}
          {totals.tax > 0 ? (
            <div className={styles.receiptLine}>
              <span>Tax</span>
              <span>Rs {totals.tax.toLocaleString()}</span>
            </div>
          ) : null}
          {totals.service > 0 ? (
            <div className={styles.receiptLine}>
              <span>Service Charge</span>
              <span>Rs {totals.service.toLocaleString()}</span>
            </div>
          ) : null}
          {totals.delivery > 0 ? (
            <div className={styles.receiptLine}>
              <span>Delivery Charge</span>
              <span>Rs {totals.delivery.toLocaleString()}</span>
            </div>
          ) : null}
          <div className={`${styles.receiptLine} ${styles.receiptLineTotal}`}>
            <span>Grand Total</span>
            <span>Rs {totals.total.toLocaleString()}</span>
          </div>
          {order.payment?.method ? (
            <div className={styles.receiptLine}>
              <span>Payment Method</span>
              <span>{order.payment.method}</span>
            </div>
          ) : null}
        </div>
        {order.status === "paid" ? (
          <button
            type="button"
            className={`${ui.btn} ${ui.btnOutline} ${ui.wFull}`}
            style={{ marginTop: 16 }}
            onClick={() =>
              printReceipt(buildBillReceiptHTML({ settings, order, totals }))
            }
          >
            🖨 Reprint Bill
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.orderLayout}>
      <div className={styles.leftCol}>
        {}
        <div className={styles.catScroller}>
          {catNames.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.catChip} ${activeCategory === c ? styles.catChipActive : ""}`}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {!filteredMenu.length ? (
          <div className={ui.emptyState}>
            <div className={ui.ic}>📋</div>
            No menu items yet — add some from Menu Management.
          </div>
        ) : (
          <div className={styles.menuGrid}>
            {filteredMenu.map((m) => (
              <div
                key={m._id}
                className={`${styles.itemCard} ${!m.available ? styles.itemCardUnavail : ""}`}
              >
                <div className={styles.itemDetails}>
                  <div className={styles.mname}>{m.name}</div>
                  {m.description && (
                    <div className={styles.mdesc}>{m.description}</div>
                  )}
                </div>
                <div className={styles.mprice}>Rs {m.price}</div>
                <button
                  type="button"
                  className={styles.addBtn}
                  disabled={!m.available}
                  onClick={() => addItem(m)}
                >
                  {m.available ? "+ Add to order" : "Unavailable"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`${ui.card} ${styles.cartPanel}`}>
        <div className={ui.sectionTitle}>{tableName || "Order"}</div>

        {!order?.items?.length ? (
          <p className={ui.muted} style={{ fontSize: 13 }}>
            Cart is empty — add items from the menu.
          </p>
        ) : (
          (order.items || []).map((it) => (
            <div key={it.menuItemId} className={styles.cartLine}>
              <div>
                <div className={styles.lineName}>{it.name}</div>
                <div className={styles.linePrice}>Rs {it.price} each</div>
              </div>
              <div className={styles.qtyStepper}>
                <button
                  type="button"
                  onClick={() => changeQty(it.menuItemId, -1)}
                >
                  −
                </button>
                <span>{it.qty}</span>
                <button
                  type="button"
                  onClick={() => changeQty(it.menuItemId, 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}

        <div style={{ marginTop: 12 }}>
          <div className={styles.receiptLine}>
            <span>Subtotal</span>
            <span>Rs {totals.subtotal.toLocaleString()}</span>
          </div>
          <div className={`${styles.receiptLine} ${styles.receiptLineTotal}`}>
            <span>Total</span>
            <span>Rs {totals.subtotal.toLocaleString()}</span>
          </div>
        </div>

        <div
          className={`${ui.flex} ${ui.gap8}`}
          style={{ marginTop: 16, flexWrap: "wrap" }}
        >
          <button
            type="button"
            className={`${ui.btn} ${ui.btnOutline} ${ui.wFull}`}
            disabled={busy || !order?.items?.length}
            onClick={sendToKitchen}
          >
            Send to Kitchen
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary} ${ui.wFull}`}
            disabled={busy || !order?.items?.length}
            onClick={generateBill}
          >
            Generate Bill →
          </button>
        </div>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnGhost} ${ui.wFull}`}
          style={{ marginTop: 8, color: "var(--red)" }}
          disabled={busy}
          onClick={() => setCancelConfirmOpen(true)}
        >
          ✕ Cancel Order
        </button>
      </div>

      <ConfirmModal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={cancelOrder}
        title="Cancel Order"
        message="This will cancel the order and free up the table. This cannot be undone."
      />
    </div>
  );
}
