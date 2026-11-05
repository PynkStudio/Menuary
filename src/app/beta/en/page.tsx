import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioBetaPage } from "@/components/tenants/pynkstudio/pages/beta";
import { betaMetadata } from "@/components/tenants/pynkstudio/pages/beta-metadata";

export const metadata = betaMetadata("en");

export default async function BetaEnRoute() {
  await requirePynkstudioTenant();
  return <PynkStudioBetaPage lang="en" />;
}
