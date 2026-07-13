"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCookie } from "cookies-next";
import { usePathname } from "next/navigation";
import styles from "@/css/Sidebar.module.css";
import { useSnackbar } from "@/components/Snackbar";
import ConfirmModal from "@/components/ConfirmModal";

const NAV_ITEMS = [
  {
    group: "Operations",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: "📊",
        roles: ["admin", "manager", "cashier", "waiter"],
      },
      {
        href: "/tables",
        label: "Tables",
        icon: "🍽️",
        roles: ["admin", "manager", "cashier", "waiter"],
      },
      {
        href: "/kitchen",
        label: "Kitchen",
        icon: "🍳",
        roles: ["admin", "manager", "cashier", "waiter"],
      },
      {
        href: "/history",
        label: "Order History",
        icon: "🧾",
        roles: ["admin", "manager", "cashier"],
      },
    ],
  },
  {
    group: "Manage",
    items: [
      {
        href: "/menu",
        label: "Menu Management",
        icon: "📋",
        roles: ["admin", "manager"],
      },
      {
        href: "/shift",
        label: "Shift",
        icon: "⏱️",
        roles: ["admin", "manager", "cashier"],
      },
      {
        href: "/reports",
        label: "Reports",
        icon: "📈",
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    group: "Admin",
    items: [
      { href: "/users", label: "Staff & Users", icon: "👥", roles: ["admin"] },
      {
        href: "/expenses",
        label: "Expenses",
        icon: "🧾",
        roles: ["admin"],
      },
      { href: "/settings", label: "Settings", icon: "⚙️", roles: ["admin"] },
    ],
  },
];

export default function Sidebar({
  isOpen,
  onNavigate,
  user,
  restaurantName,
  restaurantPhone,
}) {
  const pathname = usePathname();
  const role = user?.role || "waiter";
  const initials = (user?.name || "U").trim().charAt(0).toUpperCase();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const router = useRouter();
  const showSnackbar = useSnackbar();

  const logout = async () => {
    try {
      await fetch("/login/api/logout", { method: "POST" });
    } catch {}
    deleteCookie("user");
    showSnackbar?.({ message: "Logged out successfully", type: "success" });
    router.push("/login");
  };

  return (
    <>
      {isOpen ? <div className={styles.backdrop} onClick={onNavigate} /> : null}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarBrand}>
          <div className={styles.logoMark}>
            {(restaurantName || "M").trim().charAt(0).toUpperCase()}
          </div>
          <div>
            <span>{restaurantName || "My Restaurant"}</span>
            {restaurantPhone ? (
              <div className={styles.brandPhone}>{restaurantPhone}</div>
            ) : null}
          </div>
        </div>

        <div className={styles.navGroup}>
          {NAV_ITEMS.map((group) => {
            const visibleItems = group.items.filter((item) =>
              item.roles.includes(role),
            );
            if (!visibleItems.length) return null;
            return (
              <div key={group.group}>
                {}
                {visibleItems.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                    >
                      <span className={styles.ic}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className={styles.sidebarFoot}>
          <div className={styles.userChip}>
            <div className={styles.userAvatar}>{initials}</div>
            <div>
              <div className={styles.uname}>{user?.name || "User"}</div>
              <div className={styles.urole}>{role}</div>
            </div>
          </div>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={() => setLogoutConfirmOpen(true)}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={logout}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        danger={false}
      />
    </>
  );
}
