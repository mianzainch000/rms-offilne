"use client";
import axios from "axios";
import ui from "@/css/ui.module.css";
import Loader from "@/components/Loader";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/css/Settings.module.css";
import { useSnackbar } from "@/components/Snackbar";
import ConfirmModal from "@/components/ConfirmModal";

const emptyForm = {
  restaurantName: "",
  tagline: "",
  address: "",
  phone: "",
  billPrefix: "",
  footerNote: "",
  taxPercent: 0,
  serviceChargePercent: 0,
  defaultDeliveryCharge: 0,
  printerPaperSize: "80mm",
};

export default function SettingsTemplate() {
  const showSnackbar = useSnackbar();
  const router = useRouter();
  const notify = (message, type = "success") =>
    showSnackbar?.({ message, type });

  const { isAdmin } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [backupStatus, setBackupStatus] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loadBackupStatus = async () => {
    try {
      const res = await axios.get("/settings/api/backup-status");
      setBackupStatus(res.data);
    } catch {}
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadBackupStatus();
    const interval = setInterval(loadBackupStatus, 15000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const onRestoreFromCloud = async () => {
    setRestoring(true);
    try {
      const res = await axios.post("/settings/api/restore");
      notify(res.data.message || "Restored successfully from Atlas.");
      loadBackupStatus();
    } catch (err) {
      notify(err.response?.data?.message || "Restore failed.", "error");
    } finally {
      setRestoring(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/settings/api");
        setForm({
          restaurantName: res.data.restaurantName || "",
          tagline: res.data.tagline || "",
          address: res.data.address || "",
          phone: res.data.phone || "",
          billPrefix: res.data.billPrefix || "",
          footerNote: res.data.footerNote || "",
          taxPercent: res.data.taxPercent ?? 0,
          serviceChargePercent: res.data.serviceChargePercent ?? 0,
          defaultDeliveryCharge: res.data.defaultDeliveryCharge ?? 0,
          printerPaperSize: res.data.printerPaperSize || "80mm",
        });
      } catch (err) {
        notify(
          err.response?.data?.message || "Could not load settings.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put("/settings/api", {
        ...form,
        taxPercent: Number(form.taxPercent) || 0,
        serviceChargePercent: Number(form.serviceChargePercent) || 0,
        defaultDeliveryCharge: Number(form.defaultDeliveryCharge) || 0,
      });
      notify("Settings saved");
      router.refresh();
    } catch (err) {
      notify(
        err.response?.data?.message || "Could not save settings.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading settings…" />;

  return (
    <>
      <div className={styles.settingsGrid}>
        <div className={`${ui.card} ${styles.panel}`}>
          <div className={ui.sectionTitle}>Restaurant Info</div>

          <div className={ui.field}>
            <label>Restaurant Name</label>
            <input
              type="text"
              name="restaurantName"
              value={form.restaurantName}
              onChange={onChange}
              placeholder="e.g. KFC"
            />
          </div>
          <div className={ui.field}>
            <label>Tagline</label>
            <input
              type="text"
              name="tagline"
              value={form.tagline}
              onChange={onChange}
              placeholder="e.g. Dine In Style"
            />
          </div>
          <div className={ui.field}>
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={onChange}
              placeholder="e.g. Main Boulevard, Lahore"
            />
          </div>
          <div className={ui.field}>
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="e.g. 03001234567"
            />
          </div>
          <div className={ui.field}>
            <label>Bill Number Prefix</label>
            <input
              type="text"
              name="billPrefix"
              value={form.billPrefix}
              onChange={onChange}
              placeholder="e.g. KFC-"
            />
          </div>
          <div className={ui.field} style={{ marginBottom: 0 }}>
            <label>Footer Note (Receipts)</label>
            <textarea
              name="footerNote"
              value={form.footerNote}
              onChange={onChange}
              rows={3}
              placeholder="e.g. Thank you for dining with us!"
            />
          </div>
        </div>

        <div className={`${ui.card} ${styles.panel}`}>
          <div className={ui.sectionTitle}>Pricing &amp; Taxes</div>

          <div className={ui.field}>
            <label>Tax / GST (%)</label>
            <input
              type="number"
              name="taxPercent"
              value={form.taxPercent}
              onChange={onChange}
              onFocus={(e) => e.target.select()}
              min="0"
            />
          </div>
          <p className={styles.hint}>
            Applied automatically as % of the subtotal on every new order.
          </p>

          <div className={ui.field}>
            <label>Service Charge (%)</label>
            <input
              type="number"
              name="serviceChargePercent"
              value={form.serviceChargePercent}
              onChange={onChange}
              onFocus={(e) => e.target.select()}
              min="0"
            />
          </div>
          <p className={styles.hint}>
            Applied when a bill is generated — staff can still override it per
            order.
          </p>

          <div className={ui.field}>
            <label>Default Delivery Charge (Rs.)</label>
            <input
              type="number"
              name="defaultDeliveryCharge"
              value={form.defaultDeliveryCharge}
              onChange={onChange}
              onFocus={(e) => e.target.select()}
              min="0"
            />
          </div>
          <p className={styles.hint}>
            Added automatically to Delivery orders and shown as a separate line
            on the bill.
          </p>

          <div className={ui.field} style={{ marginBottom: 0 }}>
            <label>Thermal Printer Paper Size</label>
            <select
              name="printerPaperSize"
              value={form.printerPaperSize}
              onChange={onChange}
            >
              <option value="58mm">58mm</option>
              <option value="80mm">80mm</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`${ui.btn} ${ui.btnPrimary}`}
        style={{ marginTop: 20 }}
        disabled={saving}
        onClick={saveSettings}
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>

      {isAdmin ? (
        <div className={`${ui.card} ${styles.panel}`} style={{ marginTop: 20 }}>
          <div className={ui.sectionTitle}>☁️ Cloud Backup (Atlas)</div>

          <p className={styles.hint} style={{ marginTop: 0 }}>
            {backupStatus?.lastSuccessfulBackupAt
              ? `Last successful backup: ${new Date(
                  backupStatus.lastSuccessfulBackupAt,
                ).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} (PKT)`
              : backupStatus?.lastSyncStatusDetail || "Loading backup status…"}
          </p>
          <p className={ui.muted} style={{ marginBottom: 16 }}>
            Yeh sync har 5 minute mein automatically background mein chalti hai
            (agar internet available ho). Neeche wala button emergency ke liye
            hai — agar local data delete/corrupt ho jaye, to Atlas ke aakhri
            backup se local database wapis restore kar dega.
          </p>

          <button
            type="button"
            className={`${ui.btn} ${ui.btnDanger}`}
            disabled={restoring}
            onClick={() => setRestoreConfirmOpen(true)}
          >
            {restoring ? "Restoring…" : "Restore From Cloud"}
          </button>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={onRestoreFromCloud}
        title="Restore From Cloud?"
        message="Ye local database ko Atlas ke aakhri backup se overwrite kar dega. Local mein jo bhi data abhi tak Atlas mein sync nahi hua, wo mit jayega. Ye action wapis nahi ho sakta. Continue karein?"
        danger={false}
      />
    </>
  );
}
