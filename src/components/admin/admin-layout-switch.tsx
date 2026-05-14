"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

const AUTH_PATHS = ["/admin/login", "/admin/set-password"];

export function AdminLayoutSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));
  if (isAuthPage) return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}
