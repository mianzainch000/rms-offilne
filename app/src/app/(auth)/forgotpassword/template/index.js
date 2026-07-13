"use client";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import ui from "@/css/ui.module.css";
import AuthCard from "@/components/AuthCard";
import styles from "@/css/AuthCard.module.css";
import { useSnackbar } from "@/components/Snackbar";
import { useRestaurantBranding } from "@/hooks/useRestaurantBranding";

export default function ForgotPasswordTemplate() {
  const showSnackbar = useSnackbar();
  const restaurantName = useRestaurantBranding();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/forgotpassword/api", { email });

      showSnackbar?.({
        message: res.data.message || "Reset link sent to your email.",
        type: "success",
      });
      setSent(true);
    } catch (err) {
      showSnackbar?.({
        message: err.response?.data?.message || "Could not process request.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      restaurantName={restaurantName}
      tagline="Enter your account email to reset your password."
    >
      {sent ? (
        <div className={ui.hintBox}>
          If an account exists for <b>{email}</b>, a password reset link has
          been sent to that email. The link expires in 15 minutes. Please check
          your inbox (and spam folder).
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit} style={{ touchAction: "none" }}>
            <div className={ui.field}>
              <label>Email</label>
              <input
                type="email"
                placeholder="you@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`${ui.btn} ${ui.btnPrimary} ${ui.btnBlock}`}
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>

          <div className={ui.hintBox}>
            An internet connection is required — the reset link is emailed to
            your account's address.
          </div>
        </>
      )}

      <p className={styles.footNote}>
        Remembered your password? <Link href="/login">Back to sign in</Link>
      </p>
    </AuthCard>
  );
}
