import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioServiziPage } from "@/components/tenants/pynkstudio/pages/servizi";

export const metadata: Metadata = {
  title: { absolute: "Servizi di sviluppo — PYNK STUDIO" },
  description:
    "Siti e landing, web app, app iOS/Android, desktop macOS/Windows, automazioni e AI. Stack dichiarato in modalità tecnica.",
};

export default async function ServiziRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioServiziPage />;
}
