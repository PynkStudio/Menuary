import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioSettoriPage } from "@/components/tenants/pynkstudio/pages/settori";

export const metadata: Metadata = {
  title: { absolute: "Settori — PYNK STUDIO" },
  description:
    "E-commerce, studi professionali, PMI e industria, cultura e turismo, PA: soluzioni web e integrazioni su misura.",
};

export default async function SettoriRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioSettoriPage />;
}
