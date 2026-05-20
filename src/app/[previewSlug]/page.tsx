import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { Hero } from "@/components/tenants/_shared/hero";
import { ThreeSouls } from "@/components/tenants/_shared/three-souls";
import { SignatureDishes } from "@/components/tenants/_shared/signature-dishes";
import { FixedMenus } from "@/components/tenants/_shared/fixed-menus";
import { ReviewsSection } from "@/components/modules/reviews/reviews-section";
import { FindUs } from "@/components/modules/reservations/find-us";
import { DeliveryStrip } from "@/components/modules/shop/delivery-strip";
import { ServicesHero } from "@/components/tenants/_shared/services-hero";
import { ServicesCategories } from "@/components/tenants/_shared/services-categories";
import { ServicesContact } from "@/components/tenants/_shared/services-contact";
import { OfficinaKamHomePage } from "@/components/tenants/officinakam/pages/home";
import { LibritechHomePage } from "@/components/tenants/libritech/pages/home";
import { StudioAranzullaHomePage } from "@/components/tenants/studioaranzulla/pages/home";
import { Footer } from "@/components/tenant-shell/footer";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantContent } from "@/lib/tenant-content";
import { buildTenantIconSet } from "@/lib/favicon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}): Promise<Metadata> {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug, host);
  const content = getTenantContent(tenant.id);
  const isServices = tenant.vertical === "services";
  const title =
    tenant.id === "officinakam"
      ? "Officina KAM - Meccanica di precisione"
      : tenant.id === "libritech"
        ? "LibriTech - Tech & Startup Books"
        : tenant.id === "studioaranzulla"
          ? "Studio Legale Aranzulla - Avv. Lara Aranzulla"
          : isServices
        ? `${tenant.name} - servizi, appuntamenti e listino prezzi`
        : tenant.id === "faak"
          ? `${tenant.name} - cibo e vino a ribellione naturale`
          : `${tenant.name} - Burger, Pizza e Cucina Pugliese a Bari`;

  return {
    metadataBase: new URL(mode === "preview-bizery" ? "https://demo.bizery.it" : "https://demo.menuary.it"),
    title: { absolute: title },
    description: content.description,
    openGraph: {
      title,
      description: content.description,
      url: content.url,
      siteName: tenant.name,
      locale: "it_IT",
      type: "website",
      images: [{ url: content.showcaseLogoSrc, alt: content.showcaseLogoAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: content.description,
      images: [content.showcaseLogoSrc],
    },
    icons: buildTenantIconSet(tenant),
  };
}

export default async function PreviewTenantHome({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);

  if (mode !== "preview" && mode !== "preview-bizery") notFound();

  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug, host);
  if (tenant.previewSlug !== previewSlug) notFound();

  const themeVars = tenantThemeCssVars(tenant.theme);

  // ── Verticale services (Bizery) ──────────────────────────────────────────────
  if (tenant.vertical === "services") {
    return (
      <TenantProvider tenant={tenant}>
        <div
          className="min-h-screen"
          data-tenant-surface={tenant.id}
          style={themeVars as React.CSSProperties}
        >
          {tenant.id === "officinakam" ? (
            <OfficinaKamHomePage />
          ) : tenant.id === "libritech" ? (
            <LibritechHomePage />
          ) : tenant.id === "studioaranzulla" ? (
            <StudioAranzullaHomePage />
          ) : (
            <>
              <ServicesHero />
              <ServicesCategories />
              <ServicesContact />
            </>
          )}
        </div>
      </TenantProvider>
    );
  }

  // ── Verticale food (Menuary) — layout di default ─────────────────────────────
  return (
    <TenantProvider tenant={tenant}>
      <div
        className="tenant-preview-surface min-h-screen"
        data-tenant-surface={tenant.id}
        style={themeVars as React.CSSProperties}
      >
        <Hero />
        <ThreeSouls />
        <SignatureDishes />
        <FixedMenus />
        <ReviewsSection />
        <FindUs />
        <DeliveryStrip />
        <Footer />
      </div>
    </TenantProvider>
  );
}
