import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioPrenotaCallPage } from "@/components/tenants/pynkstudio/pages/prenota-call";

export const metadata: Metadata = {
  title: { absolute: "Prenota una call di 20 minuti — PYNK STUDIO" },
  description:
    "Scegli giorno e orario per una call gratuita di 20 minuti con PYNK STUDIO. Lun-ven, 10:00-18:00.",
};

export default async function PrenotaCallRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioPrenotaCallPage />;
}
