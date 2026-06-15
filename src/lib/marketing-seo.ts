import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n/locales";

export const MENUARY_ORIGIN = "https://menuary.it";
export const BIZERY_ORIGIN = "https://bizery.it";
export const ORPHEO_ORIGIN = "https://weuseorpheo.com";

export const MENUARY_MARKETING_DESCRIPTION =
  "Menuary crea siti web per ristoranti, bar, pizzerie, trattorie e locali: menu digitale, prenotazioni online, ordini, recensioni Google e gestione semplice.";

export const BIZERY_MARKETING_DESCRIPTION =
  "Bizery crea siti web per studi medici, saloni di bellezza, barbieri, studi legali, commercialisti e aziende di servizi: appuntamenti online, listino digitale, CRM e Google Maps.";

export const ORPHEO_MARKETING_DESCRIPTION =
  "Orpheo crea siti e strumenti gestionali per artisti, autori, musicisti, attori, registi e professionisti creativi: press kit, catalogo opere, booking, diritti, recensioni e fanbase.";

export const MENUARY_KEYWORDS = [
  "siti web per ristoranti",
  "sito per ristorante",
  "siti per pizzerie",
  "siti per bar",
  "siti per trattorie",
  "menu digitale ristorante",
  "prenotazioni online ristorante",
  "ordini online ristorante",
  "gestionale ristorante",
  "Google Maps ristoranti",
  "Menuary",
];

export const BIZERY_KEYWORDS = [
  "siti web per attività",
  "siti web per studi medici",
  "siti web per saloni di bellezza",
  "siti web per barbieri",
  "siti web per studi legali",
  "siti web per commercialisti",
  "sito per azienda di servizi",
  "prenotazioni online appuntamenti",
  "listino servizi online",
  "CRM aziende servizi",
  "Google Maps aziende",
  "Bizery",
];

export const ORPHEO_KEYWORDS = [
  "siti web per artisti",
  "sito per autore",
  "sito per musicista",
  "sito per attore",
  "sito per regista",
  "press kit artista",
  "catalogo opere artista",
  "booking artisti",
  "gestione diritti royalty",
  "recensioni Amazon Goodreads IMDb",
  "Orpheo",
];

export const MARKETING_ROUTES = ["", "/chi-siamo", "/pricing", "/contatti"] as const;

type Brand = "menuary" | "bizery" | "orpheo";

export function brandOrigin(brand: Brand): string {
  if (brand === "orpheo") return ORPHEO_ORIGIN;
  return brand === "bizery" ? BIZERY_ORIGIN : MENUARY_ORIGIN;
}

export function localizedPath(path: string, locale: AppLocale): string {
  if (locale === "it") return path || "/";
  return `/${locale}${path}`;
}

export function marketingLanguageAlternates(origin: string, path = ""): Record<string, string> {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      `${origin}${localizedPath(path, locale) === "/" ? "" : localizedPath(path, locale)}`,
    ]),
  );
}

/**
 * Canonical auto-referenziante per locale + cluster hreflang completo.
 * Ogni variante di lingua deve puntare il canonical a sé stessa (non all'italiano),
 * altrimenti Google consolida tutte le lingue sulla sola italiana e le altre
 * restano "rilevate ma non indicizzate". x-default e hreflang="it" puntano al
 * path nudo (servito a 200 anche ai crawler dal middleware).
 */
export function marketingAlternates(origin: string, path: string, locale: AppLocale) {
  const self = localizedPath(path, locale);
  return {
    canonical: `${origin}${self === "/" ? "" : self}`,
    languages: {
      ...marketingLanguageAlternates(origin, path),
      "x-default": `${origin}${path}`,
    },
  };
}

export function marketingSitemap(origin: string): MetadataRoute.Sitemap {
  const now = new Date();
  return MARKETING_ROUTES.flatMap((path) =>
    SUPPORTED_LOCALES.map((locale) => {
      const publicPath = localizedPath(path, locale);
      return {
        url: `${origin}${publicPath === "/" ? "" : publicPath}`,
        lastModified: now,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/pricing" ? 0.9 : 0.8,
        alternates: {
          languages: {
            ...marketingLanguageAlternates(origin, path),
            "x-default": `${origin}${path}`,
          },
        },
      } satisfies MetadataRoute.Sitemap[number];
    }),
  );
}

export function marketingOrganizationSchema(brand: Brand) {
  const isBizery = brand === "bizery";
  const isOrpheo = brand === "orpheo";
  const origin = brandOrigin(brand);
  const name = isOrpheo ? "Orpheo" : isBizery ? "Bizery" : "Menuary";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: origin,
    logo: `${origin}/logo-payoff.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      areaServed: ["IT", "FR", "DE", "ES", "PT", "NL", "BE", "AT", "CH", "IE"],
      availableLanguage: ["it", "en", "fr", "de", "es", "pt"],
    },
    sameAs: isOrpheo ? [] : isBizery ? [MENUARY_ORIGIN] : [BIZERY_ORIGIN],
  };
}

export function marketingWebsiteSchema(brand: Brand) {
  const isBizery = brand === "bizery";
  const isOrpheo = brand === "orpheo";
  const origin = brandOrigin(brand);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: isOrpheo ? "Orpheo" : isBizery ? "Bizery" : "Menuary",
    url: origin,
    inLanguage: ["it", "en", "fr", "de", "es"],
    description: isOrpheo ? ORPHEO_MARKETING_DESCRIPTION : isBizery ? BIZERY_MARKETING_DESCRIPTION : MENUARY_MARKETING_DESCRIPTION,
  };
}

export function marketingServiceSchema(brand: Brand) {
  const isBizery = brand === "bizery";
  const isOrpheo = brand === "orpheo";
  const origin = brandOrigin(brand);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isOrpheo
      ? "Siti web e piattaforma digitale per artisti e professionisti creativi"
      : isBizery
      ? "Siti web e piattaforma digitale per aziende di servizi"
      : "Siti web e piattaforma digitale per ristoranti",
    provider: {
      "@type": "Organization",
      name: isOrpheo ? "Orpheo" : isBizery ? "Bizery" : "Menuary",
      url: origin,
    },
    areaServed: ["Italia", "Francia", "Germania", "Spagna", "Portogallo", "Svizzera", "Belgio"],
    serviceType: isOrpheo
      ? [
          "Siti web per artisti",
          "Press kit per autori e musicisti",
          "Catalogo opere creativo",
          "Booking artisti",
          "Gestione diritti e royalty",
          "Reputation e recensioni provider",
        ]
      : isBizery
      ? [
          "Siti web per studi medici",
          "Siti web per saloni di bellezza",
          "Siti web per barbieri",
          "Siti web per studi legali",
          "Siti web per commercialisti",
          "Prenotazioni online per aziende di servizi",
        ]
      : [
          "Siti web per ristoranti",
          "Siti web per pizzerie",
          "Siti web per bar",
          "Menu digitale",
          "Prenotazioni online per ristoranti",
          "Ordini online per locali",
        ],
    audience: {
      "@type": "BusinessAudience",
      audienceType: isOrpheo
        ? "Artisti, autori, musicisti, cantanti, attori, registi, collettivi e professionisti creativi"
        : isBizery
        ? "Studi professionali, saloni, barbieri, studi medici, studi legali, commercialisti e aziende di servizi"
        : "Ristoranti, bar, pizzerie, trattorie, bistrot e locali food",
    },
    url: origin,
  };
}

export function marketingFaqSchema(brand: Brand) {
  const isBizery = brand === "bizery";
  const isOrpheo = brand === "orpheo";
  const questions = isOrpheo
    ? [
        [
          "Orpheo è pensato per artisti, autori e professionisti creativi?",
          "Sì. Orpheo è il vertical creativo per artisti, autori, musicisti, attori, registi, collettivi e team che devono gestire presenza, opere, booking, diritti, recensioni e fanbase.",
        ],
        [
          "Orpheo include recensioni Amazon, Goodreads, IMDb o altri provider?",
          "Sì. Il modulo Reputation & Reviews è progettato per aggregare provider rilevanti, usando integrazioni ufficiali, import controllati e metriche aggregate quando necessario.",
        ],
        [
          "Orpheo è un servizio dedicato o un sito generico adattato?",
          "Orpheo è un servizio dedicato ai professionisti creativi: struttura, moduli e flussi sono pensati per presenza pubblica, opere, booking, materiali, diritti e fanbase.",
        ],
      ]
    : isBizery
    ? [
        [
          "Bizery realizza siti web per studi medici, saloni, barbieri e professionisti?",
          "Sì. Bizery è pensato per attività di servizi: studi medici, saloni di bellezza, barbieri, studi legali, commercialisti, consulenti, centri benessere e attività con appuntamenti.",
        ],
        [
          "Il sito include prenotazioni online e gestione degli appuntamenti?",
          "Sì. I piani Bizery possono includere appuntamenti online, listino servizi, CRM, gestione staff, recensioni e sincronizzazione della presenza locale.",
        ],
        [
          "Bizery lavora anche fuori dall'Italia?",
          "Sì. Bizery supporta mercati e lingue europee, con siti multilingua e impostazioni locali per presenza digitale e comunicazioni.",
        ],
      ]
    : [
        [
          "Menuary realizza siti web per ristoranti, bar e pizzerie?",
          "Sì. Menuary è pensato per ristoranti, bar, pizzerie, trattorie e locali food che vogliono sito, menu digitale, prenotazioni, ordini e gestione Google in un unico sistema.",
        ],
        [
          "Il sito ristorante include menu digitale e prenotazioni online?",
          "Sì. Menuary può includere menu digitale, prenotazioni tavoli, ordini online o al tavolo, recensioni, galleria e aggiornamenti da pannello.",
        ],
        [
          "Menuary lavora anche fuori dall'Italia?",
          "Sì. Menuary supporta mercati e lingue europee, con siti multilingua e contenuti adatti al pubblico locale e turistico.",
        ],
      ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(([name, text]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: {
        "@type": "Answer",
        text,
      },
    })),
  };
}
