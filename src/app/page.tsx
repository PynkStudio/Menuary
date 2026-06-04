import { headers } from "next/headers";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import { MarketingHomePage } from "@/components/marketing/pages/home";
import { TenantHomePage } from "@/components/tenants/_shared/pages/home";
import { ClientsHomePage } from "@/components/clients/clients-home-page";
import { ClientsShell } from "@/components/clients/clients-shell";
import { StudioHomePage } from "@/components/studio/studio-home-page";
import { StudioShell } from "@/components/studio/studio-shell";
import { BizeryStudioHomePage } from "@/components/bizery-studio/bizery-studio-home-page";
import { BizeryStudioShell } from "@/components/bizery-studio/bizery-studio-shell";
import { PreviewNoSlug } from "@/components/preview/preview-no-slug";

export default async function HomePage() {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));

  if (mode === "marketing") return <MarketingHomePage />;
  // marketing-bizery → gestito dal middleware con rewrite su /bizery
  if (mode === "preview") return <PreviewNoSlug mode="preview" />;
  if (mode === "preview-bizery") return <PreviewNoSlug mode="preview-bizery" />;
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
  if (mode === "studio-bizery") {
    return (
      <BizeryStudioShell>
        <BizeryStudioHomePage />
      </BizeryStudioShell>
    );
  }
  return <TenantHomePage />;
}
