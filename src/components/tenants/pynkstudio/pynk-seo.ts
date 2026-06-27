import type { Metadata } from "next";
import { PYNK_ORIGIN } from "./ai-governance-data";

type PynkMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function pynkMetadata({ title, description, path }: PynkMetadataInput): Metadata {
  const url = `${PYNK_ORIGIN}${path}`;
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "PYNK STUDIO",
      locale: "it_IT",
      type: "website",
      images: [{ url: `${PYNK_ORIGIN}/pynkstudio/pynk-logo-transparent.png`, alt: "PYNK STUDIO" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${PYNK_ORIGIN}/pynkstudio/pynk-logo-transparent.png`],
    },
    alternates: {
      canonical: url,
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PYNK STUDIO",
    url: PYNK_ORIGIN,
    logo: `${PYNK_ORIGIN}/pynkstudio/pynk-logo-transparent.png`,
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
      audienceType: "Aziende che adottano sistemi di Intelligenza Artificiale",
    },
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
