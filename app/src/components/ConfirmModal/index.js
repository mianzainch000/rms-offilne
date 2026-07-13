"use client";
import ui from "@/css/ui.module.css";
import Modal from "@/components/Modal";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "Do you really want to perform this action?",
  danger = true,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnOutline}`}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${ui.btn} ${danger ? ui.btnDanger : ui.btnPrimary}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {danger ? "Delete" : "Confirm"}
          </button>
        </>
      }
    >
      <p className={ui.muted} style={{ margin: 0 }}>
        {message}
      </p>
    </Modal>
  );
}
