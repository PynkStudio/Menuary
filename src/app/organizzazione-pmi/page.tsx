import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioOrganizzazionePmiPage } from "@/components/tenants/pynkstudio/pages/organizzazione-pmi";
import { PynkGAScript } from "@/components/tenants/pynkstudio/pynk-ga";

export const metadata: Metadata = {
  title: { absolute: "Organizzazione interna PMI e uffici — Check-up in 7 giorni | PYNK STUDIO" },
  description:
    "Troppe email, scadenze perse, ruoli confusi? Mettiamo ordine nei processi del tuo ufficio in 7 giorni: criticità prioritarie e piano operativo a 30/60/90 giorni. Prima call gratuita.",
  // Landing per campagne Google Ads: noindex per non competere con /consulenza in organico.
  robots: { index: false, follow: false },
};

export default async function OrganizzazionePmiRoute() {
  await requirePynkstudioTenant();
  return (
    <>
      <PynkGAScript />
      <PynkStudioOrganizzazionePmiPage />
    </>
  );
}
