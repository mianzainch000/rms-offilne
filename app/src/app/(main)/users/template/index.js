"use client";
import axios from "axios";
import ui from "@/css/ui.module.css";
import Modal from "@/components/Modal";
import Loader from "@/components/Loader";
import { useEffect, useState } from "react";
import { useSnackbar } from "@/components/Snackbar";
import ConfirmModal from "@/components/ConfirmModal";

const ROLES = ["admin", "manager", "cashier", "waiter"];
const emptyForm = {
  name: "",
  email: "",
  role: "waiter",
  status: "active",
  password: "",
};

export default function UsersTemplate() {
  const showSnackbar = useSnackbar();
  const notify = (message, type = "success") =>
    showSnackbar?.({ message, type });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/users/api");
      setUsers(res.data || []);
    } catch (err) {
      notify(err.response?.data?.message || "Could not load staff.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      password: "",
    });
    setIsModalOpen(true);
  };

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      notify("Please enter a valid email address.", "error");
      return;
    }
    if (!editing && !form.password.trim()) {
      notify("Password is required for a new staff member.", "error");
      return;
    }
    if (form.password && form.password.length < 4) {
      notify("Password must be at least 4 characters.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`/users/api/${editing._id}`, form);
        notify("Staff member updated");
      } else {
        await axios.post("/users/api", form);
        notify("Staff member added");
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      notify(
        err.response?.data?.message || "Could not save staff member.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    try {
      await axios.delete(`/users/api/${confirmId}`);
      notify("Staff member removed");
      load();
    } catch (err) {
      notify(
        err.response?.data?.message || "Could not remove staff member.",
        "error",
      );
    }
  };

  if (loading) return <Loader label="Loading staff…" />;

  return (
    <>
      <div
        className={`${ui.flex} ${ui.justifyBetween} ${ui.itemsCenter}`}
        style={{ marginBottom: 16 }}
      >
        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary} ${ui.btnSm}`}
          onClick={openAdd}
        >
          + Add Staff
        </button>
      </div>

      <div className={ui.card} style={{ padding: 0, overflowX: "auto" }}>
        <table className={ui.dataTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td className={ui.mono}>{u.email}</td>
                <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                <td style={{ textTransform: "capitalize" }}>{u.status}</td>
                <td className={`${ui.flex} ${ui.gap8}`}>
                  <button
                    type="button"

                    onClick={() => openEdit(u)}
                    aria-label="Edit category"
                    className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                  >
                    ✏️
                  </button>

                  <button
                    type="button"

                    className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
                    style={{ color: "var(--red)" }}
                    onClick={() => setConfirmId(u._id)}
                    aria-label="Delete category"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: 30,
                    color: "var(--muted)",
                  }}
                >
                  No staff members yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? "Edit Staff" : "Add Staff"}
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
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="e.g. Bilal Ahmed"
            autoFocus
          />
        </div>
        <div className={ui.field}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="e.g. bilal@restaurant.com"
          />
        </div>
        <div className={ui.field}>
          <label>Role</label>
          <select name="role" value={form.role} onChange={onChange}>
            {ROLES.map((r) => (
              <option key={r} value={r} style={{ textTransform: "capitalize" }}>
                {r}
              </option>
            ))}
          </select>
        </div>
        {editing ? (
          <div className={ui.field}>
            <label>Status</label>
            <select name="status" value={form.status} onChange={onChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        ) : null}
        <div className={ui.field}>
          <label>
            {editing
              ? "New Password (leave blank to keep current)"
              : "Password"}
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="••••••"
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
        title="Remove Staff Member"
        message="This will permanently remove this staff member's access. Continue?"
      />
    </>
  );
}
