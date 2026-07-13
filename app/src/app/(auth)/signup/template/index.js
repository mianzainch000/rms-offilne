"use client";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import ui from "@/css/ui.module.css";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import styles from "@/css/AuthCard.module.css";
import { useSnackbar } from "@/components/Snackbar";
import PasswordInput from "@/components/PasswordInput";
import { useRestaurantBranding } from "@/hooks/useRestaurantBranding";

const initialForm = { name: "", email: "", password: "", confirm: "" };

export default function SignupTemplate() {
  const router = useRouter();
  const showSnackbar = useSnackbar();
  const restaurantName = useRestaurantBranding();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      showSnackbar?.({ message: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/signup/api", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      showSnackbar?.({
        message: res.data.message || "Account created. You can sign in now.",
        type: "success",
      });
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      showSnackbar?.({
        message: err.response?.data?.message || "Could not create account.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      restaurantName={restaurantName}
      tagline="Create your restaurant's account."
    >
      <form onSubmit={onSubmit} style={{ touchAction: "none" }}>
        <div className={ui.field}>
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="e.g. Ali Raza"
            value={form.name}
            onChange={onChange}
            required
          />
        </div>
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
          label="Password"
          placeholder="Create a password"
          value={form.password}
          onChange={onChange}
          autoComplete="new-password"
        />
        <PasswordInput
          name="confirm"
          label="Confirm Password"
          placeholder="Re-enter password"
          value={form.confirm}
          onChange={onChange}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className={`${ui.btn} ${ui.btnPrimary} ${ui.btnBlock}`}
        >
          {loading ? "Creating…" : "Create Account"}
        </button>
      </form>

      <p className={styles.footNote}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </AuthCard>
  );
}
