"use client";
import { useState } from "react";
import Topbar from "@/components/Topbar";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import styles from "@/css/Shell.module.css";
import { usePathname } from "next/navigation";

export default function AppShell({
  children,
  user,
  restaurantName,
  restaurantPhone,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user: liveUser } = useAuth();

  const effectiveUser = liveUser || user;

  return (
    <div className={styles.shell}>
      <Sidebar
        isOpen={isOpen}
        onNavigate={() => setIsOpen(false)}
        user={effectiveUser}
        restaurantName={restaurantName}
        restaurantPhone={restaurantPhone}
      />
      <div className={styles.main}>
        <Topbar
          pathname={pathname}
          onMenuClick={() => setIsOpen((v) => !v)}
          restaurantName={restaurantName}
        />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
