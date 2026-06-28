import type { Metadata } from "next";
import { PYNK_ORIGIN } from "./ai-governance-data";

// Date di pubblicazione/aggiornamento del corpus AI Governance.
// Fisse e versionate nel codice: niente new Date() (cambierebbe a ogni build e
// Google diffida dei lastmod sempre nuovi). Aggiornare a revisione dei contenuti.
export const PYNK_ARTICLE_PUBLISHED = "2026-06-15T09:00:00+02:00";
export const PYNK_ARTICLE_MODIFIED = "2026-06-28T09:00:00+02:00";

const DEFAULT_OG_IMAGE = `${PYNK_ORIGIN}/pynkstudio/pynk-logo-transparent.png`;

type PynkMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
};

export function pynkMetadata({
  title,
  description,
  path,
  keywords,
  type = "website",
  image = DEFAULT_OG_IMAGE,
  publishedTime,
  modifiedTime,
}: PynkMetadataInput): Metadata {
  const url = `${PYNK_ORIGIN}${path}`;
  return {
    title: { absolute: title },
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical: url,
      // Single-locale (it): canonical self-referenziante + x-default sullo stesso URL.
      languages: {
        "it-IT": url,
        "x-default": url,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "PYNK STUDIO",
      locale: "it_IT",
      type,
      images: [{ url: image, alt: title }],
      ...(type === "article"
        ? {
            publishedTime: publishedTime ?? PYNK_ARTICLE_PUBLISHED,
            modifiedTime: modifiedTime ?? PYNK_ARTICLE_MODIFIED,
            authors: ["PYNK STUDIO"],
            section: "AI Governance",
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PYNK STUDIO",
    alternateName: "Pynk Studio - AI Engineering Company",
    url: PYNK_ORIGIN,
    logo: `${PYNK_ORIGIN}/pynkstudio/pynk-logo-transparent.png`,
    description:
      "AI Engineering Company: progettiamo, sviluppiamo, integriamo e governiamo sistemi di Intelligenza Artificiale per le aziende.",
    knowsAbout: [
      "AI Governance",
      "AI Act",
      "Intelligenza Artificiale aziendale",
      "Architetture AI",
      "RAG",
      "Agenti AI",
      "AI Literacy",
      "Machine Learning",
      "Large Language Models",
    ],
    sameAs: ["https://www.linkedin.com/company/pynkstudio", "https://www.instagram.com/pynkstudios"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "technical consulting",
      email: "info@pynkstudio.it",
      telephone: "+39 351 3768607",
      areaServed: "IT",
      availableLanguage: ["it"],
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${PYNK_ORIGIN}${item.path}`,
    })),
  };
}

export function serviceSchema(name: string, description: string, path: string, serviceType: string | string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${PYNK_ORIGIN}${path}`,
    provider: {
      "@type": "Organization",
      name: "PYNK STUDIO",
      url: PYNK_ORIGIN,
    },
    areaServed: "Italia",
    serviceType,
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Aziende e decision maker che adottano sistemi di Intelligenza Artificiale",
    },
  };
}

// OfferCatalog dei servizi AI Governance: comunica a Google la gamma di servizi
// offerti, utile per rich result e per la comprensione dell'entità.
export function offerCatalogSchema(
  catalogName: string,
  services: Array<{ name: string; description: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: catalogName,
    url: `${PYNK_ORIGIN}/ai-governance`,
    itemListElement: services.map((service, index) => ({
      "@type": "Offer",
      position: index + 1,
      itemOffered: {
        "@type": "Service",
        name: service.name,
        description: service.description,
        url: `${PYNK_ORIGIN}${service.path}`,
        provider: { "@type": "Organization", name: "PYNK STUDIO", url: PYNK_ORIGIN },
      },
    })),
  };
}

// ItemList degli articoli del blog: aiuta Google a capire la collezione e i pillar.
export function itemListSchema(name: string, items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${PYNK_ORIGIN}${item.path}`,
    })),
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
}) {
  const url = `${PYNK_ORIGIN}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: input.image ?? DEFAULT_OG_IMAGE,
    datePublished: input.publishedTime ?? PYNK_ARTICLE_PUBLISHED,
    dateModified: input.modifiedTime ?? PYNK_ARTICLE_MODIFIED,
    author: { "@type": "Organization", name: "PYNK STUDIO", url: PYNK_ORIGIN },
    publisher: organizationSchema(),
    articleSection: "AI Governance",
    inLanguage: "it-IT",
    ...(input.keywords && input.keywords.length > 0 ? { keywords: input.keywords.join(", ") } : {}),
  };
}

export function faqSchema(faq: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
