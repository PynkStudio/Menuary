"use client";

import { usePathname } from "next/navigation";
import { PynkAdminShell } from "./pynk-admin-shell";

const AUTH_PATHS = ["/admin-pynkstudio/login", "/admin-pynkstudio/set-password"];

export function PynkAdminLayoutSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));
  if (isAuthPage) return <>{children}</>;
  return <PynkAdminShell>{children}</PynkAdminShell>;
}
