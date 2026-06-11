import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioLavoriPage } from "@/components/tenants/pynkstudio/pages/lavori";
import { getActiveTenantSites } from "@/components/tenants/pynkstudio/showcase";

export const metadata: Metadata = {
  title: { absolute: "Lavori — PYNK STUDIO" },
  description:
    "Prodotti e siti che abbiamo realizzato: piattaforme multi-tenant, software per studi professionali, strumenti operativi, esperienze web, mobile e gioco.",
};

export default async function LavoriRoute() {
  await requirePynkstudioTenant();
  const sites = await getActiveTenantSites();
  return <PynkStudioLavoriPage sites={sites} />;
}
