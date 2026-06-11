/** Voci portfolio PYNK STUDIO mostrate in /lavori e in anteprima home. */

export type PynkPortfolioKind = "platform" | "web" | "game" | "tool" | "mobile" | "desktop";

export type PynkPortfolioItem = {
  id: string;
  title: string;
  kind: PynkPortfolioKind;
  descriptionPlain: string;
  descriptionNerd: string;
  stack: readonly string[];
  href?: string;
  /** Icona app per card mobile (TestFlight) */
  cardImage?: string;
  /** Nota sotto la card quando non c'è href (es. work in progress) */
  statusNote?: string;
};

export const pynkPortfolioItems: PynkPortfolioItem[] = [
  {
    id: "menuary",
    title: "Menuary",
    kind: "platform",
    descriptionPlain:
      "Piattaforma multi-tenant per ristoranti, bar e pizzerie: sito su misura, menu digitale, prenotazioni, ordini e gestionale, tutto su un'unica infrastruttura.",
    descriptionNerd:
      "Verticale food della piattaforma multi-tenant: Next.js App Router, isolamento per tenant via feature-flag, middleware di routing host-based, Supabase + RLS, SEO/i18n e gestionale modulare.",
    stack: ["Next.js", "TypeScript", "Supabase", "Multi-tenant"],
    href: "https://menuary.it",
  },
  {
    id: "bizery",
    title: "Bizery",
    kind: "platform",
    descriptionPlain:
      "Verticale per studi, saloni e aziende di servizi: sito professionale, listino servizi, appuntamenti e presenza digitale gestita in un posto solo.",
    descriptionNerd:
      "Sotto-brand services della piattaforma: stesso core multi-tenant di Menuary, copy e moduli adattati ai servizi, dominio e identità proprie, auth cross-domain via popup.",
    stack: ["Next.js", "TypeScript", "Supabase", "Multi-tenant"],
    href: "https://bizery.it",
  },
  {
    id: "orpheo",
    title: "Orpheo",
    kind: "platform",
    descriptionPlain:
      "Verticale per artisti e professionisti creativi: press kit, catalogo opere, booking, diritti e fanbase in un'unica piattaforma.",
    descriptionNerd:
      "Verticale creative della piattaforma: moduli press kit, works catalog, creative booking, rights/royalties e fanbase, costruiti sullo stesso core multi-tenant.",
    stack: ["Next.js", "TypeScript", "Supabase", "Multi-tenant"],
    href: "https://weuseorpheo.com",
  },
  {
    id: "perx",
    title: "PerX",
    kind: "desktop",
    descriptionPlain:
      "Gestionale desktop per studi peritali: pratiche di sinistro in ordine e con approccio proattivo, meno errori e contestazioni, tempi di gestione più contenuti, qualità più alta su periziale e processo.",
    descriptionNerd:
      "Client desktop sul dominio sinistri/perizie: workflow guidati, controlli incrociati, stati e integrazioni con portali e documentale; fuori dal browser per chi lavora tutto il giorno sul gestionale.",
    stack: ["Desktop", "TypeScript", "Workflow"],
    href: "https://perx.it",
  },
  {
    id: "catdispatcher",
    title: "CAT Dispatcher",
    kind: "tool",
    descriptionPlain:
      "Per studi peritali: coordina sul territorio le attività CAT con logiche chiare e, dove serve, automazioni su assegnazioni e comunicazioni. Il sito presenta il prodotto; l'uso dell'applicazione è riservato a utenti autorizzati.",
    descriptionNerd:
      "Dominio CAT con mappa e ruoli (periti, enti, priorità, stati). React, Supabase, notifiche e viste operative in tempo reale; autenticazione per l'area applicativa.",
    stack: ["React", "Vite", "TypeScript", "Supabase", "Mappe"],
    href: "https://catdispatcher.it",
  },
  {
    id: "bite-project",
    title: "BITE Project",
    kind: "web",
    descriptionPlain:
      "Sito del progetto narrativo a bordo della barca a vela S/Y Spritz: vita in mare, refit, lavoro da remoto, slow travel e scelte di vita consapevoli.",
    descriptionNerd:
      "Esperienza editoriale long-form, immagini e capitoli da viaggio; stack web moderno, SEO e performance per lettura immersiva.",
    stack: ["React", "TypeScript", "Content"],
    href: "https://biteproject.it",
  },
  {
    id: "echoes",
    title: "Echoes",
    kind: "web",
    descriptionPlain:
      "Scoperta musicale guidata dall'intelligenza artificiale: descrivi un'emozione, un ricordo o un pensiero e trova brani che ci stanno dentro.",
    descriptionNerd:
      "Web app con orchestrazione LLM + catalogo/metadata musicali, prompt UX e ranking spiegabile lato interfaccia.",
    stack: ["React", "TypeScript", "AI", "API"],
    href: "https://echoesmusic.it",
  },
  {
    id: "godots-journey",
    title: "Godot's Journey",
    kind: "game",
    descriptionPlain:
      "Avventura 3D in lavorazione su Godot: esplorazione, ambienti e personaggi che stiamo costruendo attorno a un'esperienza guidata e cinematografica.",
    descriptionNerd:
      "Godot 4, pipeline 3D, GDScript, scene modulari; focus su camera, input e loop di gameplay coerenti col tono narrativo.",
    stack: ["Godot 4", "GDScript", "3D"],
    statusNote: "In sviluppo.",
  },
  {
    id: "ducks-in-business",
    title: "Ducks in Business",
    kind: "mobile",
    descriptionPlain:
      "Sei una papera imprenditrice: parti dalla prima osteria e costruisci un impero nella ristorazione, tra gestione, crescita e humor.",
    descriptionNerd:
      "Progressione economica e unlock, controlli touch, UI leggere per sessioni brevi; economia e pacing tarati su sessioni da divano.",
    stack: ["iOS", "Swift", "Game design"],
    href: "https://testflight.apple.com/join/2Myk6uNY",
    cardImage: "/pynkstudio/ducks-in-business-icon.png",
  },
  {
    id: "tocca-a-te",
    title: "Tocca a Te",
    kind: "mobile",
    descriptionPlain:
      "Casual game pensato per stare insieme: turni veloci, regole semplici, ideale per giocare con gli amici offline nello stesso spazio.",
    descriptionNerd:
      "Hot-seat e pass-and-play, regole leggere, core loop giocabile senza backend: pensato per sale e tavoli con un solo dispositivo.",
    stack: ["iOS", "Casual", "Multigiocatore locale"],
    href: "https://testflight.apple.com/join/Q5uuDAGe",
    cardImage: "/pynkstudio/tocca-a-te-icon.png",
  },
];

const HOME_PREVIEW_COUNT = 3;

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Anteprima home: estrae `count` voci a caso dal pool completo (ogni mount = nuovo mazzo). */
export function pickPynkPortfolioPreview(count = HOME_PREVIEW_COUNT): PynkPortfolioItem[] {
  const n = Math.min(count, pynkPortfolioItems.length);
  if (n <= 0) return [];
  return shuffle(pynkPortfolioItems, Math.random).slice(0, n);
}
