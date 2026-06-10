import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioConsulenzaPage } from "@/components/tenants/pynkstudio/pages/consulenza";

export const metadata: Metadata = {
  title: { absolute: "Consulenza operativa PMI — PYNK STUDIO" },
  description:
    "Check-up in 7 giorni, metodo a 5 fasi, piano 30/60/90. Complementare allo sviluppo: prima ordine nei processi, poi il software.",
};

export default async function ConsulenzaRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioConsulenzaPage />;
}
