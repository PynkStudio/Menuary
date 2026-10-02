import type { Metadata } from "next";
import { PynkAgendaSettings } from "@/components/admin-pynkstudio/pynk-agenda-settings";
import { PYNK_AGENDA_SETTINGS_PATH } from "@/lib/agenda-runtime";

export const metadata: Metadata = {
  title: "Impostazioni agenda · PynkStudio Admin",
};

export const dynamic = "force-dynamic";

export default function PynkAdminAgendaSettingsPage() {
  return <PynkAgendaSettings returnTo={PYNK_AGENDA_SETTINGS_PATH} />;
}
