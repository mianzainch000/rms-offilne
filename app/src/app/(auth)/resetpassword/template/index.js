"use client";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import ui from "@/css/ui.module.css";
import AuthCard from "@/components/AuthCard";
import styles from "@/css/AuthCard.module.css";
import { useSnackbar } from "@/components/Snackbar";
import PasswordInput from "@/components/PasswordInput";
import { useRouter, useSearchParams } from "next/navigation";
import { useRestaurantBranding } from "@/hooks/useRestaurantBranding";

export default function ResetPasswordTemplate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const showSnackbar = useSnackbar();
  const restaurantName = useRestaurantBranding();

  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirm) {
      showSnackbar?.({ message: "Passwords do not match.", type: "error" });
      return;
    }
    if (!token) {
      showSnackbar?.({
        message: "Missing or invalid reset link. Please request a new one.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/resetpassword/api", {
        token,
        newPassword: form.newPassword,
      });
      showSnackbar?.({
        message: res.data.message || "Password reset successful.",
        type: "success",
      });
      setTimeout(() => router.push("/login"), 1000);
    } catch (err) {
      showSnackbar?.({
        message: err.response?.data?.message || "Could not reset password.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      restaurantName={restaurantName}
      tagline="Choose a new password for your account."
    >
      <form onSubmit={onSubmit} style={{ touchAction: "none" }}>
        <PasswordInput
          name="newPassword"
          label="New Password"
          placeholder="Enter new password"
          value={form.newPassword}
          onChange={onChange}
          autoComplete="new-password"
        />
        <PasswordInput
          name="confirm"
          label="Confirm New Password"
          placeholder="Re-enter new password"
          value={form.confirm}
          onChange={onChange}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className={`${ui.btn} ${ui.btnPrimary} ${ui.btnBlock}`}
        >
          {loading ? "Resetting…" : "Reset Password"}
        </button>
      </form>

      <p className={styles.footNote}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </AuthCard>
  );
}
