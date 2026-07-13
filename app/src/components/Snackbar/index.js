"use client";
import styles from "@/css/Snackbar.module.css";
import React, { createContext, useContext, useState, useCallback } from "react";

const SnackbarContext = createContext();

export const SnackbarProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showSnackbar = useCallback(
    ({
      message,
      type = "error",
      duration = 1500,
      position = "top-right",
      animation = "slide-right",
    }) => {
      const id = Date.now();
      const newToast = { id, message, type, duration, position, animation };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [],
  );

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      {children}

      {["top-right", "top-left", "bottom-right", "bottom-left"].map((pos) => (
        <div key={pos} className={`${styles.toastContainer} ${styles[pos]}`}>
          {toasts
            .filter((t) => t.position === pos)
            .map((toast) => (
              <div
                key={toast.id}
                className={`${styles.snackbar} ${styles[toast.type]} ${styles[toast.animation]}`}
              >
                <div className={styles.message}>
                  <span>{toast.message}</span>
                </div>
                <button
                  className={styles.close}
                  onClick={() =>
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                  }
                >
                  &times;
                </button>
                <div
                  className={styles.progress}
                  style={{ animationDuration: `${toast.duration}ms` }}
                />
              </div>
            ))}
        </div>
      ))}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => useContext(SnackbarContext);
