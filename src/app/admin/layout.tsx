import type { Metadata } from "next";
import { AdminLayoutSwitch } from "@/components/admin/admin-layout-switch";

export const metadata: Metadata = {
  title: "Gestione",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutSwitch>{children}</AdminLayoutSwitch>;
}
