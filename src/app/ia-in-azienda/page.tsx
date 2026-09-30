import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioIaInAziendaPage } from "@/components/tenants/pynkstudio/pages/ia-in-azienda";

export const metadata: Metadata = {
  title: { absolute: "Intelligenza artificiale per aziende — Preventivo gratuito | PYNK STUDIO" },
  description:
    "Assistenti, automazioni e agenti IA su misura, collegati ai tuoi dati e ai tuoi strumenti. Conformi a GDPR e AI Act, con formazione del team. Preventivo gratuito in 24h.",
  // Landing per campagne a pagamento: noindex per non competere con /soluzioni e /ai-governance in organico.
  robots: { index: false, follow: false },
};

export default async function IaInAziendaRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioIaInAziendaPage />;
}
