import type { Metadata } from "next";
import { MenuaryOutreachDashboard } from "@/components/admin-pynkstudio/menuary-outreach-dashboard";

export const metadata: Metadata = { title: "Marketing · Menuary" };
export const dynamic = "force-dynamic";

export default function MenuaryMarketingPage() {
  return <MenuaryOutreachDashboard />;
}
