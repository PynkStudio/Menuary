// Motore "Componi il tuo piatto": una ricetta descrive il piatto, il motore
// calcola stato, prezzo e validazione, lo stage lo disegna. I dati (ricette,
// prezzi, immagini) appartengono al tenant: il modulo non ne contiene.

/** Testo semplice o tradotto per lingua: `"Funghi"` oppure `{ it: "Funghi", en: "Mushrooms" }`. */
export type DishText = string | Partial<Record<string, string>>;

export type DishLayout =
  /** Vista dall'alto, pezzi sparsi su un disco (pizza, focaccia, piadina). */
  | "disc"
  /** Vista laterale, strati impilati in ordine di scelta (burger, panino, club). */
  | "stack"
  /** Vista dall'alto, ogni ingrediente occupa un settore della ciotola (poke, insalata, bowl). */
  | "bowl"
  /** Vista dall'alto, nido di pasta su piatto con condimenti sopra (pasta, risotto). */
  | "nest";

export type DishArtShape =
  | "round-slice" // salame, pomodoro, zucchina a rondelle
  | "chunk" // mozzarella, feta, pezzi irregolari
  | "leaf" // basilico, rucola, lattuga
  | "ring" // cipolla, peperoncino a anelli
  | "dot" // olive, mais, capperi, piselli
  | "cube" // tonno, salmone, tofu
  | "strip" // bacon, prosciutto, peperoni a striscia
  | "shred" // grana, carote julienne, cavolo
  | "crumb" // granella, sesamo, pangrattato
  | "drizzle" // salse a filo: olio piccante, teriyaki, crema
  | "spread" // strato di salsa spalmata (burger, base)
  | "patty" // hamburger, cotoletta
  | "cheese-slice" // fetta di formaggio che cola
  | "egg" // uovo, burrata
  | "wedge"; // spicchi: avocado, lime, patate

export type DishArt = {
  shape: DishArtShape;
  /** Colore principale (qualsiasi colore CSS). */
  color: string;
  /** Colore di dettaglio (bordo, venature, semi). */
  accent?: string;
  /**
   * Ritaglio PNG/WebP con trasparenza fornito dal tenant. Se presente sostituisce la forma
   * vettoriale sia nello stage sia nella tessera: è il modo per ottenere il look fotografico.
   */
  image?: string;
  /** Pezzi per porzione nella vista dall'alto. Default dipende dalla forma. */
  count?: number;
  /** Moltiplicatore di grandezza del pezzo. Default 1. */
  size?: number;
};

export type DishIngredient = {
  id: string;
  name: DishText;
  /** Testo della scheda dettagli (origine, stagionatura, lavorazione…). */
  description?: DishText;
  /** Etichette brevi mostrate in scheda: "Piccante", "DOP", "Vegano"… */
  badges?: DishText[];
  /** Foto grande per la scheda dettagli; se assente si usa `art.image` o il disegno. */
  detailImage?: string;
  /** Prezzo di una porzione in euro. */
  price: number;
  art: DishArt;
  /** Porzioni massime per questo ingrediente. Default 2 ("doppio"). */
  maxPortions?: number;
  /** Allergeni (testo libero o tradotto, es. "latte", "glutine"). */
  allergens?: DishText[];
  /** Se false la tessera appare ma non e' selezionabile (esaurito). */
  available?: boolean;
};

export type DishGroup = {
  id: string;
  label: DishText;
  ingredients: DishIngredient[];
  /** Porzioni minime richieste nel gruppo (es. almeno una proteina). */
  min?: number;
  /** Porzioni massime nel gruppo (contano anche i doppi). */
  max?: number;
  /** Testo d'aiuto sotto il titolo del gruppo. */
  hint?: DishText;
};

export type DishBaseArt = {
  /** Impasto, pane, piatto, ciotola. */
  primary: string;
  /** Salsa di base, riso, pasta. */
  secondary?: string;
  /** Dettagli (bruciature del cornicione, sesamo del pane, bordo del piatto). */
  tertiary?: string;
  /** Ritaglio fotografico della base: sostituisce il disegno vettoriale. */
  image?: string;
};

export type DishChoiceOption = {
  id: string;
  label: DishText;
  /** Etichetta breve per i controlli compatti (es. "M"). */
  shortLabel?: DishText;
  /**
   * Variante del prodotto di listino a cui corrisponde (es. `small`/`large` di un prezzo a volume):
   * finisce nella riga carrello come `variantKey`, cosi' cucina e cassa vedono la taglia giusta.
   */
  cartVariant?: { key: string; label: DishText };
  priceDelta?: number;
  /** Sovrascrive i colori/immagine della base (es. pizza bianca, riso venere). */
  baseArt?: Partial<DishBaseArt>;
  /** Scala del piatto nello stage (es. taglia S/M/L). */
  scale?: number;
  /** Moltiplica il prezzo degli ingredienti (es. taglia L = 1.5). Default 1. */
  ingredientPriceFactor?: number;
};

export type DishChoice = {
  id: string;
  label: DishText;
  options: DishChoiceOption[];
  defaultOptionId: string;
};

export type DishRecipe = {
  id: string;
  /** Nome del prodotto in carrello, es. "Pizza componibile". */
  name: DishText;
  /** Titolo mostrato, es. "Componi la tua pizza". */
  title: DishText;
  /** Sottotitolo sotto il titolo (es. "Parti dalla Margherita"). */
  subtitle?: DishText;
  /** Etichetta del totale, es. "La tua pizza". */
  totalLabel?: DishText;
  /** Lingua dei testi che arrivano in cucina e in cassa (riga carrello). Default "it". */
  kitchenLocale?: string;
  /** Immagine di copertina per l'ingresso dal menu. */
  coverImage?: string;
  /** Tema specifico della ricetta, sopra quello passato al componente. */
  theme?: DishTheme;
  layout: DishLayout;
  basePrice: number;
  baseArt: DishBaseArt;
  choices?: DishChoice[];
  groups: DishGroup[];
  /** Porzioni totali massime sul piatto. */
  maxTotalPortions?: number;
  /** Ingredienti gia' presenti all'apertura (es. pizza del menu da modificare). */
  initialPicks?: string[];
  /**
   * Porzioni incluse nel prezzo base: la prima porzione di questi ingredienti non si paga.
   * Serve per partire da una pizza del listino ("Diavola") e far pagare solo le aggiunte.
   */
  includedPicks?: string[];
  /** ID del prodotto nel listino, per collegare la riga carrello al menu. */
  menuItemId?: string;
  categoryId?: string;
};

/**
 * Personalizzazione completa per tenant. Tutto finisce in variabili CSS `--db-*` sul
 * contenitore: si puo' passare qui oppure scrivere nel CSS del tenant su `[data-dish-builder]`.
 * Ogni elemento ha anche `data-part="..."` per restyling piu' profondi dal CSS del tenant.
 */
export type DishTheme = {
  colors?: Partial<{
    bg: string;
    surface: string;
    surface2: string;
    ink: string;
    muted: string;
    line: string;
    accent: string;
    accentInk: string;
    selected: string;
    price: string;
    glow: string;
    danger: string;
  }>;
  fonts?: { display?: string; body?: string };
  /** Raggio delle tessere e dei pannelli (CSS, es. "18px"). */
  radius?: string;
  /** Sfondo dell'intero configuratore: colore, gradiente o `url(...)`. */
  background?: string;
  /** Sfondo dietro il piatto (tagliere, tovaglia, bancone…). */
  stageBackground?: string;
  /** Sfondo delle tessere ingrediente. */
  tileBackground?: string;
  /** Alone luminoso dietro il piatto. Default true. */
  glow?: boolean;
  /** Larghezza massima del piatto in px. */
  stageMaxWidth?: number;
};

export type DishState = {
  choices: Record<string, string>;
  /** Ingredienti in ordine di aggiunta; un id ripetuto e' una porzione in piu'. */
  picks: string[];
};

/** Perche' un ingrediente non si puo' aggiungere: il testo lo compone la UI nella lingua del cliente. */
export type DishBlock =
  | { code: "unknown" }
  | { code: "unavailable"; ingredientId: string }
  | { code: "maxPortions"; ingredientId: string; max: number }
  | { code: "groupMax"; groupId: string; max: number }
  | { code: "totalMax"; max: number };

export type DishIssue = { code: "groupMin"; groupId: string; min: number };

/** Composizione allegata alla riga carrello: il server la ricalcola prima di accettare l'ordine. */
export type DishLinePayload = {
  recipeId: string;
  choices: Record<string, string>;
  picks: string[];
};
