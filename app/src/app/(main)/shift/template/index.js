"use client";
import axios from "axios";
import ui from "@/css/ui.module.css";
import Modal from "@/components/Modal";
import Loader from "@/components/Loader";
import { useEffect, useState } from "react";
import { useSnackbar } from "@/components/Snackbar";

export default function ShiftTemplate() {
  const showSnackbar = useSnackbar();
  const notify = (message, type = "success") =>
    showSnackbar?.({ message, type });

  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/shift/api");
      setShift(res.data || null);
    } catch (err) {
      notify(err.response?.data?.message || "Could not load shift.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onOpenShift = async () => {
    const val = Number(openingCash || 0);
    if (val < 0) {
      notify("Opening cash cannot be negative", "error");
      return;
    }
    setBusy(true);
    try {
      await axios.post("/shift/api", { openingCash: val });
      notify("Shift opened");
      setOpenModal(false);
      setOpeningCash("");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Could not open shift.", "error");

      load();
    } finally {
      setBusy(false);
    }
  };

  const onCloseShift = async () => {
    const val = Number(closingCash || 0);
    if (val < 0) {
      notify("Closing cash cannot be negative", "error");
      return;
    }
    setBusy(true);
    try {
      await axios.put(`/shift/api/${shift._id}`, {
        closingCash: val,
      });
      notify("Shift closed");
      setCloseModal(false);
      setClosingCash("");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Could not close shift.", "error");
      if (err.response?.status === 404) {
        setCloseModal(false);
        setClosingCash("");
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading shift…" />;

  if (!shift) {
    return (
      <div className={`${ui.card}`} style={{ padding: 22, maxWidth: 460 }}>
        <div className={ui.sectionTitle}>No Active Shift</div>
        <p className={ui.muted} style={{ fontSize: 13.5 }}>
          Open a shift to start recording sales.
        </p>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary} ${ui.btnBlock}`}
          onClick={() => setOpenModal(true)}
        >
          Open Shift
        </button>

        <Modal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          title="Open Shift"
          footer={
            <>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnOutline}`}
                onClick={() => setOpenModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnPrimary}`}
                disabled={busy}
                onClick={onOpenShift}
              >
                {busy ? "Opening…" : "Open Shift"}
              </button>
            </>
          }
        >
          <div className={ui.field}>
            <label>Opening Cash (Rs)</label>
            <input
              type="number"
              min="0"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              autoFocus
            />
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className={`${ui.card}`} style={{ padding: 22, maxWidth: 460 }}>
      <div className={ui.sectionTitle}>Current Shift</div>

      <div
        className={ui.grid}
        style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 18 }}
      >
        <div>
          <div className={ui.label}>Opened At</div>
          <div className={ui.val} style={{ fontSize: 16 }}>
            {new Date(shift.openedAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <div>
          <div className={ui.label}>Opening Cash</div>
          <div className={ui.val} style={{ fontSize: 16 }}>
            Rs {shift.openingCash?.toLocaleString()}
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`${ui.btn} ${ui.btnDanger} ${ui.btnBlock}`}
        onClick={() => setCloseModal(true)}
      >
        Close Shift
      </button>

      <Modal
        isOpen={closeModal}
        onClose={() => setCloseModal(false)}
        title="Close Shift"
        footer={
          <>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnOutline}`}
              onClick={() => setCloseModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnDanger}`}
              disabled={busy}
              onClick={onCloseShift}
            >
              {busy ? "Closing…" : "Close Shift"}
            </button>
          </>
        }
      >
        <div className={ui.field}>
          <label>Closing Cash (Rs)</label>
          <input
            type="number"
            min="0"
            value={closingCash}
            onChange={(e) => setClosingCash(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="0"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
