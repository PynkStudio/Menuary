import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioVisitCardPage } from "@/components/tenants/pynkstudio/pages/visit-card";

export const metadata: Metadata = {
  title: { absolute: "Massimo Pernozzoli · CEO Pynk Studio — Contatto diretto" },
  description:
    "Biglietto da visita digitale di Massimo Pernozzoli, CEO di Pynk Studio. Salva il contatto in rubrica o scarica la vCard.",
  robots: { index: false, follow: false },
};

export default async function VisitCardRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioVisitCardPage />;
}
