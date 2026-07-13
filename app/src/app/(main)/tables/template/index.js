"use client";
import axios from "axios";
import Link from "next/link";
import ui from "@/css/ui.module.css";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import tileStyles from "@/css/TableTile.module.css";
import { useSnackbar } from "@/components/Snackbar";
import ConfirmModal from "@/components/ConfirmModal";

const STATUS_LABEL = {
  free: "Tap to start order",
  occupied: "Order in progress",
  ready: "Ready to serve!",
  bill_pending: "Awaiting payment",
};

export default function TablesTemplate() {
  const { canManage } = useAuth();
  const showSnackbar = useSnackbar();
  const notify = (message, type = "success") =>
    showSnackbar?.({ message, type });

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmId, setConfirmId] = useState(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get("/tables/api");
      setTables(res.data || []);
    } catch (err) {
      notify(err.response?.data?.message || "Could not load tables.", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setIsModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setName(t.name);
    setIsModalOpen(true);
  };

  const onSave = async () => {
    if (!name.trim()) return;
    const isDuplicate = tables.some(
      (t) =>
        t.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        t._id !== editing?._id,
    );
    if (isDuplicate) {
      notify(`A table named "${name.trim()}" already exists.`, "error");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`/tables/api/${editing._id}`, {
          name,
          status: editing.status,
        });
        notify("Table updated");
      } else {
        await axios.post("/tables/api", { name });
        notify("Table added");
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Could not save table.", "error");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    try {
      await axios.delete(`/tables/api/${confirmId}`);
      notify("Table deleted");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Could not delete table.", "error");
    }
  };

  if (loading) return <Loader label="Loading tables…" />;

  return (
    <>
      {}
      <div
        className={`${ui.flex} ${ui.justifyBetween} ${ui.itemsCenter}`}
        style={{ marginBottom: 24, flexWrap: "wrap", gap: 12 }}
      >
        <div className={`${ui.flex} ${ui.gap8}`} style={{ flexWrap: "wrap" }}>
          <Link
            href="/order?type=takeaway"
            className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
            style={{ borderRadius: "8px", padding: "8px 16px" }}
          >
            + Takeaway Order
          </Link>
          <Link
            href="/order?type=delivery"
            className={`${ui.btn} ${ui.btnOutline} ${ui.btnSm}`}
            style={{ borderRadius: "8px", padding: "8px 16px" }}
          >
            + Delivery Order
          </Link>
        </div>
        {canManage ? (
          <button
            type="button"
            className={`${ui.btn} ${ui.btnGhost} ${ui.btnSm}`}
            style={{ borderRadius: "8px", fontWeight: "500" }}
            onClick={openAdd}
          >
            + Add Table
          </button>
        ) : null}
      </div>

      {}
      {!tables.length ? (
        <div
          className={ui.emptyState}
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "40px",
            border: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <div
            className={ui.ic}
            style={{ fontSize: "32px", marginBottom: "12px" }}
          >
            🍽️
          </div>
          <div style={{ color: "#4b5563", fontWeight: 500 }}>
            No tables yet.{" "}
            {canManage ? "Add your first table to get started." : ""}
          </div>
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
              <div key={t._id} className={`${tileStyles.tile} ${statusClass}`}>
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

                {}
                {canManage ? (
                  <div className={tileStyles.actionBar}>
                    <button
                      type="button"
                      className={tileStyles.actionBtn}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEdit(t);
                      }}
                      aria-label="Edit table"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className={`${tileStyles.actionBtn} ${tileStyles.deleteBtn}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmId(t._id);
                      }}
                      aria-label="Delete table"
                    >
                      🗑️
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? "Edit Table" : "Add Table"}
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
          <label
            style={{
              fontWeight: 600,
              color: "#374151",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Table Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. T13"
            autoFocus
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
            }}
          />
        </div>
      </Modal>

      {}
      <ConfirmModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
        title="Delete Table"
        message="This will permanently remove the table. Continue?"
      />
    </>
  );
}
