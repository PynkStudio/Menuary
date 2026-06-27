import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioServiziPage } from "@/components/tenants/pynkstudio/pages/servizi";

export const metadata: Metadata = {
  title: { absolute: "Servizi di sviluppo software e AI — PYNK STUDIO" },
  description:
    "Sviluppo software, web app, app mobile, desktop, chatbot, agenti AI, RAG, automazioni, API, integrazioni e AI Governance.",
};

export default async function ServiziRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioServiziPage />;
}
