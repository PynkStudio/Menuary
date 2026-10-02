import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioConsulenzaPage } from "@/components/tenants/pynkstudio/pages/consulenza";

export const metadata: Metadata = {
  title: { absolute: "Partner IT per aziende: software, sistemi e automazioni — PYNK STUDIO" },
  description:
    "Progettiamo e realizziamo software, integrazioni, automazioni e infrastrutture per aziende. Un partner tecnico dalla prima analisi alla messa in produzione.",
};

export default async function ConsulenzaRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioConsulenzaPage />;
}
