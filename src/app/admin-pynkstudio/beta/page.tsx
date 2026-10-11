import type { Metadata } from "next";
import { PynkBetaManager } from "@/components/admin-pynkstudio/pynk-beta-manager";

export const metadata: Metadata = {
  title: "Beta program · PynkStudio Admin",
};

export default function PynkAdminBetaPage() {
  return <PynkBetaManager />;
}
