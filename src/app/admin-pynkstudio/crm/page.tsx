import type { Metadata } from "next";
import { PynkCrm } from "@/components/admin-pynkstudio/pynk-crm";

export const metadata: Metadata = {
  title: "CRM · PynkStudio Admin",
};

export const dynamic = "force-dynamic";

export default function PynkAdminCrmPage() {
  return <PynkCrm />;
}
