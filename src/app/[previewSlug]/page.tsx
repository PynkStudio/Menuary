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
import { ValentinaOrciuoliHomePage } from "@/components/tenants/valentina-orciuoli/pages/home";
import { StudioAranzullaHomePage } from "@/components/tenants/studioaranzulla/pages/home";
import { PynkStudioHomePage } from "@/components/tenants/pynkstudio/pages/home";
import { JuniorFoodHomePage } from "@/components/tenants/junior-food/pages/home";
import { KimosHomePage } from "@/components/tenants/kimos/pages/home";
import { CascinaErranteHomePage } from "@/components/tenants/cascina-errante/pages/home";
import { OrpheoShell } from "@/components/orpheo/orpheo-shell";
import { Footer } from "@/components/tenant-shell/footer";
import { DocaAbout } from "@/components/tenants/doca/doca-about";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantContent } from "@/lib/tenant-content";
import { buildTenantIconSet } from "@/lib/favicon";
import { LOCALE_HEADER } from "@/i18n/locales";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { tenantLanguageAlternates } from "@/lib/tenant-localized-path";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const mode = getPlatformModeFromHost(host);
  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug, host);
  const content = getTenantContent(tenant.id);
  const localeConfig = getTenantLocaleConfig(tenant.id);
  const locale = requestHeaders.get(LOCALE_HEADER) ?? localeConfig?.defaultLocale;
  const metadataOrigin =
    mode === "preview-orpheo"
      ? "https://demo.weuseorpheo.com"
      : mode === "preview-bizery"
        ? "https://demo.bizery.it"
        : "https://demo.menuary.it";
  const localizedPath = localeConfig && locale ? `/${previewSlug}/${locale}` : `/${previewSlug}`;
  const isServices = tenant.vertical === "services";
  const title =
    tenant.id === "officinakam"
      ? "Officina KAM - Meccanica di precisione"
      : tenant.id === "libritech"
        ? "LibriTech - Tech & Startup Books"
        : tenant.id === "valentina-orciuoli"
          ? "Valentina Orciuoli - Fantasy orientale e The Emotion Dragons Trilogy"
        : tenant.id === "studioaranzulla"
          ? "Studio Legale Aranzulla - Avv. Lara Aranzulla"
        : tenant.id === "pynkstudio"
          ? "PYNK STUDIO — Software, web e app su misura"
          : isServices
        ? `${tenant.name} - servizi, appuntamenti e listino prezzi`
        : tenant.id === "faak"
          ? `${tenant.name} - cibo e vino a ribellione naturale`
          : tenant.id === "doca"
            ? "Doca - Pane, Caffè, Saudade · Milano"
            : tenant.id === "junior-food"
              ? "Junior Food - Cucina sudamericana a Bergamo"
            : tenant.id === "nom-sushi"
              ? "Nøm sushi vibes - All you can eat sushi fusion a Genova"
            : tenant.id === "kimos"
              ? "Pizzeria Kimos - Pizza, kebab e ordini online a Milano"
            : tenant.id === "cascina-errante"
              ? "Cascina Errante - Ristorante demo Menuary"
            : `${tenant.name} - Burger, Pizza e Cucina italiana`;

  return {
    metadataBase: new URL(metadataOrigin),
    title: { absolute: title },
    description: content.description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
    openGraph: {
      title,
      description: content.description,
      url: `${metadataOrigin}${localizedPath}`,
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
    ...(localeConfig && locale
      ? {
          alternates: {
            canonical: `${metadataOrigin}${localizedPath}`,
            languages: tenantLanguageAlternates({
              origin: metadataOrigin,
              pathname: `/${previewSlug}`,
              previewSlug,
              locales: localeConfig.locales,
              defaultLocale: localeConfig.defaultLocale,
            }),
          },
        }
      : {}),
  };
}

export default async function PreviewTenantHome({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  const isLocalPreviewDev =
    host?.includes("localhost") || host?.includes("127.0.0.1");

  if (mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo" && !isLocalPreviewDev) notFound();

  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug, host);
  if (tenant.previewSlug !== previewSlug) notFound();

  const themeVars = tenantThemeCssVars(tenant.theme);

  // ── Verticale creative (Orpheo) ─────────────────────────────────────────────
  if (tenant.vertical === "creative") {
    return (
      <TenantProvider tenant={tenant}>
        <div
          className="min-h-screen"
          data-tenant-surface={tenant.id}
          style={themeVars as React.CSSProperties}
        >
          {tenant.id === "valentina-orciuoli" ? (
            <ValentinaOrciuoliHomePage />
          ) : (
            <OrpheoShell>
              <div className="menuary-container py-24">
                <p className="menuary-section-label">Demo Orpheo</p>
                <h1
                  className="mt-6 max-w-3xl text-[clamp(3rem,7vw,6rem)] font-medium leading-[1.02] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                >
                  {tenant.name}
                </h1>
                <p className="mt-6 max-w-2xl text-[17px] leading-8 text-[var(--menuary-muted)]">
                  Profilo creativo, catalogo opere, booking e fanbase su piattaforma Orpheo.
                </p>
              </div>
            </OrpheoShell>
          )}
        </div>
      </TenantProvider>
    );
  }

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
          ) : tenant.id === "pynkstudio" ? (
            <PynkStudioHomePage />
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
        {tenant.id === "junior-food" ? (
          <JuniorFoodHomePage />
        ) : tenant.id === "kimos" ? (
          <KimosHomePage />
        ) : tenant.id === "cascina-errante" ? (
          <>
            <CascinaErranteHomePage />
            <Footer />
          </>
        ) : (
          <>
            <Hero />
            <ThreeSouls />
            {tenant.id === "doca" && <DocaAbout />}
            {tenant.id !== "doca" && <SignatureDishes />}
            {tenant.id === "bepork" && <FixedMenus />}
            <ReviewsSection />
            <FindUs />
            <DeliveryStrip />
            <Footer />
          </>
        )}
      </div>
    </TenantProvider>
  );
}
