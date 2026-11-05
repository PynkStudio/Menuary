import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioBetaPage } from "@/components/tenants/pynkstudio/pages/beta";
import { betaMetadata } from "@/components/tenants/pynkstudio/pages/beta-metadata";

export const metadata = betaMetadata("it");

// Il passaggio automatico alla variante inglese è nel middleware: da qui Next può
// solo rispondere 200 con un meta refresh, perché il layout ha già iniziato lo streaming.
export default async function BetaRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioBetaPage />;
}
