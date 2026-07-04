import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import {
  Bagel_Fat_One,
  Bebas_Neue,
  Cormorant_Garamond,
  DM_Sans,
  Fraunces,
  Inter,
  Manrope,
} from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
// globals.css carica via @import (postcss-import): styles/tenants/bepork.css,
// styles/tenants/faak.css, styles/marketing.css
import "./globals.css";
import { Providers } from "@/components/core/providers";
import { SlabbbyScriptGate } from "@/components/core/slabbby-script-gate";
import { SiteChrome, SiteFooterGate } from "@/components/core/site-chrome";
import { TenantProvider } from "@/components/core/tenant-provider";
import { PlatformModeProvider } from "@/components/core/platform-mode-provider";
import { siteConfig } from "@/lib/site-config";
import { googleRating, reviews } from "@/lib/reviews-data";
import { menu, priceFromNumber } from "@/lib/menu-data";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { findTenantById } from "@/lib/tenant-registry";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import { getTenantContent } from "@/lib/tenant-content";
import { buildIconSet, buildTenantIconSet, themeColor } from "@/lib/favicon";
import { CLIENTS_PUBLIC_ORIGIN, clientsSite } from "@/lib/clients-config";
import { STUDIO_PUBLIC_ORIGIN, studioSite } from "@/lib/studio-config";
import { isAppLocale, DEFAULT_LOCALE, LOCALE_HEADER } from "@/i18n/locales";
import { getTranslations } from "@/i18n";
import {
  BIZERY_ORIGIN,
  BIZERY_KEYWORDS,
  MENUARY_MARKETING_DESCRIPTION,
  MENUARY_ORIGIN,
  MENUARY_KEYWORDS,
  ORPHEO_ORIGIN,
  ORPHEO_KEYWORDS,
  marketingAlternates,
  ogLocale,
  marketingFaqSchema,
  marketingOrganizationSchema,
  marketingServiceSchema,
  marketingWebsiteSchema,
} from "@/lib/marketing-seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenantById } from "@/lib/data/tenant";
import { fetchLocations } from "@/lib/location";
import { LocationProvider } from "@/components/core/location-provider";
import { Suspense } from "react";
import { TenantLanguageProvider } from "@/lib/tenant-i18n";
import { PageTransitionShell } from "@/components/core/page-transition-shell";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { tenantLanguageAlternates } from "@/lib/tenant-localized-path";

const display = Bagel_Fat_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const impact = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-impact",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const menuaryDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-menuary-display",
  display: "swap",
});

const menuaryBody = DM_Sans({
  subsets: ["latin"],
  variable: "--font-menuary-body",
  display: "swap",
});

const cascinaHeading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cascina-heading",
  display: "swap",
});

const cascinaBody = Inter({
  subsets: ["latin"],
  variable: "--font-cascina-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("host");
  const modeHeader = h.get(PLATFORM_MODE_HEADER);
  const localeHeader = h.get(LOCALE_HEADER);
  const previewTenantId = h.get("x-preview-tenant-id");
  const tenant = findTenantById(previewTenantId ?? "") ?? resolveTenantFromHost(host);
  const mode = getPlatformModeFromHeaderValue(modeHeader, host);
  const isTenantPreview =
    mode === "preview" ||
    mode === "preview-bizery" ||
    mode === "preview-orpheo" ||
    Boolean(previewTenantId);

  if (mode === "platform-admin") {
    return {
      metadataBase: new URL("https://admin.menuary.it"),
      title: { default: "Menuary · admin", template: "%s · Menuary" },
      robots: { index: false, follow: false },
      icons: buildIconSet(mode, tenant),
    };
  }

  if (mode === "gestione" || mode === "gestione-custom") {
    return {
      metadataBase: new URL(mode === "gestione-custom" ? `https://gestione.${tenant.domains[0] ?? "menuary.it"}` : "https://gestione.menuary.it"),
      title: { default: `${tenant.name} · gestione`, template: `%s · ${tenant.name}` },
      robots: { index: false, follow: false },
      icons: buildIconSet(mode, tenant),
    };
  }

  if (mode === "clients") {
    return {
      metadataBase: new URL(CLIENTS_PUBLIC_ORIGIN),
      title: {
        default: clientsSite.name,
        template: "%s · Menuary",
      },
      description: clientsSite.description,
      keywords: [
        "Menuary",
        "account clienti",
        "privacy",
        "consensi",
        "allergeni",
        "ordini ristorante",
      ],
      openGraph: {
        title: clientsSite.name,
        description: clientsSite.description,
        url: CLIENTS_PUBLIC_ORIGIN,
        siteName: "Menuary",
        locale: "it_IT",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: clientsSite.name,
        description: clientsSite.description,
      },
      alternates: {
        canonical: CLIENTS_PUBLIC_ORIGIN,
      },
      icons: buildIconSet(mode, tenant),
    };
  }

  if (mode === "marketing-bizery") {
    const seo = (await getTranslations("bizery")).seo.home;
    return {
      metadataBase: new URL(BIZERY_ORIGIN),
      title: {
        default: seo.title,
        template: "%s · Bizery",
      },
      description: seo.description,
      keywords: BIZERY_KEYWORDS,
      openGraph: {
        title: seo.title,
        description: seo.description,
        url: BIZERY_ORIGIN,
        siteName: "Bizery",
        locale: ogLocale(isAppLocale(localeHeader) ? localeHeader : DEFAULT_LOCALE),
        type: "website",
        images: [
          { url: `${BIZERY_ORIGIN}/api/og?brand=bizery`, width: 1200, height: 630, alt: seo.title },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: seo.title,
        description: seo.description,
        images: [`${BIZERY_ORIGIN}/api/og?brand=bizery`],
      },
      alternates: marketingAlternates(
        BIZERY_ORIGIN,
        "",
        isAppLocale(localeHeader) ? localeHeader : DEFAULT_LOCALE,
      ),
      icons: buildIconSet(mode, tenant),
    };
  }

  if (mode === "marketing-orpheo") {
    const seo = (await getTranslations("orpheo")).seo.home;
    return {
      metadataBase: new URL(ORPHEO_ORIGIN),
      title: {
        default: seo.title,
        template: "%s · Orpheo",
      },
      description: seo.description,
      keywords: ORPHEO_KEYWORDS,
      openGraph: {
        title: seo.title,
        description: seo.description,
        url: ORPHEO_ORIGIN,
        siteName: "Orpheo",
        locale: ogLocale(isAppLocale(localeHeader) ? localeHeader : DEFAULT_LOCALE),
        type: "website",
        images: [
          { url: `${ORPHEO_ORIGIN}/api/og?brand=orpheo`, width: 1200, height: 630, alt: seo.title },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: seo.title,
        description: seo.description,
        images: [`${ORPHEO_ORIGIN}/api/og?brand=orpheo`],
      },
      alternates: marketingAlternates(
        ORPHEO_ORIGIN,
        "",
        isAppLocale(localeHeader) ? localeHeader : DEFAULT_LOCALE,
      ),
      icons: buildIconSet(mode, tenant),
    };
  }

  if (mode === "studio") {
    return {
      metadataBase: new URL(STUDIO_PUBLIC_ORIGIN),
      title: {
        default: studioSite.name,
        template: "%s · Menuary",
      },
      description: studioSite.description,
      keywords: [
        "Menuary",
        "fatturazione ristorante",
        "abbonamento",
        "SEPA",
        "Stripe",
        "recesso",
      ],
      openGraph: {
        title: studioSite.name,
        description: studioSite.description,
        url: STUDIO_PUBLIC_ORIGIN,
        siteName: "Menuary",
        locale: "it_IT",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: studioSite.name,
        description: studioSite.description,
      },
      alternates: {
        canonical: STUDIO_PUBLIC_ORIGIN,
      },
      icons: buildIconSet(mode, tenant),
    };
  }

  const content = getTenantContent(tenant.id);
  const tenantLocaleConfig = getTenantLocaleConfig(tenant.id);
  const tenantPublicPath = h.get("x-tenant-public-path") ?? "/";
  const tenantOrigin = host ? `${host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https"}://${host}` : content.url;
  const tenantMetadataPreviewSlug =
    tenant.previewSlug && tenantPublicPath.startsWith(`/${tenant.previewSlug}/`)
      ? tenant.previewSlug
      : undefined;
  const tenantLocale = tenantLocaleConfig && localeHeader && tenantLocaleConfig.locales.includes(localeHeader)
    ? localeHeader
    : tenantLocaleConfig?.defaultLocale;
  const tenantTitle =
    tenant.id === "faak"
      ? `${tenant.name} - cibo e vino a ribellione naturale`
      : tenant.id === "doca"
        ? "Doca - Pane, Caffè, Saudade · Milano"
      : tenant.id === "cascina-errante"
        ? "Cascina Errante - Ristorante demo Menuary"
      : tenant.id === "junior-food"
        ? "Junior Food - Cucina sudamericana a Bergamo"
      : tenant.vertical === "creative"
        ? `${tenant.name} - press kit, opere e booking creativo`
      : tenant.vertical === "services"
        ? tenant.id === "officinakam"
          ? "Officina KAM - Meccanica di precisione"
          : tenant.id === "pynkstudio"
            ? "PYNK STUDIO — Software house AI e governance tecnica"
            : `${tenant.name} - servizi, appuntamenti e listino prezzi`
        : `${tenant.name} - Burger, Pizza e Cucina italiana`;

  const marketingHome =
    mode === "marketing"
      ? (await getTranslations("marketing")).seo.home
      : { title: "Menuary", description: MENUARY_MARKETING_DESCRIPTION };

  return {
    metadataBase: new URL(
      mode === "marketing"
        ? MENUARY_ORIGIN
        : tenantLocaleConfig
          ? tenantOrigin
          : content.url,
    ),
    title:
      mode === "marketing"
        ? {
            default: marketingHome.title,
            template: "%s · Menuary",
          }
        : {
            default: tenantTitle,
            template: `%s · ${tenant.name}`,
          },
    description:
      mode === "marketing"
        ? marketingHome.description
        : content.description,
    keywords:
      mode === "marketing"
        ? MENUARY_KEYWORDS
        : tenant.id === "faak"
          ? [
              tenant.name,
              "FAAK Milano",
              "Viviana Varese",
              "aperitivo Milano Isola",
              "ristorante Via Arnaldo da Brescia",
            ]
          : tenant.id === "doca"
            ? [
                "Doca Milano",
                "Doca Pane Caffè Saudade",
                "bakery brasiliana Milano",
                "padoca Milano",
                "pão de queijo Milano",
                "caffè filtro Cafezal",
                "Via Breno 2 Milano",
              ]
          : tenant.id === "cascina-errante"
            ? [
                "Cascina Errante",
                "ristorante demo Menuary",
                "cucina a vista",
                "ristorante laboratorio",
                "microgreens",
                "food truck premium",
                "cascinaerrante.it",
              ]
          : tenant.id === "pynkstudio"
            ? [
                "PYNK STUDIO",
                "sviluppo siti web",
                "web app su misura",
                "app iOS Android",
                "applicazioni desktop",
                "software house Milano",
                "software house AI",
                "AI Governance",
                "AI Act aziende",
                "AI Readiness Assessment",
                "AI Literacy",
                "sistemi RAG",
                "agenti AI",
                "LLM on-premise",
                "consulenza operativa PMI",
              ]
          : tenant.id === "junior-food"
            ? [
                "Junior Food Bergamo",
                "cucina sudamericana Bergamo",
                "ristorante latino Bergamo",
                "feijoada Bergamo",
                "pique macho Bergamo",
                "Via Gianbattista Moroni Bergamo",
              ]
          : [
              tenant.name,
              "hamburger demo",
              "burger house",
              "pizzeria demo",
              "ristorante demo",
              "street food",
              "menu digitale ristorante",
              "pulled pork",
              "pizza all'assassina",
            ],
    openGraph: {
      title:
        mode === "marketing"
          ? marketingHome.title
          : tenantTitle,
      description:
        mode === "marketing"
          ? marketingHome.description
          : content.description,
      url:
        mode === "marketing"
          ? MENUARY_ORIGIN
          : tenantLocaleConfig
            ? `${tenantOrigin}${tenantPublicPath}`
            : content.url,
      siteName: mode === "marketing" ? "Menuary" : tenant.name,
      locale:
        mode === "marketing"
          ? ogLocale(isAppLocale(localeHeader) ? localeHeader : DEFAULT_LOCALE)
          : "it_IT",
      type: "website",
      ...(mode === "marketing"
        ? {
            images: [
              {
                url: `${MENUARY_ORIGIN}/api/og?brand=menuary`,
                width: 1200,
                height: 630,
                alt: marketingHome.title,
              },
            ],
          }
        : {
            images: [
              { url: content.showcaseLogoSrc, alt: content.showcaseLogoAlt },
            ],
          }),
    },
    twitter: {
      card: "summary_large_image",
      title: mode === "marketing" ? marketingHome.title : tenant.name,
      description:
        mode === "marketing"
          ? marketingHome.description
          : content.description,
      ...(mode === "marketing"
        ? { images: [`${MENUARY_ORIGIN}/api/og?brand=menuary`] }
        : { images: [content.showcaseLogoSrc] }),
    },
    ...(isTenantPreview
      ? {
          robots: {
            index: false,
            follow: false,
            nocache: true,
          },
        }
      : {}),
    alternates: {
      canonical: mode === "marketing"
        ? marketingAlternates(
            MENUARY_ORIGIN,
            "",
            isAppLocale(localeHeader) ? localeHeader : DEFAULT_LOCALE,
          ).canonical
        : tenantLocaleConfig && tenantLocale
          ? `${tenantOrigin}${tenantPublicPath}`
          : content.url,
      ...(mode === "marketing"
        ? {
            languages: marketingAlternates(
              MENUARY_ORIGIN,
              "",
              isAppLocale(localeHeader) ? localeHeader : DEFAULT_LOCALE,
            ).languages,
          }
        : tenantLocaleConfig && tenantLocale
          ? {
              languages: tenantLanguageAlternates({
                origin: tenantOrigin,
                pathname: tenantPublicPath,
                previewSlug: tenantMetadataPreviewSlug,
                locales: tenantLocaleConfig.locales,
                defaultLocale: tenantLocaleConfig.defaultLocale,
              }),
            }
          : {}),
    },
    icons: previewTenantId ? buildTenantIconSet(tenant) : buildIconSet(mode, tenant),
  };
}

export async function generateViewport(): Promise<Viewport> {
  const h = await headers();
  const host = h.get("host");
  const tenant = findTenantById(h.get("x-preview-tenant-id") ?? "") ?? resolveTenantFromHost(host);
  const mode = getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), host);
  return {
    themeColor: themeColor(mode, tenant),
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: siteConfig.name,
  image: `${siteConfig.url}/logo-payoff.png`,
  url: siteConfig.url,
  telephone: siteConfig.contact.phone,
  priceRange: "€€",
  servesCuisine: ["Italian", "American", "Pizza", "Burgers", "Pugliese"],
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.street,
    postalCode: siteConfig.address.zip,
    addressLocality: siteConfig.address.city,
    addressRegion: siteConfig.address.province,
    addressCountry: siteConfig.address.country,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: siteConfig.geo.latitude,
    longitude: siteConfig.geo.longitude,
  },
  openingHours: siteConfig.hoursSchema,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: googleRating.average,
    reviewCount: googleRating.count,
    bestRating: 5,
    worstRating: 1,
  },
  review: reviews.map((r) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.author },
    reviewRating: {
      "@type": "Rating",
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: r.text,
  })),
  hasMenu: {
    "@type": "Menu",
    hasMenuSection: menu.map((cat) => ({
      "@type": "MenuSection",
      name: cat.title,
      description: cat.subtitle,
      hasMenuItem: cat.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        offers: {
          "@type": "Offer",
          price: priceFromNumber(item.price),
          priceCurrency: "EUR",
        },
      })),
    })),
  },
  sameAs: [siteConfig.social.instagram, siteConfig.social.facebook],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const reqHeaders = await headers();
  const host = reqHeaders.get("host");
  const tenant = findTenantById(reqHeaders.get("x-preview-tenant-id") ?? "") ?? resolveTenantFromHost(host);
  const mode = getPlatformModeFromHeaderValue(reqHeaders.get(PLATFORM_MODE_HEADER), host);
  const themeVars = tenantThemeCssVars(tenant.theme);

  // Su dominio di produzione lo stato di abilitazione/sospensione vive sul DB
  // (la sospensione per mancato pagamento aggiorna tenants.enabled/status).
  // Fail-open: se la lettura fallisce usiamo il profilo statico → un sito che
  // paga non va offline per un errore DB transitorio.
  const liveTenant = mode === "tenant" ? await getTenantById(tenant.id).catch(() => null) : null;
  const effectiveEnabled = liveTenant?.enabled ?? tenant.enabled;
  const effectiveStatus = liveTenant?.status ?? tenant.status;
  const tenantSiteDisabled =
    (mode === "tenant" || mode === "preview" || mode === "preview-bizery" || mode === "preview-orpheo") &&
    (!effectiveEnabled || effectiveStatus === "offline" || effectiveStatus === "suspended");
  const unavailableReason: "suspended" | "offline" =
    effectiveStatus === "suspended" ? "suspended" : "offline";

  // Fetch sedi solo per tenant con multiLocation abilitato in modalità tenant site.
  // In tutti gli altri mode (marketing, admin, gestione…) le sedi non servono al root layout.
  const locations =
    mode === "tenant" && tenant.features.multiLocation
      ? await fetchLocations(await createSupabaseServerClient(), tenant.id)
      : [];

  // Slug sede da sottodominio tenant (es. sede.example.it → "sede"), impostato dal middleware.
  const locationSlug = reqHeaders.get("x-location-slug") ?? undefined;
  const localeHeader = reqHeaders.get(LOCALE_HEADER);
  const lang = isAppLocale(localeHeader) ? localeHeader : "it";
  // Per i mode Bizery il contenuto tenant non è rilevante (shell propria, nessun JSON-LD).
  const isBizeryMode =
    mode === "marketing-bizery" || mode === "gestione-bizery" || mode === "preview-bizery";
  const isOrpheoMode = mode === "marketing-orpheo" || mode === "preview-orpheo";
  const content = isBizeryMode || isOrpheoMode ? null : getTenantContent(tenant.id);
  const showRestaurantJsonLd = mode === "tenant" && tenant.id === "bepork" && content !== null;
  const marketingBrand =
    mode === "marketing" ? "menuary" : mode === "marketing-bizery" ? "bizery" : mode === "marketing-orpheo" ? "orpheo" : null;
  const marketingSchemas = marketingBrand
    ? [
        marketingOrganizationSchema(marketingBrand),
        marketingWebsiteSchema(marketingBrand),
        marketingServiceSchema(marketingBrand),
        marketingFaqSchema(marketingBrand),
      ]
    : [];
  const tenantRestaurantSchema = content ? {
    ...restaurantSchema,
    name: tenant.name,
    image: `${content.url}${content.showcaseLogoSrc}`,
    url: content.url,
    telephone: content.contact.phone,
    address: {
      ...restaurantSchema.address,
      streetAddress: content.address.street,
      postalCode: content.address.zip,
      addressLocality: content.address.city,
      addressRegion: content.address.province,
    },
    sameAs: [content.social.instagram, content.social.facebook],
  } : restaurantSchema;

  return (
    <html
      lang={lang}
      className={`${display.variable} ${impact.variable} ${body.variable} ${menuaryDisplay.variable} ${menuaryBody.variable} ${cascinaHeading.variable} ${cascinaBody.variable}`}
      style={themeVars as React.CSSProperties}
      data-tenant={tenant.id}
      data-platform={mode}
    >
      <body>
        {showRestaurantJsonLd ? (
          <Script
            id="schema-restaurant"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(tenantRestaurantSchema) }}
          />
        ) : null}
        {marketingSchemas.map((schema, index) => (
          <Script
            key={`schema-marketing-${index}`}
            id={`schema-marketing-${index}`}
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <Analytics />
        <PlatformModeProvider mode={mode}>
          <TenantLanguageProvider initialLanguage={localeHeader}>
            <TenantProvider tenant={tenant}>
            {/* skipInPreview: in preview mode il tenant dell'host è il default del
                verticale, non quello dello slug. La pagina preview gestisce il proprio gate. */}
            <SlabbbyScriptGate skipInPreview />
            <Suspense>
              <LocationProvider locations={locations} activeSlug={locationSlug}>
                <Providers>
                  {tenantSiteDisabled ? (
                    <TenantUnavailable vertical={tenant.vertical} reason={unavailableReason} />
                  ) : (
                    <>
                      <SiteChrome />
                      <main>
                        <PageTransitionShell>{children}</PageTransitionShell>
                      </main>
                      <SiteFooterGate />
                    </>
                  )}
                </Providers>
              </LocationProvider>
            </Suspense>
            </TenantProvider>
          </TenantLanguageProvider>
        </PlatformModeProvider>
      </body>
    </html>
  );
}

function TenantUnavailable({
  vertical,
  reason = "offline",
}: {
  vertical: "food" | "services" | "creative";
  reason?: "offline" | "suspended";
}) {
  const isCreative = vertical === "creative";
  const isServices = vertical === "services";
  const support = isCreative ? "support@weuseorpheo.com" : isServices ? "support@bizery.it" : "support@menuary.it";
  const brand = isCreative ? "Orpheo" : isServices ? "Bizery" : "Menuary";
  const suspended = reason === "suspended";

  // Colori e font sono token di tema per-tenant (pork-* → rgb(var(--tenant-*)),
  // font-* → var(--font-*)): la pagina assume automaticamente l'identità del tenant.
  return (
    <main className="flex min-h-screen items-center justify-center bg-pork-cream px-5 py-16 text-pork-ink">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center ring-1 ring-pork-ink/10">
        <p className="impact-title text-xs text-pork-red">{brand}</p>
        <h1 className="headline mt-2 text-4xl">
          {suspended ? "Servizio temporaneamente sospeso" : "Sito non disponibile"}
        </h1>
        <p className="mt-4 text-pork-ink/65">
          {suspended
            ? "Il servizio è momentaneamente sospeso. Per riattivarlo o per assistenza contatta il supporto."
            : "Questo sito non è al momento disponibile. Per informazioni o assistenza contatta il servizio clienti."}
        </p>
        <a
          href={`mailto:${support}`}
          className="mt-6 inline-flex rounded-full bg-pork-ink px-5 py-3 text-sm font-black text-white hover:bg-pork-ink/85"
        >
          {support}
        </a>
      </div>
    </main>
  );
}
