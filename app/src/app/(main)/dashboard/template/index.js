"use client";
import axios from "axios";
import Link from "next/link";
import ui from "@/css/ui.module.css";
import Badge from "@/components/Badge";
import Loader from "@/components/Loader";
import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import styles from "@/css/Dashboard.module.css";
import tileStyles from "@/css/TableTile.module.css";
import { useSnackbar } from "@/components/Snackbar";

const STATUS_LABEL = {
  free: "Tap to start order",
  occupied: "Order in progress",
  ready: "Ready to serve!",
  bill_pending: "Awaiting payment",
};

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function DashboardTemplate() {
  const showSnackbar = useSnackbar();
  const [tables, setTables] = useState([]);
  const [paidToday, setPaidToday] = useState([]);
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tablesRes, paidRes, shiftRes] = await Promise.all([
          axios.get("/tables/api"),
          axios.get("/order/api?status=paid"),
          axios.get("/shift/api"),
        ]);
        setTables(tablesRes.data || []);
        setPaidToday(
          (paidRes.data || []).filter((o) => isToday(o.paidAt || o.updatedAt)),
        );
        setShift(shiftRes.data || null);
      } catch (err) {
        showSnackbar?.({
          message: err.response?.data?.message || "Could not load dashboard.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loader label="Loading dashboard…" />;

  const totalSales = paidToday.reduce(
    (s, o) => s + o.items.reduce((x, i) => x + i.price * i.qty, 0),
    0,
  );
  const runningTables = tables.filter((t) => t.status !== "free").length;
  const readyTables = tables.filter((t) => t.status === "ready").length;
  const pendingBills = tables.filter((t) => t.status === "bill_pending").length;

  const itemTotals = {};
  paidToday.forEach((o) => {
    o.items.forEach((it) => {
      itemTotals[it.name] = (itemTotals[it.name] || 0) + it.qty;
    });
  });
  const topItems = Object.entries(itemTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <>
      {}
      <div className={`${ui.grid} ${styles.statGrid}`}>
        <StatCard
          label="Today's Sales"
          value={`Rs ${totalSales.toLocaleString()}`}
          sub={`${paidToday.length} paid orders`}
        />
        <StatCard
          label="Running Tables"
          value={runningTables}
          sub={`of ${tables.length} tables`}
        />
        <StatCard
          label="Ready to Serve"
          value={readyTables}
          sub="waiting for waiter"
        />
        <StatCard
          label="Pending Bills"
          value={pendingBills}
          sub="awaiting payment"
        />
        <StatCard
          label="Closed Bills Today"
          value={paidToday.length}
          sub="fully paid & closed"
        />
        <StatCard
          label="Shift Status"
          value={shift ? "🟢 Open" : "🔴 Closed"}
          sub={
            shift
              ? `since ${new Date(shift.openedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
              : "no active shift"
          }
        />
      </div>

      {}
      <div className={`${ui.grid} ${styles.bottomGrid}`}>
        {}
        <div className={`${ui.card} ${styles.panel}`}>
          <div
            className={ui.sectionTitle}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <span
              style={{ fontWeight: 700, fontSize: "18px", color: "#111827" }}
            >
              Live Floor
            </span>
            <span
              className={ui.muted}
              style={{
                fontSize: "13px",
                fontWeight: 600,
                background: "#f3f4f6",
                padding: "4px 10px",
                borderRadius: "20px",
              }}
            >
              {tables.length} Tables
            </span>
          </div>

          {!tables.length ? (
            <div
              className={ui.emptyState}
              style={{ padding: "30px", textAlign: "center" }}
            >
              <div className={ui.ic} style={{ fontSize: "28px" }}>
                🍽️
              </div>
              <p
                style={{ color: "#6b7280", fontSize: "14px", marginTop: "8px" }}
              >
                No tables yet.{" "}
                <Link
                  href="/tables"
                  style={{ color: "#3b82f6", fontWeight: 600 }}
                >
                  Add tables →
                </Link>
              </p>
            </div>
          ) : (
            <div className={tileStyles.tableGrid}>
              {tables.map((t) => {
                const statusClass =
                  {
                    free: tileStyles.free,
                    occupied: tileStyles.occupied,
                    ready: tileStyles.ready,
                    bill_pending: tileStyles.billPending,
                  }[t.status] || "";

                return (
                  <div
                    key={t._id}
                    className={`${tileStyles.tile} ${statusClass}`}
                  >
                    {}
                    <Link
                      href={`/order?table=${t._id}`}
                      className={tileStyles.cardLink}
                    >
                      <div className={tileStyles.cardHeader}>
                        <span className={tileStyles.tname}>{t.name}</span>
                        <Badge status={t.status} />
                      </div>
                      <div className={tileStyles.tmeta}>
                        {STATUS_LABEL[t.status]}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {}
        <div className={`${ui.card} ${styles.panel}`}>
          <div
            className={ui.sectionTitle}
            style={{
              fontWeight: 700,
              fontSize: "18px",
              color: "#111827",
              marginBottom: "20px",
            }}
          >
            Top Selling Items Today
          </div>

          {!topItems.length ? (
            <p
              className={ui.muted}
              style={{ fontSize: 14, textAlign: "center", padding: "20px 0" }}
            >
              No sales recorded yet today.
            </p>
          ) : (
            <table
              className={ui.dataTable}
              style={{ width: "100%", borderCollapse: "collapse" }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  <th
                    style={{
                      textAlign: "left",
                      paddingBottom: "10px",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    ITEM
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      paddingBottom: "10px",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    QTY
                  </th>
                </tr>
              </thead>
              <tbody>
                {topItems.map(([name, qty]) => (
                  <tr key={name} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td
                      style={{
                        padding: "12px 0",
                        color: "#374151",
                        fontWeight: 500,
                        fontSize: "14px",
                        textTransform: "capitalize",
                      }}
                    >
                      {name}
                    </td>
                    <td
                      style={{
                        padding: "12px 0",
                        textAlign: "right",
                        color: "#111827",
                        fontWeight: 700,
                        fontSize: "14px",
                      }}
                    >
                      {qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
