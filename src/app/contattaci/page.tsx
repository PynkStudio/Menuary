import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioContattaciPage } from "@/components/tenants/pynkstudio/pages/contattaci";

export const metadata: Metadata = {
  title: { absolute: "Contattaci — PYNK STUDIO" },
  description:
    "Richiedi una call di 20 minuti: nuovo prodotto digitale, integrazione o check-up operativo. Nessun impegno.",
};

export default async function ContattaciRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioContattaciPage />;
}
