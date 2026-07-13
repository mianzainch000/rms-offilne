"use client";
import axios from "axios";
import ui from "@/css/ui.module.css";
import Badge from "@/components/Badge";
import Loader from "@/components/Loader";
import { useEffect, useState } from "react";
import styles from "@/css/Kitchen.module.css";
import { useSnackbar } from "@/components/Snackbar";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  return `${mins} min ago`;
}

export default function KitchenTemplate() {
  const showSnackbar = useSnackbar();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await axios.get("/order/api?status=kitchen");
      setTickets(res.data || []);
    } catch (err) {
      showSnackbar?.({
        message:
          err.response?.data?.message || "Could not load kitchen tickets.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const markReady = async (id) => {
    try {
      await axios.put(`/order/api/${id}/ready`);
      showSnackbar?.({
        message: "Order marked ready — table notified",
        type: "success",
      });
      load();
    } catch (err) {
      showSnackbar?.({
        message: err.response?.data?.message || "Could not update ticket.",
        type: "error",
      });
    }
  };

  if (loading) return <Loader label="Loading kitchen tickets…" />;

  if (!tickets.length) {
    return (
      <div className={ui.emptyState}>
        <div className={ui.ic}>🍳</div>
        No active kitchen tickets.
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {tickets.map((tk) => (
        <div key={tk._id} className={styles.ticket}>
          <div className={styles.head}>
            <span className={styles.tableName}>{tk.tableName || tk.type}</span>
            <Badge status="kitchen" />
          </div>

          <ul className={styles.itemList}>
            {tk.items.map((it) => (
              <li key={it.menuItemId} className={styles.itemRow}>
                <span className={styles.qty}>{it.qty}x</span>
                <span className={styles.itemName}>{it.name}</span>
              </li>
            ))}
          </ul>

          <div className={styles.footer}>
            <span className={styles.time}>🕒 {timeAgo(tk.updatedAt)}</span>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => markReady(tk._id)}
            >
              Mark Ready
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
