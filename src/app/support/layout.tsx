import type { Metadata } from "next";
import { SupportShell } from "@/components/support/support-shell";

export const metadata: Metadata = {
  title: "Registro errori · Menuary Support",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SupportShell>{children}</SupportShell>;
}
