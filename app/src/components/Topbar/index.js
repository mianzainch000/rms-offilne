"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import styles from "@/css/Topbar.module.css";

const TITLES = {
  "/dashboard": ["Dashboard", "Overview of today's restaurant activity"],
  "/tables": ["Tables", "Live floor status & order entry"],
  "/kitchen": ["Kitchen", "Live kitchen order tickets"],
  "/history": ["Order History", "Past paid & cancelled orders"],
  "/menu": ["Menu Management", "Add, edit and organize your menu"],
  "/shift": ["Shift", "Start, monitor and close cashier shifts"],
  "/reports": ["Reports", "Sales performance and breakdowns"],
  "/users": ["Staff & Users", "Manage staff logins and permissions"],
  "/settings": ["Settings", "Restaurant details, tax & service charge"],
  "/order": ["Order", "Build the order & take payment"],
};

export default function Topbar({ pathname, onMenuClick, restaurantName }) {
  const match = Object.keys(TITLES).find((k) => pathname?.startsWith(k));
  const [title, sub] = match ? TITLES[match] : ["Dashboard", ""];
  const finalSub =
    match === "/dashboard" && restaurantName
      ? `Overview of today's activity at ${restaurantName}`
      : sub;

  const [shift, setShift] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadShift = async () => {
      try {
        const res = await axios.get("/shift/api");
        if (mounted) setShift(res.data || null);
      } catch (err) {
        if (mounted) setShift(null);
      } finally {
        if (mounted) setLoaded(true);
      }
    };
    loadShift();
    const interval = setInterval(loadShift, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const shiftOpen = !!shift;
  const openedAtDate = shift?.openedAt ? new Date(shift.openedAt) : null;
  const hasValidOpenedAt = openedAtDate && !isNaN(openedAtDate.getTime());
  const shiftLabel = !loaded
    ? "Checking shift…"
    : shiftOpen
      ? hasValidOpenedAt
        ? `Shift Open · ${openedAtDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
        : "Shift Open"
      : "Shift Closed";

  return (
    <div className={styles.topbar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuToggle}
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <div className={styles.titleWrap}>
          <h1>{title}</h1>
          <div className={styles.sub}>{finalSub}</div>
        </div>
      </div>
      <div
        className={`${styles.shiftPill} ${shiftOpen ? styles.shiftPillOn : styles.shiftPillOff}`}
      >
        <span className={styles.dot}></span>
        <span>{shiftLabel}</span>
      </div>
    </div>
  );
}
