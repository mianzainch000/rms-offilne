import Link from "next/link";
import ui from "@/css/ui.module.css";
import SignupTemplate from "./template";
import AuthCard from "@/components/AuthCard";
import axiosClient from "@/config/axiosClient";

export const metadata = {
  title: "Create Account",
};

export default async function SignupPage() {
  let signupOpen = true;
  let restaurantName = "";
  try {
    const [statusRes, settingsRes] = await Promise.all([
      axiosClient.get("signupStatus"),
      axiosClient.get("publicSettings"),
    ]);
    signupOpen = statusRes.data?.open !== false;
    restaurantName = settingsRes.data?.restaurantName || "";
  } catch (e) {
    signupOpen = true;
  }

  if (!signupOpen) {
    return (
      <AuthCard
        restaurantName={restaurantName}
        tagline="Sign in to manage tables, orders & billing."
      >
        <p
          style={{
            fontSize: 14,
            color: "#475569",
            lineHeight: 1.6,
            marginBottom: 18,
          }}
        >
          This restaurant is already set up. New staff logins are created by
          your admin from <b>Staff &amp; Users</b> — public signup is closed for
          security.
        </p>
        <Link
          href="/login"
          className={`${ui.btn} ${ui.btnPrimary} ${ui.btnBlock}`}
        >
          Go to Sign In
        </Link>
      </AuthCard>
    );
  }

  return <SignupTemplate />;
}
