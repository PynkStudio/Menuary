import type { Metadata } from "next";
import { AdminLayoutSwitch } from "@/components/admin/admin-layout-switch";
import { PortalSwitcher } from "@/components/portal-switcher/portal-switcher";

export const metadata: Metadata = {
  title: "Gestione",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminLayoutSwitch>{children}</AdminLayoutSwitch>
      <PortalSwitcher current="admin" cookieDomain=".menuary.it" />
    </>
  );
}
