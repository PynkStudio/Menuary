import type { Metadata } from "next";
import { PynkAgenda } from "@/components/admin-pynkstudio/pynk-agenda";

export const metadata: Metadata = {
  title: "Agenda · PynkStudio Admin",
};

export const dynamic = "force-dynamic";

export default function PynkAdminAgendaPage() {
  return <PynkAgenda />;
}
