import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioUnsubscribePage } from "@/components/tenants/pynkstudio/pages/unsubscribe";

export const metadata: Metadata = {
  title: { absolute: "Disiscrizione email — PYNK STUDIO" },
  description:
    "Gestisci la disiscrizione dalle comunicazioni email di PYNK STUDIO. Conferma la rimozione del tuo indirizzo dalla lista contatti.",
  robots: { index: false, follow: false },
};

export default async function UnsubscribeRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioUnsubscribePage />;
}
