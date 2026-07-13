"use client";
import axios from "axios";
import ui from "@/css/ui.module.css";
import Badge from "@/components/Badge";
import Loader from "@/components/Loader";
import { useEffect, useState } from "react";
import { useSnackbar } from "@/components/Snackbar";

function fmtTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

export default function HistoryTemplate() {
  const showSnackbar = useSnackbar();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [paidRes, cancelledRes] = await Promise.all([
          axios.get("/order/api?status=paid"),
          axios.get("/order/api?status=cancelled"),
        ]);
        const combined = [...paidRes.data, ...cancelledRes.data].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        );
        setOrders(combined);
      } catch (err) {
        showSnackbar?.({
          message:
            err.response?.data?.message || "Could not load order history.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <Loader label="Loading order history…" />;

  return (
    <>
      <div className={ui.tabs}>
        {["all", "paid", "cancelled"].map((f) => (
          <button
            key={f}
            type="button"
            className={`${ui.tabBtn} ${filter === f ? ui.tabBtnActive : ""}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: "capitalize" }}
          >
            {f}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div className={ui.emptyState}>
          <div className={ui.ic}>🧾</div>
          No orders found.
        </div>
      ) : (
        <div className={ui.card} style={{ padding: 0, overflowX: "auto" }}>
          <table className={ui.dataTable}>
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Table</th>
                <th>Time</th>
                <th>Method</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const amount = o.items.reduce((s, i) => s + i.price * i.qty, 0);
                return (
                  <tr key={o._id}>
                    <td className={ui.mono}>{o.billNumber || "—"}</td>
                    <td>{o.tableName || o.type}</td>
                    <td className={ui.muted}>{fmtTime(o.updatedAt)}</td>
                    <td>{o.payment?.method || "—"}</td>
                    <td className={ui.mono} style={{ textAlign: "right" }}>
                      Rs {amount.toLocaleString()}
                    </td>
                    <td>
                      <Badge status={o.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
