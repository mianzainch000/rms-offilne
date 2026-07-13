"use client";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import ui from "@/css/ui.module.css";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import styles from "@/css/AuthCard.module.css";
import { useSnackbar } from "@/components/Snackbar";
import ConfirmModal from "@/components/ConfirmModal";
import PasswordInput from "@/components/PasswordInput";
import { useRestaurantBranding } from "@/hooks/useRestaurantBranding";

export default function LoginTemplate({ signupOpen = true }) {
  const router = useRouter();
  const showSnackbar = useSnackbar();
  const restaurantName = useRestaurantBranding();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onRestoreFromCloud = async () => {
    setRestoring(true);
    try {
      const res = await axios.post("/login/api/restore");
      showSnackbar?.({
        message: res.data.message || "Restored successfully. Reloading…",
        type: "success",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showSnackbar?.({
        message: err.response?.data?.message || "Restore failed.",
        type: "error",
      });
    } finally {
      setRestoring(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/login/api", form);
      showSnackbar?.({
        message: res.data.message || "Login successful",
        type: "success",
      });
      router.push("/dashboard");
    } catch (err) {
      showSnackbar?.({
        message:
          err.response?.data?.message || "Login failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      restaurantName={restaurantName}
      tagline="Sign in to manage tables, orders & billing."
    >
      <form onSubmit={onSubmit} style={{ touchAction: "none" }}>
        <div className={ui.field}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="you@restaurant.com"
            value={form.email}
            onChange={onChange}
            required
          />
        </div>

        <PasswordInput
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="Enter password"
        />

        <div
          className={`${ui.flex} ${ui.justifyBetween} ${ui.itemsCenter}`}
          style={{ marginBottom: 16 }}
        >
          <span></span>
          <Link
            href="/forgotpassword"
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--accent-dark)",
            }}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${ui.btn} ${ui.btnPrimary} ${ui.btnBlock}`}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {signupOpen ? (
        <>
          <div className={ui.hintBox}>
            First account created automatically becomes <b>Admin</b>. Create one
            from the signup page if this is a fresh install.
          </div>

          <p className={styles.footNote}>
            New restaurant? <Link href="/signup">Create an account</Link>
          </p>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border)",
              margin: "16px 0",
            }}
          />

          <div className={ui.hintBox} style={{ marginBottom: 10 }}>
            Data delete ho gaya ya naya Windows install kiya hai? Purana data
            Atlas (cloud) se wapis la sakte hain.
          </div>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnOutline} ${ui.btnBlock}`}
            disabled={restoring}
            onClick={() => setRestoreConfirmOpen(true)}
          >
            {restoring ? "Restoring…" : "☁️ Restore From Cloud"}
          </button>
        </>
      ) : null}

      <ConfirmModal
        isOpen={restoreConfirmOpen}
        onClose={() => setRestoreConfirmOpen(false)}
        onConfirm={onRestoreFromCloud}
        title="Restore From Cloud?"
        message="Ye is computer ke data ko Atlas ke aakhri backup se restore kar dega. Sirf tab karein jab local data khaali/delete ho chuka ho."
        danger={false}
      />
    </AuthCard>
  );
}
