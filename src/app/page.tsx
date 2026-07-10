import { headers } from "next/headers";
import { notFound } from "next/navigation";
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
import { AppDownloadPage } from "@/components/app-download/app-download-page";
import { PynkStudioHomePage } from "@/components/tenants/pynkstudio/pages/home";
import { CascinaErranteHomePage } from "@/components/tenants/cascina-errante/pages/home";
import { findTenantById } from "@/lib/tenant-registry";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";

export default async function HomePage() {
  const h = await headers();
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host"));

  if (mode === "marketing") return <MarketingHomePage />;
  if (mode === "app") return <AppDownloadPage />;
  // marketing-bizery → gestito dal middleware con rewrite su /bizery
  if (mode === "preview") return <PreviewNoSlug mode="preview" />;
  if (mode === "preview-bizery") return <PreviewNoSlug mode="preview-bizery" />;
  if (mode === "preview-orpheo") return <PreviewNoSlug mode="preview-orpheo" />;
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
  // Tenant con sito proprio sul dominio custom: dispatch per id.
  const tenant =
    findTenantById(h.get("x-preview-tenant-id") ?? "") ?? resolveTenantFromHost(h.get("host"));
  if (!tenant) notFound();
  if (tenant.id === "pynkstudio") return <PynkStudioHomePage />;
  if (tenant.id === "cascina-errante") return <CascinaErranteHomePage />;

  return <TenantHomePage />;
}
