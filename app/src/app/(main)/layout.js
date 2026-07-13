import { cookies } from "next/headers";
import AppShell from "@/components/AppShell";
import axiosClient from "@/config/axiosClient";

export default async function MainLayout({ children }) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user")?.value;

  let user = null;
  try {
    user = userCookie ? JSON.parse(userCookie) : null;
  } catch (e) {
    user = null;
  }

  let settings = null;
  try {
    const res = await axiosClient.get("getSettings");
    settings = res.data;
  } catch (e) {
    settings = null;
  }

  return (
    <AppShell
      user={user}
      restaurantName={settings?.restaurantName}
      restaurantPhone={settings?.phone}
    >
      {children}
    </AppShell>
  );
}
