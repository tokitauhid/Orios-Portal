import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import styles from "./styles.module.css";

// Context shared by the toast hook/provider pair.
const ToastContext = createContext(null);

/**
 * useToast — Hook to show toast notifications.
 * @returns {{ showToast: (message: string, type?: 'error'|'success'|'warning'|'info', duration?: number) => void }}
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // If the provider is missing, fail quietly with a console warning.
    return {
      showToast: (message) => {
        // This is mainly a guard for incorrect usage in development.
        console.warn("[Toast]", message);
      },
    };
  }
  return ctx;
}

const ICONS = {
  error: "❌",
  success: "✅",
  warning: "⚠️",
  info: "ℹ️",
};

/**
 * ToastProvider — Wrap your app with this to enable toast notifications.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300); // Keep removal in sync with the slide-out animation.
  }, []);

  const showToast = useCallback(
    (message, type = "info", duration = 5000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [
        ...prev,
        { id, message, type, duration, exiting: false },
      ]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type]} ${toast.exiting ? styles.toastExiting : ""}`}
            onClick={() => removeToast(toast.id)}
            style={{ "--toast-duration": `${toast.duration}ms` }}
          >
            <span className={styles.toastIcon}>{ICONS[toast.type]}</span>
            <span className={styles.toastMessage}>{toast.message}</span>
            <button
              className={styles.toastClose}
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
