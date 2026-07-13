"use client";
import axios from "axios";
import { useState, useEffect } from "react";
import { getCookie, setCookie, deleteCookie } from "cookies-next";

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    const storedUser = getCookie("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const loadFromCookie = () => {
      const storedUser = getCookie("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser((prev) =>
            JSON.stringify(prev) !== storedUser ? parsedUser : prev,
          );
        } catch (error) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    const syncWithServer = async () => {
      if (!getCookie("user")) return;
      try {
        const res = await axios.get("/me/api");
        const fresh = res.data;
        if (fresh?._id) {
          const freshString = JSON.stringify(fresh);
          if (getCookie("user") !== freshString) {
            setCookie("user", freshString, {
              maxAge: 24 * 60 * 60,
              path: "/",
              sameSite: "lax",
            });
            setUser(fresh);
          }
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.data?.logout) {
          deleteCookie("user");
          try {
            await fetch("/login/api/logout", { method: "POST" });
          } catch {}
          setUser(null);
          if (typeof window !== "undefined") window.location.href = "/login";
        }
      }
    };

    loadFromCookie();
    syncWithServer();

    const cookieInterval = setInterval(loadFromCookie, 2000);
    const serverInterval = setInterval(syncWithServer, 5000);
    return () => {
      clearInterval(cookieInterval);
      clearInterval(serverInterval);
    };
  }, []);

  const role = user?.role || "waiter";

  return {
    user,
    role,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isCashier: role === "cashier",
    isWaiter: role === "waiter",
    canManage: role === "admin" || role === "manager",
  };
};
