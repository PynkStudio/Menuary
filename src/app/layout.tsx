import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import {
  Bagel_Fat_One,
  Bebas_Neue,
  DM_Sans,
  Fraunces,
  Manrope,
} from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
// globals.css carica via @import (postcss-import): styles/tenants/bepork.css,
// styles/tenants/faak.css, styles/marketing.css
import "./globals.css";
import { Providers } from "@/components/core/providers";
import { SiteChrome, SiteFooterGate } from "@/components/core/site-chrome";
import { TenantProvider } from "@/components/core/tenant-provider";
import { PlatformModeProvider } from "@/components/core/platform-mode-provider";
import { siteConfig } from "@/lib/site-config";
import { googleRating, reviews } from "@/lib/reviews-data";
import { menu, priceFromNumber } from "@/lib/menu-data";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getPlatformModeFromHost } from "@/lib/platform";
import { getTenantContent } from "@/lib/tenant-content";
import { buildIconSet, themeColor } from "@/lib/favicon";
import { CLIENTS_PUBLIC_ORIGIN, clientsSite } from "@/lib/clients-config";
import { STUDIO_PUBLIC_ORIGIN, studioSite } from "@/lib/studio-config";

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

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const tenant = resolveTenantFromHost(host);
  const mode = getPlatformModeFromHost(host);

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
  const tenantTitle =
    tenant.id === "faak"
      ? `${tenant.name} - cibo e vino a ribellione naturale`
      : `${tenant.name} - Burger, Pizza e Cucina Pugliese a Bari`;

  return {
    metadataBase: new URL(mode === "marketing" ? siteConfig.url : content.url),
    title:
      mode === "marketing"
        ? {
            default: "Menuary - siti personalizzati per ristoranti",
            template: "%s · Menuary",
          }
        : {
            default: tenantTitle,
            template: `%s · ${tenant.name}`,
          },
    description:
      mode === "marketing"
        ? "Menuary crea siti su misura per ristoranti, con menu digitale, prenotazioni, ordini e gestione semplice dei contenuti."
        : content.description,
    keywords:
      mode === "marketing"
        ? [
            "Menuary",
            "siti per ristoranti",
            "menu digitale",
            "ordini ristorante",
            "sito ristorante online",
          ]
        : tenant.id === "faak"
          ? [
              tenant.name,
              "FAAK Milano",
              "Viviana Varese",
              "aperitivo Milano Isola",
              "ristorante Via Arnaldo da Brescia",
            ]
          : [
              tenant.name,
              "hamburger Bari",
              "burger Bari centro",
              "pizzeria Bari",
              "ristorante Bari",
              "street food Bari",
              "Via Quintino Sella Bari",
              "pulled pork Bari",
              "pizza all'assassina Bari",
            ],
    openGraph: {
      title:
        mode === "marketing"
          ? "Menuary - siti personalizzati per ristoranti"
          : tenantTitle,
      description:
        mode === "marketing"
          ? "Menuary crea siti su misura per ristoranti, con menu digitale, prenotazioni, ordini e gestione semplice dei contenuti."
          : content.description,
      url: mode === "marketing" ? "https://menuary.it" : content.url,
      siteName: mode === "marketing" ? "Menuary" : tenant.name,
      locale: "it_IT",
      type: "website",
      ...(mode === "marketing"
        ? {}
        : {
            images: [
              { url: content.showcaseLogoSrc, alt: content.showcaseLogoAlt },
            ],
          }),
    },
    twitter: {
      card: "summary_large_image",
      title: mode === "marketing" ? "Menuary" : tenant.name,
      description:
        mode === "marketing"
          ? "Menuary crea siti su misura per ristoranti, con menu digitale, prenotazioni, ordini e gestione semplice dei contenuti."
          : content.description,
      ...(mode === "marketing" ? {} : { images: [content.showcaseLogoSrc] }),
    },
    alternates: {
      canonical: mode === "marketing" ? "https://menuary.it" : content.url,
    },
    icons: buildIconSet(mode, tenant),
  };
}

export async function generateViewport(): Promise<Viewport> {
  const host = (await headers()).get("host");
  const tenant = resolveTenantFromHost(host);
  const mode = getPlatformModeFromHost(host);
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
  const host = (await headers()).get("host");
  const tenant = resolveTenantFromHost(host);
  const mode = getPlatformModeFromHost(host);
  const themeVars = tenantThemeCssVars(tenant.theme);
  const content = getTenantContent(tenant.id);
  const showRestaurantJsonLd = mode === "tenant" || mode === "preview";
  const tenantRestaurantSchema = {
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
  };

  return (
    <html
      lang="it"
      className={`${display.variable} ${impact.variable} ${body.variable} ${menuaryDisplay.variable} ${menuaryBody.variable}`}
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
        <Analytics />
        <PlatformModeProvider mode={mode}>
          <TenantProvider tenant={tenant}>
            <Providers>
              <SiteChrome />
              <main className="min-w-0 overflow-x-hidden">{children}</main>
              <SiteFooterGate />
            </Providers>
          </TenantProvider>
        </PlatformModeProvider>
      </body>
    </html>
  );
}
