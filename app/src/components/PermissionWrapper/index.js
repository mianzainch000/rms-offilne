"use client";
import { useAuth } from "@/hooks/useAuth";

export const MENU_MANAGE_ROLES = ["admin"];

export default function PermissionWrapper({
  allowedRoles = MENU_MANAGE_ROLES,
  children,
  fallback = null,
}) {
  const { role } = useAuth();
  if (!allowedRoles.includes(role)) return fallback;
  return <>{children}</>;
}
