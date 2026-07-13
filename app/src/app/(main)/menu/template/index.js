"use client";
import axios from "axios";
import ui from "@/css/ui.module.css";
import Modal from "@/components/Modal";
import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import styles from "@/css/Menu.module.css";
import { useSnackbar } from "@/components/Snackbar";
import { useMemo, useEffect, useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import PermissionWrapper from "@/components/PermissionWrapper";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  description: "",
  available: true,
};

export default function MenuTemplate() {
  const { canManage } = useAuth();
  const showSnackbar = useSnackbar();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [confirmCatId, setConfirmCatId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const notify = (message, type = "success") =>
    showSnackbar?.({ message, type });

  const load = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        axios.get("/menu/api"),
        axios.get("/menu/api/categories"),
      ]);
      setItems(itemsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (err) {
      notify(err.response?.data?.message || "Could not load menu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeCategoryObj = categories.find((c) => c.name === activeCategory);
  const filteredItems = useMemo(
    () =>
      activeCategory === "All"
        ? items
        : items.filter((m) => m.category === activeCategory),
    [items, activeCategory],
  );

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatModalOpen(true);
  };

  const onSaveCategory = async () => {
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      if (editingCategory) {
        await axios.put(`/menu/api/categories/${editingCategory._id}`, {
          name: catName.trim(),
        });
        notify("Category updated");
        if (activeCategory === editingCategory.name)
          setActiveCategory(catName.trim());
      } else {
        await axios.post("/menu/api/categories", { name: catName.trim() });
        notify("Category added");
      }
      setCatModalOpen(false);
      load();
    } catch (err) {
      notify(
        err.response?.data?.message || "Could not save category.",
        "error",
      );
    } finally {
      setCatSaving(false);
    }
  };

  const onDeleteCategory = async () => {
    try {
      await axios.delete(`/menu/api/categories/${confirmCatId}`);
      notify("Category deleted");
      setActiveCategory("All");
      load();
    } catch (err) {
      notify(
        err.response?.data?.message || "Could not delete category.",
        "error",
      );
    }
  };

  const toggleCategoryActive = async (cat) => {
    const nextActive = !(cat.active !== false);
    try {
      await axios.put(`/menu/api/categories/${cat._id}`, {
        active: nextActive,
      });
      setCategories((prev) =>
        prev.map((c) => (c._id === cat._id ? { ...c, active: nextActive } : c)),
      );
    } catch (err) {
      notify(
        err.response?.data?.message || "Could not update category.",
        "error",
      );
    }
  };

  const openAdd = (categoryName) => {
    setEditing(null);
    setForm({
      ...emptyForm,
      category:
        categoryName && categoryName !== "All"
          ? categoryName
          : categories[0]?.name || "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description || "",
      available: item.available,
    });
    setIsModalOpen(true);
  };

  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSave = async () => {
    if (!form.name.trim() || !form.category.trim() || form.price === "") return;
    const numericPrice = Number(form.price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      notify("Price must be a valid number and cannot be negative", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, price: numericPrice };
      if (editing) {
        await axios.put(`/menu/api/${editing._id}`, payload);
        notify("Menu item updated");
      } else {
        await axios.post("/menu/api", payload);
        notify("Menu item added");
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Could not save item.", "error");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    try {
      await axios.delete(`/menu/api/${confirmId}`);
      notify("Menu item deleted");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Could not delete item.", "error");
    }
  };

  const toggleAvail = async (item) => {
    try {
      await axios.put(`/menu/api/${item._id}`, {
        ...item,
        available: !item.available,
      });
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Could not update item.", "error");
    }
  };

  if (loading) return <Loader label="Loading menu…" />;

  return (
    <>
      <div
        className={`${ui.flex} ${ui.justifyBetween} ${ui.itemsCenter}`}
        style={{ marginBottom: 16, flexWrap: "wrap", gap: 10 }}
      >
        <div className={ui.muted} style={{ fontSize: 13 }}>
          {categories.length} categories · {items.length} items
        </div>
        <PermissionWrapper>
          <div className={`${ui.flex} ${ui.gap8}`}>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
              onClick={openAddCategory}
            >
              + Category
            </button>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnPrimary} ${ui.btnSm}`}
              onClick={() => openAdd(activeCategory)}
              disabled={!categories.length}
            >
              + Menu Item
            </button>
          </div>
        </PermissionWrapper>
      </div>

      {!categories.length ? (
        <div className={ui.emptyState}>
          <div className={ui.ic}>📋</div>
          No categories yet.{" "}
          {canManage ? "Add a category first, then add items to it." : ""}
        </div>
      ) : (
        <div className={styles.menuLayout}>
          <div className={`${ui.card} ${styles.sidebar}`}>
            <div className={styles.sidebarTitle}>Categories</div>
            <div className={styles.catList}>
              <button
                type="button"
                className={`${styles.catRow} ${activeCategory === "All" ? styles.catRowActive : ""}`}
                onClick={() => setActiveCategory("All")}
              >
                <span className={styles.catRowName}>All</span>
              </button>

              {categories.map((cat) => {
                const isOn = cat.active !== false;
                return (
                  <div
                    key={cat._id}
                    className={`${styles.catRow} ${activeCategory === cat.name ? styles.catRowActive : ""}`}
                    onClick={() => setActiveCategory(cat.name)}
                  >
                    <span className={styles.catRowName}>{cat.name}</span>
                    <PermissionWrapper>
                      {" "}
                      {canManage ? (
                        <div
                          className={styles.catRowActions}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"

                            onClick={() => openEditCategory(cat)}
                            aria-label="Edit category"
                            className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"

                            className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                            style={{ color: "var(--red)" }}
                            onClick={() => setConfirmCatId(cat._id)}
                            aria-label="Delete category"
                          >
                            🗑️
                          </button>
                          <button
                            type="button"
                            className={`${styles.toggle} ${isOn ? styles.toggleOn : styles.toggleOff}`}
                            onClick={() => toggleCategoryActive(cat)}
                            aria-label={
                              isOn ? "Turn category off" : "Turn category on"
                            }
                            title={isOn ? "On" : "Off"}
                          >
                            <span className={styles.toggleKnob} />
                          </button>
                        </div>
                      ) : null}
                    </PermissionWrapper>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`${ui.card} ${styles.panel}`}>
            <div className={styles.panelHead}>
              <div className={ui.sectionTitle} style={{ margin: 0 }}>
                {activeCategory}
                <span className={styles.catCount}>
                  {filteredItems.length} item
                  {filteredItems.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {!filteredItems.length ? (
              <p className={ui.muted} style={{ fontSize: 13 }}>
                No items in this category yet.
              </p>
            ) : (
              <table className={`${ui.dataTable} ${styles.denseTable}`}>
                <thead>
                  <tr>
                    <th>Name</th>
                    {activeCategory === "All" ? <th>Category</th> : null}
                    <th>Price</th>
                    <th>Status</th>
                    <PermissionWrapper>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </PermissionWrapper>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((m) => (
                    <tr
                      key={m._id}
                      className={!m.available ? styles.rowUnavail : ""}
                    >
                      <td>
                        <div className={styles.mname}>{m.name}</div>
                        {m.description ? (
                          <div className={styles.mdesc}>{m.description}</div>
                        ) : null}
                      </td>
                      {activeCategory === "All" ? (
                        <td className={ui.muted}>{m.category}</td>
                      ) : null}
                      <td className={ui.mono}>Rs {m.price}</td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.statusPill} ${m.available ? styles.statusActive : styles.statusInactive}`}
                          onClick={() => canManage && toggleAvail(m)}
                          disabled={!canManage}
                        >
                          {m.available ? "Active" : "Off"}
                        </button>
                      </td>
                      <td>
                        <PermissionWrapper>
                          <div
                            className={`${ui.flex} ${ui.gap8}`}
                            style={{ justifyContent: "flex-end" }}
                          >
                            <button
                              type="button"
                              className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                              onClick={() => openEdit(m)}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                              style={{ color: "var(--red)" }}
                              onClick={() => setConfirmId(m._id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </PermissionWrapper>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Add Category"}
        footer={
          <>
            {editingCategory ? (
              <button
                type="button"
                className={`${ui.btn} ${ui.btnGhost}`}
                style={{ color: "var(--red)", marginRight: "auto" }}
                onClick={() => {
                  setConfirmCatId(editingCategory._id);
                  setCatModalOpen(false);
                }}
              >
                Delete
              </button>
            ) : null}
            <button
              type="button"
              className={`${ui.btn} ${ui.btnOutline}`}
              onClick={() => setCatModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnPrimary}`}
              disabled={catSaving}
              onClick={onSaveCategory}
            >
              {catSaving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className={ui.field}>
          <label>Category Name</label>
          <input
            type="text"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="e.g. Sandwiches"
            autoFocus
          />
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? "Edit Menu Item" : "Add Menu Item"}
        footer={
          <>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnOutline}`}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnPrimary}`}
              disabled={saving}
              onClick={onSave}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className={ui.field}>
          <label>Item Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="e.g. Chicken Karahi"
            autoFocus
          />
        </div>
        <div className={ui.field}>
          <label>Category</label>
          <select name="category" value={form.category} onChange={onChange}>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className={ui.field}>
          <label>Price (Rs)</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={onChange}
            onFocus={(e) => e.target.select()}
            placeholder="0"
            min="0"
          />
        </div>
        <div className={ui.field}>
          <label>Description (optional)</label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="e.g. Serves 2"
          />
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >
          <input
            type="checkbox"
            name="available"
            checked={form.available}
            onChange={onChange}
          />
          Available
        </label>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
        title="Delete Menu Item"
        message="This will permanently remove the item from the menu. Continue?"
      />

      <ConfirmModal
        isOpen={!!confirmCatId}
        onClose={() => setConfirmCatId(null)}
        onConfirm={onDeleteCategory}
        title="Delete Category"
        message="This category must be empty (no items) before it can be deleted. Continue?"
      />
    </>
  );
}
