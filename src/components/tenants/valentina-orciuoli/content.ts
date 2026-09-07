/** Pagine statiche proprie del tenant, servite da [previewSlug]/[bookId] — usato anche dal middleware
 * per evitare che questi segmenti vengano dirottati sulle route globali (es. /contatti, /blog food/PynkStudio). */
export const valentinaStaticPageKinds = ["libri", "autrice", "eventi", "contatti", "link", "blog"] as const;
export type ValentinaPageKind = (typeof valentinaStaticPageKinds)[number];

export const amazonHref = "https://www.amazon.it/Anxiety-Valentina-Orciuoli-ebook/dp/B0F1KVZKFC";
export const amazonStoreHref = "https://www.amazon.it/stores/Valentina-Orciuoli/author/B0F1TXYZ27?ref=ap_rdr&shoppingPortalEnabled=true";
export const trilogyHref = "https://www.amazon.it/stores/author/B0F1TXYZ27/allbooks";
export const furyHref = "https://www.amazon.it/Fury-Emotion-Dragons-Trilogy-Vol-ebook/dp/B0GKWCS774";
export const externalLinktreeHref = "https://linktr.ee/valentina.orciuoli";
/** Path interni relativi: il prefisso dipende dall'host e lo mette `voHref()`. */
export const linktreeHref = "/link";
export const instagramHref = "https://www.instagram.com/di.vale_in.peggio/";
export const tiktokHref = "https://www.tiktok.com/@valentina.orciuoli";
export const valentinaEmail = "valentina.orciuoli@weuseorpheo.com";
export const anxietyCoverSrc = "/valentina-orciuoli/anxiety-mockup-standup.png";
export const furyCoverSrc = "https://m.media-amazon.com/images/I/71z2LZ6a8XL.jpg";
export const darkNoirCoverSrc = "/valentina-orciuoli/tra-fumo-e-ombre.webp";
export const authorPortraitSrc = "https://www.selfcreation.it/wp-content/uploads/2024/11/Valentina-Orciuoli.jpg";

export type ValentinaCreativeWork = {
  id: string;
  slug: string;
  title: string;
  description: string;
  secondaryText: string;
  coverImageUrl: string;
  backgroundMediaUrl: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  enabled: boolean;
};

export const valentinaCreativeWorks: ValentinaCreativeWork[] = [
  {
    id: "44acaaba-1814-46ef-923d-a4f50aa11901",
    slug: "anxiety",
    title: "Anxiety",
    description:
      "La nebbia fitta del dubbio, il peso sul petto che toglie il respiro ma costringe a guardarsi dentro con sincerità.",
    secondaryText:
      "Quando non è più possibile mentire a sé stessi, quando il vero combatte per uscire allo scoperto il potere dell'ansia si sprigiona, più feroce che mai.",
    coverImageUrl: anxietyCoverSrc,
    backgroundMediaUrl: "/valentina-orciuoli/sfondo-anxiety.webp",
    ctaLabel: "Leggi la trama",
    ctaHref: amazonHref,
    secondaryCtaLabel: "Porta a casa il libro",
    secondaryCtaHref: amazonHref,
    enabled: true,
  },
  {
    id: "44acaaba-1814-46ef-923d-a4f50aa11902",
    slug: "fury",
    title: "Fury",
    description:
      "Il fuoco improvviso che brucia dentro: una rabbia che può distruggere tutto oppure accendere il coraggio di cambiare.",
    secondaryText:
      "Un secolo prima dell'apparizione del Dragone Nero dell'ansia, il Primo Long era l'incarnazione della rabbia.",
    coverImageUrl: furyCoverSrc,
    backgroundMediaUrl: "/valentina-orciuoli/sfondo-fury-girato.webp",
    ctaLabel: "Leggi la trama",
    ctaHref: furyHref,
    secondaryCtaLabel: "Porta a casa il libro",
    secondaryCtaHref: furyHref,
    enabled: true,
  },
  {
    id: "44acaaba-1814-46ef-923d-a4f50aa11903",
    slug: "tra-fumo-e-ombre",
    title: "Tra fumo e ombre",
    description:
      "Il racconto cambia passo, abbandona i cieli del fantasy e scende nelle crepe più intime della realtà contemporanea.",
    secondaryText:
      "Un thriller psicologico fitto di simboli, indizi sottili e ombre quotidiane. Un'indagine in cui ogni dettaglio è lo specchio della società e ogni pagina mette alla prova le tue certezze.",
    coverImageUrl: darkNoirCoverSrc,
    backgroundMediaUrl: "/valentina-orciuoli/sfondo-dark.webp",
    ctaLabel: "Preordina qui",
    ctaHref: linktreeHref,
    enabled: true,
  },
];

/**
 * Il catalogo è uno, le pagine del volume sono due: la trilogia fantasy e il
 * thriller non stanno sullo stesso foglio. Lo smistamento vive qui e non nel
 * libro, perché dipende dall'opera — e un titolo aggiunto domani in gestione
 * deve sapere da sola in quale delle due sezioni finisce.
 */
export type ValentinaWorkSection = "trilogia" | "thriller";

const TRILOGY_SLUGS = new Set(["anxiety", "fury"]);

export function valentinaWorkSection(slug: string): ValentinaWorkSection {
  return TRILOGY_SLUGS.has(slug) ? "trilogia" : "thriller";
}

/**
 * Il terzo volume non è ancora un libro: non ha ISBN, né copertina, né una
 * riga nel catalogo di gestione. Sta comunque nella pagina della trilogia,
 * perché una trilogia con due volumi non si capisce — ed è l'annuncio che
 * tiene il posto.
 */
export const valentinaUpcomingVolume = {
  title: "Il Terzo Canto",
  description: "La trilogia troverà presto il suo compimento.",
  state: "In arrivo",
} as const;

export const valentinaLinks = [
  {
    label: "Sito",
    desc: "Home ufficiale di Valentina Orciuoli.",
    href: "",
    kind: "site",
  },
  {
    label: "Instagram",
    desc: "Aggiornamenti, cover reveal e vita da autrice.",
    href: instagramHref,
    kind: "social",
  },
  {
    label: "TikTok",
    desc: "Video, trend e contenuti per lettrici e lettori.",
    href: tiktokHref,
    kind: "social",
  },
  {
    label: "Contatti",
    desc: "Form, email e canali ufficiali.",
    href: "/contatti",
    kind: "contact",
  },
  {
    label: "Libri",
    desc: "Catalogo libri e pagine d'acquisto.",
    href: "/libri",
    kind: "books",
  },
  {
    label: "Eventi",
    desc: "Presentazioni, firmacopie e nuove date.",
    href: "/eventi",
    kind: "events",
  },
];

export const trilogy: Array<{
  n: string;
  slug?: string;
  volumeLabel?: string;
  title: string;
  desc: string;
  state: string;
  href: string | null;
  coverSrc: string | null;
  coverAlt: string;
}> = [
  {
    n: "I",
    title: "Anxiety",
    desc: "La nebbia fitta del dubbio, il peso sul petto che toglie il respiro ma costringe a guardarsi dentro con sincerità.",
    state: "Disponibile su Kindle",
    href: amazonHref,
    coverSrc: anxietyCoverSrc,
    coverAlt: "Copertina di Anxiety di Valentina Orciuoli",
  },
  {
    n: "II",
    title: "Fury",
    desc: "Il fuoco improvviso che brucia dentro: una rabbia che può distruggere tutto oppure accendere il coraggio di cambiare.",
    state: "Disponibile su Kindle",
    href: furyHref,
    coverSrc: furyCoverSrc,
    coverAlt: "Copertina di Fury di Valentina Orciuoli",
  },
  {
    n: "III",
    title: "Il Terzo Canto",
    desc: "La trilogia troverà presto il suo compimento.",
    state: "In arrivo",
    href: null,
    coverSrc: null,
    coverAlt: "",
  },
];

/**
 * Tutti i segmenti di primo livello che appartengono al tenant: le sezioni fisse
 * più una pagina per ogni opera. Il middleware lo usa per non dirottare questi
 * path sulle route globali della piattaforma.
 *
 * Sta in fondo al file perché ha bisogno di `valentinaCreativeWorks`, che è
 * dichiarato sopra.
 */
export const valentinaOwnedSegments: readonly string[] = [
  ...valentinaStaticPageKinds,
  // Le due sezioni in cui il volume raccoglie le opere.
  "trilogia",
  "thriller",
  ...valentinaCreativeWorks.map((work) => work.slug),
  // Le note legali del tenant vivono dentro il libro, non sulle route globali.
  "privacy",
  "cookie",
];
