import { voHref, voRoute, VALENTINA_TENANT_ID, type VoRoute } from "@/components/tenants/valentina-orciuoli/routes";
import { findTenantById } from "@/lib/tenant-registry";

/**
 * Il sito è un libro: ogni route pubblica corrisponde a una *doppia pagina* (spread).
 * L'ordine di questo array È l'ordine delle pagine nel volume — cambiarlo cambia
 * il numero di fogli che separano due sezioni, quindi anche l'animazione di salto.
 *
 * Le opere non hanno più una pagina a testa: il volume le raccoglie per collana,
 * perché è così che si leggono. La trilogia sta tutta su una doppia pagina — i due
 * volumi usciti e l'annuncio del terzo — e il thriller, che appartiene a un'altra
 * storia, ne ha una sua. Una pagina per libro faceva sembrare "Tra fumo e ombre"
 * il quarto capitolo di una saga a cui non appartiene.
 */
export type VoSpreadKind = "static";

export type VoSpread = {
  id: string;
  kind: VoSpreadKind;
  /** Path della pagina, senza prefisso host né lingua: "" è la home. */
  path: string;
  navLabel: string;
  /** Testatina corrente stampata in cima alle pagine. */
  runningHead: string;
  /** Solo le sezioni compaiono nel menu; le altre pagine si raggiungono sfogliando. */
  inNav: boolean;
};

/** Le sezioni del volume. */
export type VoStaticSpreadId =
  | "home"
  | "libri"
  | "trilogia"
  | "thriller"
  | "eventi"
  | "blog"
  | "contatti";

/**
 * Il taccuino è una pagina del volume solo quando il modulo blog è acceso per il
 * tenant. Spento, la sua doppia pagina non esiste proprio: sfogliando non la si
 * incontra, il menu non la nomina e la rilegatura si accorcia di un foglio.
 * Riaccendere il flag la rimette al suo posto, dopo gli eventi.
 */
const blogInVolume = Boolean(findTenantById(VALENTINA_TENANT_ID)?.features.blog);

const blogSpread: VoSpread = {
  id: "blog",
  kind: "static",
  path: "/blog",
  navLabel: "Dal taccuino",
  runningHead: "Dal taccuino",
  inNav: true,
};

export const voSpreads: readonly VoSpread[] = [
  { id: "home", kind: "static", path: "", navLabel: "Home", runningHead: "Frontespizio", inNav: true },
  { id: "libri", kind: "static", path: "/libri", navLabel: "Libri", runningHead: "Le opere", inNav: true },
  {
    id: "trilogia",
    kind: "static",
    path: "/trilogia",
    navLabel: "The Emotion Dragons Trilogy",
    runningHead: "The Emotion Dragons Trilogy",
    inNav: false,
  },
  {
    id: "thriller",
    kind: "static",
    path: "/thriller",
    navLabel: "Thriller psicologico",
    runningHead: "Thriller psicologico",
    inNav: false,
  },
  { id: "eventi", kind: "static", path: "/eventi", navLabel: "Eventi", runningHead: "Calendario", inNav: true },
  ...(blogInVolume ? [blogSpread] : []),
  { id: "contatti", kind: "static", path: "/contatti", navLabel: "Contatti", runningHead: "Scrivimi", inNav: true },
];

export const voSpreadCount = voSpreads.length;

/** Gli id che il router del tenant deve riconoscere come pagine del libro. */
export const voSpreadSegments = voSpreads
  .filter((spread) => spread.id !== "home")
  .map((spread) => spread.id);

/**
 * "Chi sono" non è una pagina: è la quarta di copertina. Vive fuori dalla sequenza
 * degli spread perché per mostrarla il volume deve prima chiudersi e poi rigirarsi.
 */
export const voBackCover = {
  path: "/autrice",
  navLabel: "Chi sono",
} as const;

export function isBackCoverPathname(pathname: string | null | undefined) {
  if (!pathname) return false;
  return voRoute(pathname).path === voBackCover.path;
}

export function backCoverHref(route: VoRoute) {
  return voHref(voBackCover.path, route);
}

/**
 * L'appendice: note legali in fondo al volume.
 *
 * Non sta nella sequenza degli spread di proposito — sfogliando non ci si finisce
 * mai dentro, esattamente come in un libro non si incappa nel colophon leggendo.
 * Ci si arriva solo dai richiami nel piede, e da lì si torna alla lettura.
 */
export type VoAppendixId = "privacy" | "cookie" | "errata";

export type VoAppendix = {
  id: VoAppendixId;
  path: string;
  navLabel: string;
  runningHead: string;
};

export const voAppendix: readonly VoAppendix[] = [
  {
    id: "privacy",
    path: "/privacy",
    navLabel: "Privacy Policy",
    runningHead: "Note legali",
  },
  {
    id: "cookie",
    path: "/cookie",
    navLabel: "Cookie Policy",
    runningHead: "Note legali",
  },
];

/**
 * L'errata: la pagina che non è mai stata stampata.
 *
 * Sta nell'appendice per la stessa ragione delle note legali — è una posizione
 * virtuale in fondo al volume, fuori dalla sequenza sfogliabile — ma **non** è
 * in `voAppendix`: nessun richiamo la nomina nel piede, perché a un errata non
 * ci si va, ci si finisce. La rende `not-found.tsx` quando la route che manca
 * appartiene a questo tenant, così un indirizzo sbagliato resta dentro il libro
 * invece di sbattere su una schermata di sistema.
 */
export const voErrata: VoAppendix = {
  id: "errata",
  path: "/errata",
  navLabel: "Errata corrige",
  runningHead: "Errata corrige",
};

export function appendixByPathname(pathname: string | null | undefined) {
  if (!pathname) return null;
  const { path } = voRoute(pathname);
  return voAppendix.find((entry) => entry.path === path) ?? null;
}

export function appendixHref(entry: VoAppendix, route: VoRoute) {
  return voHref(entry.path, route);
}

/** `/blog/<slug>`: non è una pagina del volume, è un foglio sulla scrivania. */
export function articleSlugFromPathname(pathname: string | null | undefined) {
  if (!pathname) return null;
  const { path } = voRoute(pathname);
  if (!path.startsWith("/blog/")) return null;
  const slug = path.slice("/blog/".length);
  return slug && !slug.includes("/") ? slug : null;
}

export function articleHref(slug: string, route: VoRoute) {
  return voHref(`/blog/${slug}`, route);
}

export type VoFaceSide = "left" | "right";

export type VoFaceRef = {
  spread: number;
  side: VoFaceSide;
};

/**
 * Il foglio che si gira passando da `spread` a `spread + 1`: il suo recto è la
 * pagina destra di partenza, il suo verso diventa la pagina sinistra d'arrivo.
 */
export function leafFaces(spread: number): { front: VoFaceRef; back: VoFaceRef } {
  return {
    front: { spread, side: "right" },
    back: { spread: spread + 1, side: "left" },
  };
}

/** Un'opera aggiunta solo da gestione non ha una pagina nel volume: va saputo. */
export function hasSpread(id: string) {
  return voSpreads.some((spread) => spread.id === id);
}

export function spreadIndexById(id: string) {
  const index = voSpreads.findIndex((spread) => spread.id === id);
  return index === -1 ? 0 : index;
}

/**
 * true solo per i path che il libro sa impaginare. Serve perché il fallback di
 * `spreadIndexByPathname` è la home: senza questa guardia una route che il libro
 * non conosce — per esempio un appunto sulla scrivania — verrebbe scambiata per
 * il frontespizio, e lo shell riscriverebbe l'URL portando via dalla pagina.
 */
export function isBookPathname(pathname: string | null | undefined) {
  if (!pathname) return false;
  const { path } = voRoute(pathname);
  return (
    voSpreads.some((spread) => spread.path === path) ||
    voAppendix.some((entry) => entry.path === path) ||
    path === voBackCover.path
  );
}

export function spreadIndexByPathname(pathname: string | null | undefined) {
  if (!pathname) return 0;
  const { path } = voRoute(pathname);
  const index = voSpreads.findIndex((spread) => spread.path === path);
  return index === -1 ? 0 : index;
}

export function spreadHref(spread: VoSpread, route: VoRoute) {
  return voHref(spread.path, route);
}
