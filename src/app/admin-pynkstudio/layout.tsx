import type { Metadata } from "next";
import { PynkAdminLayoutSwitch } from "@/components/admin-pynkstudio/pynk-admin-layout-switch";

export const metadata: Metadata = {
  title: "PynkStudio · Admin",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PynkAdminLayoutSwitch>{children}</PynkAdminLayoutSwitch>;
}
