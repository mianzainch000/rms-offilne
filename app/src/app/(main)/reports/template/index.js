"use client";
import axios from "axios";
import ui from "@/css/ui.module.css";
import Loader from "@/components/Loader";
import StatCard from "@/components/StatCard";
import styles from "@/css/Reports.module.css";
import { useSnackbar } from "@/components/Snackbar";
import { useEffect, useMemo, useState } from "react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function toDateStr(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function startOfWeek(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
}
function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TYPE_LABEL = {
  "dine-in": "Dine-in",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

export default function ReportsTemplate() {
  const showSnackbar = useSnackbar();
  const [paid, setPaid] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState("daily");

  const [dailyDate, setDailyDate] = useState(todayStr());
  const [weeklyDate, setWeeklyDate] = useState(todayStr());

  const now = new Date();
  const [monthlyYear, setMonthlyYear] = useState(now.getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(now.getMonth());

  useEffect(() => {
    const load = async () => {
      try {
        const [paidRes, cancelledRes] = await Promise.all([
          axios.get("/order/api?status=paid"),
          axios.get("/order/api?status=cancelled"),
        ]);
        setPaid(paidRes.data || []);
        setCancelled(cancelledRes.data || []);
      } catch (err) {
        showSnackbar?.({
          message: err.response?.data?.message || "Could not load reports.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentYear = now.getFullYear();
  const years = useMemo(() => {
    const set = new Set([currentYear]);
    paid.forEach((o) => {
      const y = new Date(o.paidAt || o.updatedAt).getFullYear();
      if (y <= currentYear) set.add(y);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [paid, currentYear]);

  useEffect(() => {
    if (!years.includes(monthlyYear)) setMonthlyYear(currentYear);
  }, [years]);

  const range = useMemo(() => {
    if (period === "daily") {
      return { start: dailyDate, end: dailyDate, label: dailyDate };
    }
    if (period === "weekly") {
      const s = startOfWeek(weeklyDate);
      const e = addDays(s, 6);
      return {
        start: toDateStr(s),
        end: toDateStr(e),
        label: `${toDateStr(s)} to ${toDateStr(e)}`,
      };
    }

    const s = new Date(monthlyYear, monthlyMonth, 1);
    const e = new Date(monthlyYear, monthlyMonth + 1, 0);
    return {
      start: toDateStr(s),
      end: toDateStr(e),
      label: `${MONTH_NAMES[monthlyMonth]} ${monthlyYear}`,
    };
  }, [period, dailyDate, weeklyDate, monthlyYear, monthlyMonth]);

  const rangePaid = useMemo(
    () =>
      paid.filter((o) => {
        const d = toDateStr(o.paidAt || o.updatedAt);
        return d >= range.start && d <= range.end;
      }),
    [paid, range],
  );
  const rangeCancelled = useMemo(
    () =>
      cancelled.filter((o) => {
        const d = toDateStr(o.updatedAt);
        return d >= range.start && d <= range.end;
      }),
    [cancelled, range],
  );

  const totalSales = rangePaid.reduce(
    (s, o) => s + o.items.reduce((x, i) => x + i.price * i.qty, 0),
    0,
  );

  function orderGrandTotal(o) {
    if (o.payment?.paidAmount) return o.payment.paidAmount;
    const subtotal = o.items.reduce((x, i) => x + i.price * i.qty, 0);
    const discountAmt =
      o.discountType === "percent"
        ? Math.round((subtotal * (o.discountValue || 0)) / 100)
        : Number(o.discountValue || 0);
    const taxAmt = Math.round(
      ((subtotal - discountAmt) * (o.taxPercent || 0)) / 100,
    );
    const deliveryAmt = Number(o.deliveryCharge || 0);
    return (
      subtotal -
      discountAmt +
      taxAmt +
      Number(o.serviceCharge || 0) +
      deliveryAmt
    );
  }
  const totalCollected = rangePaid.reduce((s, o) => s + orderGrandTotal(o), 0);

  const itemTotals = {};
  rangePaid.forEach((o) =>
    o.items.forEach((it) => {
      itemTotals[it.name] = (itemTotals[it.name] || 0) + it.qty;
    }),
  );
  const bestSellers = Object.entries(itemTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const typeTotals = {
    "dine-in": { count: 0, amount: 0 },
    takeaway: { count: 0, amount: 0 },
    delivery: { count: 0, amount: 0 },
  };
  rangePaid.forEach((o) => {
    const t = typeTotals[o.type] ? o.type : "dine-in";
    const amount = o.items.reduce((x, i) => x + i.price * i.qty, 0);
    typeTotals[t].count += 1;
    typeTotals[t].amount += amount;
  });

  const paymentTotals = { Cash: 0, Card: 0, Online: 0 };
  rangePaid.forEach((o) => {
    const method = o.payment?.method || "Unknown";
    const amount = o.items.reduce((x, i) => x + i.price * i.qty, 0);
    paymentTotals[method] = (paymentTotals[method] || 0) + amount;
  });

  if (loading) return <Loader label="Loading reports…" />;

  return (
    <>
      <div className={ui.tabs}>
        {PERIODS.map((t) => (
          <button
            key={t.key}
            className={`${ui.tabBtn} ${period === t.key ? ui.tabBtnActive : ""}`}
            onClick={() => setPeriod(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {period === "daily" && (
        <div className={ui.field} style={{ maxWidth: 320, marginBottom: 16 }}>
          <label>Select Date</label>
          <input
            type="date"
            value={dailyDate}
            onChange={(e) => setDailyDate(e.target.value)}
          />
        </div>
      )}

      {period === "weekly" && (
        <div className={ui.field} style={{ maxWidth: 320, marginBottom: 16 }}>
          <label>Any Day In The Week</label>
          <input
            type="date"
            value={weeklyDate}
            onChange={(e) => setWeeklyDate(e.target.value)}
          />
          <p className={ui.muted} style={{ fontSize: 12.5, marginTop: 6 }}>
            Week: {range.start} to {range.end}
          </p>
        </div>
      )}

      {period === "monthly" && (
        <div className={styles.monthlyPicker}>
          <div className={styles.pickerRow}>
            {years.map((y) => (
              <button
                key={y}
                className={`${ui.btn} ${ui.btnSm} ${monthlyYear === y ? ui.btnPrimary : ui.btnOutline}`}
                onClick={() => setMonthlyYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
          <div className={styles.pickerRow}>
            {MONTH_NAMES.map((m, i) => (
              <button
                key={m}
                className={`${ui.btn} ${ui.btnSm} ${monthlyMonth === i ? ui.btnPrimary : ui.btnOutline}`}
                onClick={() => setMonthlyMonth(i)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={ui.sectionTitle} style={{ marginBottom: 10 }}>
        Report: {range.label}
      </div>

      <div
        className={ui.grid}
        style={{
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          marginBottom: 16,
        }}
      >
        <StatCard
          label="Food Sales (Net)"
          value={`Rs ${totalSales.toLocaleString()}`}
        />
        <StatCard
          label="Total Collected (with Tax & Charges)"
          value={`Rs ${totalCollected.toLocaleString()}`}
        />
        <StatCard label="Orders" value={rangePaid.length} />
        <StatCard label="Cancelled Orders" value={rangeCancelled.length} />
      </div>

      <div className={ui.sectionTitle} style={{ marginBottom: 10 }}>
        Sales by Order Type
      </div>
      <div
        className={ui.grid}
        style={{
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          marginBottom: 16,
        }}
      >
        {Object.entries(typeTotals).map(([type, { count, amount }]) => (
          <StatCard
            key={type}
            label={TYPE_LABEL[type]}
            value={`Rs ${amount.toLocaleString()}`}
            sub={`${count} order${count === 1 ? "" : "s"}`}
          />
        ))}
      </div>

      <div className={ui.sectionTitle} style={{ marginBottom: 10 }}>
        Sales by Payment Method
      </div>
      <div
        className={ui.grid}
        style={{
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          marginBottom: 16,
        }}
      >
        {Object.entries(paymentTotals).map(([method, amount]) => (
          <StatCard
            key={method}
            label={method}
            value={`Rs ${amount.toLocaleString()}`}
          />
        ))}
      </div>

      <div className={`${ui.card} ${styles.panel}`}>
        <div className={ui.sectionTitle}>Best-Selling Items</div>
        {!bestSellers.length ? (
          <p className={ui.muted} style={{ fontSize: 13 }}>
            No sales in this period.
          </p>
        ) : (
          <table className={ui.dataTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Qty Sold</th>
              </tr>
            </thead>
            <tbody>
              {bestSellers.map(([name, qty]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td style={{ textAlign: "right" }}>{qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
