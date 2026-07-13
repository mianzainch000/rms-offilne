"use client";
import axios from "axios";
import ui from "@/css/ui.module.css";
import Loader from "@/components/Loader";
import StatCard from "@/components/StatCard";
import styles from "@/css/Expenses.module.css";
import { useSnackbar } from "@/components/Snackbar";
import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";

const emptyExpenseForm = {
  title: "",
  amount: "",
  category: "",
  date: "",
  description: "",
};

const PERIODS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpensesTemplate() {
  const showSnackbar = useSnackbar();
  const notify = (message, type = "success") =>
    showSnackbar?.({ message, type });

  const [activeTab, setActiveTab] = useState("expenses");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [totalSales, setTotalSales] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const load = async () => {
    setLoading(true);
    try {
      const [expensesRes, categoriesRes, paidOrdersRes] = await Promise.all([
        axios.get("/expenses/api"),
        axios.get("/expenses/category"),
        axios.get("/order/api?status=paid"),
      ]);
      setExpenses(expensesRes.data || []);
      setCategories(categoriesRes.data || []);
      const sales = (paidOrdersRes.data || []).reduce((sum, o) => {
        if (o.payment?.paidAmount) return sum + o.payment.paidAmount;
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
          sum +
          subtotal -
          discountAmt +
          taxAmt +
          Number(o.serviceCharge || 0) +
          deliveryAmt
        );
      }, 0);
      setTotalSales(sales);
    } catch (err) {
      notify(
        err.response?.data?.message || "Could not load expenses.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount || 0),
    0,
  );
  const netProfit = totalSales - totalExpenses;
  const isProfit = netProfit >= 0;

  const today = todayStr();
  const thisWeekStart = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  })();
  const thisMonth = today.slice(0, 7);
  const thisYear = today.slice(0, 4);

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((exp) => {
        if (!exp.date) return false;
        const catMatch =
          filterCategory === "all" || exp.category === filterCategory;

        let periodMatch = true;
        if (filterPeriod === "today") periodMatch = exp.date === today;
        else if (filterPeriod === "week")
          periodMatch = exp.date >= thisWeekStart && exp.date <= today;
        else if (filterPeriod === "month")
          periodMatch = exp.date.startsWith(thisMonth);
        else if (filterPeriod === "year")
          periodMatch = exp.date.startsWith(thisYear);
        else {
          const yearMatch =
            filterYear === "all" || exp.date.startsWith(filterYear);
          const monthMatch =
            filterMonth === "all" || exp.date.startsWith(filterMonth);
          periodMatch = yearMatch && monthMatch;
        }
        return catMatch && periodMatch;
      }),
    [expenses, filterCategory, filterPeriod, filterMonth, filterYear],
  );

  const filteredTotal = filteredExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount || 0),
    0,
  );

  const categoryBreakdown = categories
    .map((cat) => {
      const catExpenses = filteredExpenses.filter(
        (exp) => exp.category === cat.name,
      );
      const total = catExpenses.reduce(
        (sum, exp) => sum + Number(exp.amount || 0),
        0,
      );
      return { name: cat.name, total };
    })
    .filter((c) => c.total > 0);

  const availableYears = useMemo(
    () =>
      [
        ...new Set([
          thisYear,
          ...expenses.map((exp) => exp.date?.slice(0, 4)).filter(Boolean),
        ]),
      ]
        .sort()
        .reverse(),
    [expenses, thisYear],
  );

  const availableMonths = useMemo(
    () =>
      [
        ...new Set([
          thisMonth,
          ...expenses
            .filter(
              (exp) => filterYear === "all" || exp.date?.startsWith(filterYear),
            )
            .map((exp) => exp.date?.slice(0, 7))
            .filter(Boolean),
        ]),
      ]
        .sort()
        .reverse(),
    [expenses, filterYear, thisMonth],
  );

  const clearFilters = () => {
    setFilterPeriod("all");
    setFilterCategory("all");
    setFilterYear("all");
    setFilterMonth("all");
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (
      !expenseForm.title ||
      !expenseForm.amount ||
      !expenseForm.category ||
      !expenseForm.date
    ) {
      notify("Kindly fill all required fields!", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingExpenseId) {
        const res = await axios.put(
          `/expenses/api/${editingExpenseId}`,
          expenseForm,
        );
        notify(res.data.message || "Expense entry updated!");
        setEditingExpenseId(null);
      } else {
        const res = await axios.post("/expenses/api", expenseForm);
        notify(res.data.message || "Expense logged successfully!");
      }
      setExpenseForm(emptyExpenseForm);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  const triggerExpenseDelete = (id) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Expense",
      message: "Are you sure you want to delete this expense log entry?",
      onConfirm: async () => {
        try {
          const res = await axios.delete(`/expenses/api/${id}`);
          notify(res.data.message || "Expense log deleted!");
          load();
        } catch (err) {
          notify(err.response?.data?.message || "Could not delete.", "error");
        }
      },
    });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingCategoryId) {
        const res = await axios.put(`/expenses/category/${editingCategoryId}`, {
          name: categoryForm.name.trim(),
        });
        notify(res.data.message || "Category updated!");
        setEditingCategoryId(null);
      } else {
        const res = await axios.post("/expenses/category", {
          name: categoryForm.name.trim(),
        });
        notify(res.data.message || "Category added!");
      }
      setCategoryForm({ name: "" });
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  const triggerCategoryDelete = (cat) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Category",
      message: `Are you sure you want to permanently delete "${cat.name}"?`,
      onConfirm: async () => {
        try {
          const res = await axios.delete(`/expenses/category/${cat._id}`);
          notify(res.data.message || "Category deleted!");
          load();
        } catch (err) {
          notify(err.response?.data?.message || "Could not delete.", "error");
        }
      },
    });
  };

  if (loading) return <Loader label="Loading expenses…" />;

  return (
    <div>
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
      />

      {}
      <div
        className={ui.grid}
        style={{
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          marginBottom: 16,
        }}
      >
        <StatCard
          label="Total Sales"
          value={`Rs ${totalSales.toLocaleString()}`}
          sub="Gross revenue"
        />
        <StatCard
          label="Expenses"
          value={`Rs ${totalExpenses.toLocaleString()}`}
          sub="Operational overheads"
        />
        <div
          className={`${ui.card} ${ui.statCard} ${isProfit ? styles.profitCard : styles.lossCard}`}
        >
          <div className={ui.label}>Net {isProfit ? "Profit" : "Loss"}</div>
          <div className={ui.val}>
            Rs {Math.abs(netProfit).toLocaleString()}
          </div>
          <div className={ui.sub}>
            {isProfit ? "Business Profit" : "Business Loss"}
          </div>
        </div>
      </div>

      {}
      <div className={styles.headerRow}>
        <div>
          <div className={ui.sectionTitle} style={{ margin: 0 }}>
            Expense &amp; Ledger Controls
          </div>
          <p className={ui.muted} style={{ fontSize: 13, margin: "4px 0 0" }}>
            Manage operational costs and overhead expenses below.
          </p>
        </div>
      </div>

      <div className={ui.tabs}>
        <button
          className={`${ui.tabBtn} ${activeTab === "expenses" ? ui.tabBtnActive : ""}`}
          onClick={() => {
            setActiveTab("expenses");
            setEditingExpenseId(null);
            setExpenseForm(emptyExpenseForm);
          }}
        >
          Manage Expenses
        </button>
        <button
          className={`${ui.tabBtn} ${activeTab === "categories" ? ui.tabBtnActive : ""}`}
          onClick={() => {
            setActiveTab("categories");
            setEditingCategoryId(null);
            setCategoryForm({ name: "" });
          }}
        >
          Expense Categories
        </button>
      </div>

      {activeTab === "expenses" && (
        <div className={styles.mainGrid}>
          <div className={`${ui.card} ${styles.formCard}`}>
            <div className={ui.sectionTitle}>
              {editingExpenseId ? "Edit Expense Entry" : "Add New Expense"}
            </div>
            <form onSubmit={handleExpenseSubmit}>
              <div className={ui.field}>
                <label>Expense Title *</label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, title: e.target.value })
                  }
                  placeholder="e.g., Gas Cylinder Refill"
                  required
                />
              </div>
              <div className={ui.field}>
                <label>Amount (Rs.) *</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>
              <div className={ui.field}>
                <label>Category *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={ui.field}>
                <label>Date *</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, date: e.target.value })
                  }
                  required
                />
              </div>
              <div className={ui.field}>
                <label>Description Note</label>
                <textarea
                  rows="2"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Write details here…"
                />
              </div>
              <div className={`${ui.flex} ${ui.gap8}`}>
                <button
                  type="submit"
                  className={`${ui.btn} ${ui.btnPrimary} ${ui.wFull}`}
                  disabled={saving}
                >
                  {editingExpenseId ? "Update Entry" : "Save Expense"}
                </button>
                {editingExpenseId && (
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.btnOutline}`}
                    onClick={() => {
                      setEditingExpenseId(null);
                      setExpenseForm(emptyExpenseForm);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className={`${ui.card} ${styles.tableCard}`}>
            <div className={ui.sectionTitle}>Operational Expense Logs</div>

            <div className={styles.filterRow}>
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setFilterPeriod(p.key);
                    setFilterMonth("all");
                    setFilterYear("all");
                  }}
                  className={`${ui.btn} ${ui.btnSm} ${filterPeriod === p.key ? ui.btnPrimary : ui.btnOutline}`}
                >
                  {p.label}
                </button>
              ))}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={styles.filterSelect}
                style={{ marginLeft: "auto" }}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterRow}>
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setFilterMonth("all");
                  setFilterPeriod("all");
                }}
                className={styles.filterSelect}
              >
                <option value="all">All Years</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setFilterPeriod("all");
                }}
                className={styles.filterSelect}
              >
                <option value="all">All Months</option>
                {availableMonths.map((m) => {
                  const [yr, mo] = m.split("-");
                  const label = new Date(yr, parseInt(mo) - 1).toLocaleString(
                    "en-US",
                    { month: "long", year: "numeric" },
                  );
                  return (
                    <option key={m} value={m}>
                      {label}
                    </option>
                  );
                })}
              </select>
              {(filterPeriod !== "all" ||
                filterCategory !== "all" ||
                filterYear !== "all" ||
                filterMonth !== "all") && (
                <button
                  onClick={clearFilters}
                  className={`${ui.btn} ${ui.btnSm} ${ui.btnGhost}`}
                >
                  Clear All
                </button>
              )}
            </div>

            {categoryBreakdown.length > 0 && (
              <div className={styles.breakdownBox}>
                <div className={styles.breakdownHead}>
                  <span>Category Breakdown</span>
                  <span className={styles.breakdownTotal}>
                    Total: Rs. {filteredTotal.toLocaleString()}
                  </span>
                </div>
                <div className={styles.breakdownChips}>
                  {categoryBreakdown.map((c) => (
                    <button
                      key={c.name}
                      onClick={() =>
                        setFilterCategory(
                          filterCategory === c.name ? "all" : c.name,
                        )
                      }
                      className={`${styles.chip} ${filterCategory === c.name ? styles.chipActive : ""}`}
                    >
                      <span>{c.name}</span>
                      <strong>Rs. {c.total.toLocaleString()}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.tableScroll}>
              <table className={ui.dataTable}>
                <thead>
                  <tr>
                    <th>Title / Note</th>
                    <th>Category</th>
                    <th>Amount Spent</th>
                    <th>Date Logged</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className={ui.muted}
                        style={{ textAlign: "center" }}
                      >
                        No expenses found for selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp._id}>
                        <td>
                          <div>{exp.title}</div>
                          {exp.description && (
                            <small className={ui.muted}>
                              {exp.description}
                            </small>
                          )}
                        </td>
                        <td>
                          <span className={`${ui.badge} ${ui.badgeConfirmed}`}>
                            {exp.category}
                          </span>
                        </td>
                        <td>Rs. {Number(exp.amount).toLocaleString()}</td>
                        <td className={ui.muted}>{exp.date}</td>
                        <td>
                          <div className={`${ui.flex} ${ui.gap8}`}>
                            <button
                              type="button"

                              onClick={() => {
                                setEditingExpenseId(exp._id);
                                setExpenseForm({
                                  title: exp.title,
                                  amount: exp.amount,
                                  category: exp.category,
                                  date: exp.date,
                                  description: exp.description || "",
                                });
                              }}
                              aria-label="Edit category"
                              className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                              style={{ color: "var(--red)" }}
                              onClick={() => triggerExpenseDelete(exp._id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className={styles.mainGrid}>
          <div className={`${ui.card} ${styles.formCard}`}>
            <div className={ui.sectionTitle}>
              {editingCategoryId ? "Edit Category Name" : "Create Category"}
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className={ui.field}>
                <label>Category Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ name: e.target.value })}
                  placeholder="e.g., Utilities"
                  required
                />
              </div>
              <div className={`${ui.flex} ${ui.gap8}`}>
                <button
                  type="submit"
                  className={`${ui.btn} ${ui.btnPrimary} ${ui.wFull}`}
                  disabled={saving}
                >
                  {editingCategoryId ? "Rename Category" : "Add Category"}
                </button>
                {editingCategoryId && (
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.btnOutline}`}
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryForm({ name: "" });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className={`${ui.card} ${styles.tableCard}`}>
            <div className={ui.sectionTitle}>Expense Categories</div>
            <div className={styles.tableScroll}>
              <table className={ui.dataTable}>
                <thead>
                  <tr>
                    <th>Category Title</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td
                        colSpan="2"
                        className={ui.muted}
                        style={{ textAlign: "center" }}
                      >
                        No categories yet.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat._id}>
                        <td>{cat.name}</td>
                        <td>
                          <div className={`${ui.flex} ${ui.gap8}`}>
                            <button
                              type="button"

                              onClick={() => {
                                setEditingCategoryId(cat._id);
                                setCategoryForm({ name: cat.name });
                              }}
                              aria-label="Edit category"
                              className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                              style={{ color: "var(--red)" }}
                              onClick={() => triggerCategoryDelete(cat)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
