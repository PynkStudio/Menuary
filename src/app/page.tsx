import { headers } from "next/headers";
import { getPlatformModeFromHost } from "@/lib/platform";
import { MarketingHomePage } from "@/components/marketing/pages/home";
import { TenantHomePage } from "@/components/tenants/_shared/pages/home";
import { ClientsHomePage } from "@/components/clients/clients-home-page";
import { ClientsShell } from "@/components/clients/clients-shell";
import { StudioHomePage } from "@/components/studio/studio-home-page";
import { StudioShell } from "@/components/studio/studio-shell";

export default async function HomePage() {
  const mode = getPlatformModeFromHost((await headers()).get("host"));

  if (mode === "marketing") return <MarketingHomePage />;
  // marketing-bizery → gestito dal middleware con rewrite su /bizery
  if (mode === "clients") {
    return (
      <ClientsShell>
        <ClientsHomePage />
      </ClientsShell>
    );
  }
  if (mode === "studio") {
    return (
      <StudioShell>
        <StudioHomePage />
      </StudioShell>
    );
  }
  return <TenantHomePage />;
}
