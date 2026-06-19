import { sortAllergens, type MenuAllergen } from "./allergens";
import {
  LIST_ID_BURGER,
  LIST_ID_CLUB,
  LIST_ID_PIZZA,
} from "./extra-lists";
import { ingList, type MenuIngredient } from "./ingredients";

export type { MenuIngredient } from "./ingredients";

export type { MenuAllergen };

export type PriceFormat =
  | { kind: "single"; value: number }
  | { kind: "sized"; big: number; small: number; defaultKey?: "small" | "big" }
  | { kind: "persone"; per2: number; per4: number; defaultKey?: "per2" | "per4" }
  | {
      kind: "volume";
      small: { label: string; price: number };
      large: { label: string; price: number };
      variants?: Array<{ id: string; label: string; price: number }>;
      defaultKey?: string;
    };

export type BuiltInMenuTag = "firma" | "piccante" | "veg" | "novita";
export type MenuTag = BuiltInMenuTag | (string & {});
export type MenuTagMeta = Record<string, { expiresAt?: string }>;

/** Intensità piccante (tocchi consecutivi su «Piccante» in admin). */
export type PiccanteLevel = 1 | 2 | 3 | 4;

/** Integrazioni di prezzo mostrate sulla scheda prodotto (non nel footer). */
export type MenuServiceNoteKey =
  | "eventi"
  | "aggiunte"
  | "senzaLattosio"
  | "impastoNapoletano";

/** Scelte obbligatorie per menu composti (es. pizza classica + bibita). */
export type MenuBundleSlot = {
  id: string;
  label: string;
  hint?: string;
  /** Categorie da cui attingere le opzioni (nell’ordine mostrato). */
  sourceCategoryIds: string[];
  /** Prodotti specifici selezionabili in questo slot (alternativa o integrazione alle categorie). */
  sourceItemIds?: string[];
};

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: PriceFormat;
  tags?: MenuTag[];
  /** Metadati tag tenant/item: scadenze temporanee, label custom future, ecc. */
  tagMeta?: MenuTagMeta;
  /** Livello piccante se il tag `piccante` è attivo (default in lettura: 1). */
  piccanteLevel?: PiccanteLevel;
  /** Allegati Reg. UE 1169/2011 — Allegato II. */
  allergens?: MenuAllergen[];
  abv?: string;
  image?: string;
  bundleSlots?: MenuBundleSlot[];
  /**
   * Note su integrazioni/prezzi: se omesso si usano i default per categoria
   * (`getMenuServiceNotes`). Array vuoto = nessuna nota sulla scheda.
   */
  serviceNotes?: MenuServiceNoteKey[];
  /** Per pizze/burger/club: voci con id univoci (doppi = stesso name, id diversi, − su ognuna). */
  ingredients?: MenuIngredient[];
  /**
   * Aggiunte a pagamento (categorie abilitate in `menu-service-notes` mostrano anche
   * l’opzione «Senza lattosio» +1 € da codice, senza elencarla qui).
   * Con `extraListId` le voci risolvono dallo store; altrimenti `extras` inline.
   */
  extraListId?: string;
  extras?: MenuExtra[];
  /** Gruppi di varianti a scelta singola (es. tipo di impasto). Con `required: true` il cliente deve scegliere. */
  variantGroups?: MenuVariantGroup[];
};

export type MenuExtra = { id: string; name: string; price: number };

export type MenuVariantGroup = {
  id: string;
  name: string;
  required?: boolean;
  options: { id: string; name: string; price?: number }[];
};

/** Allergeni in ordine Allegato II. */
const ix = (...a: MenuAllergen[]): MenuAllergen[] => sortAllergens(a);

/** Fascia oraria opzionale per categorie servite solo a certi orari (pranzo, cena, aperitivo, …). */
export type MenuAvailability = {
  /** Etichetta breve mostrata in UI (es. "Pranzo", "Cena", "Aperisushi"). */
  label: string;
  /** Giorni della settimana 0-6 (0 = domenica). Se omesso, vale tutti i giorni. */
  days?: number[];
  /** Orario inizio HH:mm (24h). */
  from: string;
  /** Orario fine HH:mm (24h). */
  to: string;
};

export type MenuCategory = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  /** Fascia oraria in cui la categoria è effettivamente servita. */
  availability?: MenuAvailability;
  items: MenuItem[];
};

const s = (value: number): PriceFormat => ({ kind: "single", value });

export const menu: MenuCategory[] = [
  {
    id: "antipasti",
    title: "Antipasti",
    subtitle: "Il modo giusto di cominciare",
    items: [
      {
        id: "pepite-di-pollo",
        name: "Pepite di pollo",
        description: "Straccetti di pollo con panatura ai corn flakes",
        price: s(8),
        allergens: ix("glutine", "uova", "latte", "senape"),
      },
      {
        id: "mortadella-arrosto-barese",
        name: "Mortadella arrosto alla barese",
        description: "Con pistacchio e provolone",
        price: s(6),
        tags: ["firma"],
        allergens: ix("latte", "frutta_guscio", "senape", "solfiti"),
      },
      {
        id: "crudo-alla-barese",
        name: "Crudo alla barese",
        description: "Porzione di prosciutto crudo tagliato a dadini o strisce",
        price: s(6),
        allergens: ix("solfiti"),
      },
      {
        id: "antipasto-italiana",
        name: "Antipasto all'italiana",
        description: "Piatto di prosciutto crudo e nodini",
        price: s(10),
        allergens: ix("latte", "solfiti"),
      },
      {
        id: "tris-alette",
        name: "Tris di alette",
        description:
          "Alette di pollo classiche servite con salsa cheddar, miele e agrodolce",
        price: s(8),
        allergens: ix("glutine", "uova", "latte", "soia", "senape", "sesamo", "solfiti"),
      },
      {
        id: "ribs",
        name: "Ribs",
        description: "Costine di maiale, BBQ, fonduta al cheddar",
        price: s(12),
        allergens: ix("glutine", "latte", "senape", "soia", "solfiti", "frutta_guscio"),
      },
      {
        id: "anelli-di-cipolla",
        name: "Anelli di cipolla",
        description: "Con miele, BBQ e cheddar",
        price: s(6),
        allergens: ix("glutine", "uova", "latte", "senape", "solfiti", "soia", "frutta_guscio"),
      },
      {
        id: "nachos",
        name: "Nachos",
        description: "Con pulled, cheddar fuso e salsa BBQ",
        price: s(8),
        allergens: ix("glutine", "latte", "senape", "soia", "solfiti"),
      },
      {
        id: "parmigiana",
        name: "Parmigiana",
        description:
          "Strati di melanzane fritte, salsa di pomodoro, mozzarella filante e parmigiano, gratinate al forno secondo la tradizione italiana",
        price: s(8),
        tags: ["veg"],
        allergens: ix("glutine", "uova", "latte", "sedano", "solfiti"),
      },
      {
        id: "pepite-patate-dolci-bacon",
        name: "Pepite di pollo con patate dolci e salsa bacon",
        price: s(10),
        allergens: ix("glutine", "uova", "latte", "senape", "solfiti", "soia", "frutta_guscio"),
      },
      {
        id: "pepite-agrodolce",
        name: "Pepite di pollo con salsa agrodolce",
        price: s(10),
        allergens: ix("glutine", "uova", "latte", "soia", "senape", "solfiti", "sesamo"),
      },
      {
        id: "pepite-patatine-ketchup-maio",
        name: "Pepite di pollo con patatine, ketchup e maionese",
        price: s(10),
        allergens: ix("glutine", "uova", "latte", "senape", "solfiti", "soia", "frutta_guscio"),
      },
      {
        id: "pepite-cheddar-bacon",
        name: "Pepite di pollo con salsa cheddar e bacon",
        price: s(10),
        allergens: ix("glutine", "uova", "latte", "senape", "soia", "solfiti", "frutta_guscio"),
      },
      {
        id: "polpettine-agrodolce",
        name: "Polpettine in salsa agrodolce",
        price: s(10),
        allergens: ix("glutine", "uova", "latte", "soia", "sesamo", "senape", "solfiti"),
      },
      {
        id: "polpettine-gouda",
        name: "Polpettine in salsa gouda",
        price: s(10),
        allergens: ix("glutine", "uova", "latte", "senape", "solfiti", "soia"),
      },
      {
        id: "antipasto-della-casa",
        name: "Antipasto della casa",
        description:
          "Crudo alla Barese, polpette cacio e pepe, parmigiana di melanzane, tagliere salumi e formaggi, latticini e nachos con salsa cheddar",
        price: { kind: "persone", per2: 25, per4: 50 },
        tags: ["firma"],
        allergens: ix(
          "glutine",
          "uova",
          "latte",
          "soia",
          "frutta_guscio",
          "arachidi",
          "sesamo",
          "senape",
          "solfiti",
        ),
      },
    ],
  },
  {
    id: "taglieri",
    title: "Taglieri",
    subtitle: "Per condividere, ma senza obbligo",
    items: [
      {
        id: "mix-salumi-formaggi",
        name: "Mix di salumi e formaggi",
        description:
          "Prosciutto crudo di Parma, mortadella al pistacchio, capocollo di Martina Franca, salsiccia sarda, cotto di Praga, grana padano, pecorino sardo e formaggio dolce sardo",
        price: { kind: "persone", per2: 18, per4: 30 },
        allergens: ix("latte", "solfiti", "frutta_guscio", "senape", "glutine", "uova", "soia", "arachidi"),
      },
      {
        id: "stuzzipork",
        name: "Stuzzipork 2.0",
        description:
          "Tris di patate (dippers, dolci, stick), alette di pollo, nachos (pulled, cheddar e BBQ), pop corn di pollo, stick di cheddar fuso e polpette di emmental",
        price: { kind: "persone", per2: 18, per4: 30 },
        tags: ["firma"],
        allergens: ix("glutine", "uova", "latte", "soia", "sesamo", "senape", "frutta_guscio", "solfiti", "arachidi"),
      },
      {
        id: "ciuppapork",
        name: "Ciuppapork 2.0",
        description:
          "Tris di patate (dippers, dolci, stick), pepite di pollo, polpette, stick di cheddar fuso, anelli di cipolla, crocchette mortadella e pistacchio, parmigiana e scamorza, pulled cheddar e BBQ",
        price: { kind: "persone", per2: 18, per4: 30 },
        tags: ["firma"],
        image: "/photos/bombette-fonduta.png",
        allergens: ix(
          "glutine",
          "uova",
          "latte",
          "soia",
          "sesamo",
          "frutta_guscio",
          "senape",
          "solfiti",
          "arachidi",
        ),
      },
    ],
  },
  {
    id: "patate",
    title: "Patate home made",
    subtitle: "Perché due porzioni non bastano mai",
    items: [
      {
        id: "chips-normali",
        name: "Chips normali",
        price: { kind: "sized", big: 6, small: 4.5 },
        allergens: ix("glutine", "senape", "soia", "arachidi", "frutta_guscio", "solfiti", "uova", "latte", "sesamo"),
      },
      {
        id: "chips-cacio-pepe",
        name: "Chips cacio e pepe",
        price: { kind: "sized", big: 6.5, small: 5.5 },
        allergens: ix("glutine", "latte", "uova", "sesamo", "soia", "arachidi", "senape", "solfiti", "frutta_guscio"),
      },
      {
        id: "chips-bacon-cheddar",
        name: "Chips bacon e cheddar",
        price: { kind: "sized", big: 6.5, small: 5.5 },
        image: "/photos/chips-bacon-cheddar.png",
        tags: ["firma"],
        allergens: ix("glutine", "latte", "uova", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
      {
        id: "patate-stick",
        name: "Patate stick",
        price: { kind: "sized", big: 6, small: 4.5 },
        allergens: ix("glutine", "uova", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo", "latte"),
      },
      {
        id: "patate-salsiccia",
        name: "Patate salsiccia sbriciolata e salsa bacon",
        price: { kind: "sized", big: 6.5, small: 5.5 },
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
      {
        id: "patate-polpettine-cheddar",
        name: "Patate e polpettine con cheddar e bacon",
        price: { kind: "sized", big: 6.5, small: 5.5 },
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
      {
        id: "patate-wurstel",
        name: "Patate con wurstel e ketchup",
        price: { kind: "sized", big: 6.5, small: 5.5 },
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
      {
        id: "patate-pulled",
        name: "Patate con pulled pork e salsa BBQ",
        price: { kind: "sized", big: 6.5, small: 5.5 },
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
      {
        id: "patate-dolci-cacio",
        name: "Patate dolci con salsa cacio e pepe",
        price: { kind: "sized", big: 6.5, small: 5.5 },
        allergens: ix("glutine", "latte", "uova", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
      {
        id: "crocchette-mortadella",
        name: "Crocchette con mortadella e pistacchio (2 pz)",
        price: s(6),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
      {
        id: "crocchette-pulled",
        name: "Crocchette con pulled pork, cheddar e BBQ (2 pz)",
        price: s(6),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
      {
        id: "crocchette-parmigiana",
        name: "Crocchette parmigiana e scamorza (2 pz)",
        price: s(6),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
      {
        id: "crocchette-cardoncelli",
        name: "Crocchette cardoncelli e scaglie di grana (2 pz)",
        price: s(6),
        tags: ["veg"],
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
    ],
  },
  {
    id: "club-sandwich",
    title: "Club Sandwich",
    subtitle: "Pane, companatico, niente scuse",
    items: [
      {
        id: "cotto-pork",
        name: "Cotto Pork",
        description:
          "Insalata, misticanza, fiordilatte, pomodori, cotto piastrato e mayo",
        price: s(10),
        ingredients: ingList("cotto-pork", [
          "Pane tostato",
          "Insalata",
          "Misticanza",
          "Fiordilatte",
          "Pomodori",
          "Prosciutto cotto caldo",
          "Maionese",
        ]),
        allergens: ix("glutine", "uova", "latte", "senape", "solfiti", "soia", "arachidi", "sesamo"),
        extraListId: LIST_ID_CLUB,
      },
      {
        id: "pollo-pork",
        name: "Pollo Pork",
        description: "Pollo fritto, uovo sodo, mayo, stracchino e pomodoro",
        price: s(10),
        ingredients: ingList("pollo-pork", [
          "Pane tostato",
          "Pollo fritto in panatura",
          "Uovo sodo",
          "Stracchino",
          "Pomodoro",
          "Maionese",
        ]),
        allergens: ix("glutine", "uova", "latte", "senape", "solfiti", "soia", "arachidi", "sesamo"),
        extraListId: LIST_ID_CLUB,
      },
      {
        id: "pulled-pork-sandwich",
        name: "Pulled Pork",
        description: "Pulled pork, anelli di cipolla e salsa cheddar",
        price: s(10),
        tags: ["firma"],
        ingredients: ingList("pulled-pork-sandwich", [
          "Pane tostato",
          "Pulled pork",
          "Anelli di cipolla fritti",
          "Salsa cheddar",
        ]),
        allergens: ix("glutine", "uova", "latte", "senape", "solfiti", "soia", "arachidi", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_CLUB,
      },
    ],
  },
  {
    id: "terrine",
    title: "Terrine",
    subtitle: "Dalla padella alla tavola, senza passaggi inutili",
    items: [
      {
        id: "polpettosa",
        name: "Polpettosa",
        description: "Terrina di polpette al sugo con fonduta di pecorino",
        price: s(10),
        allergens: ix("glutine", "uova", "latte", "solfiti", "sedano", "senape", "soia", "arachidi"),
      },
      {
        id: "mexicanpork",
        name: "Mexicanpork",
        description:
          "Terrina con 6 bombette, salsa messicana, patate al forno con fonduta di pecorino",
        price: s(10),
        allergens: ix("glutine", "uova", "latte", "solfiti", "soia", "arachidi", "senape", "frutta_guscio", "sesamo"),
      },
      {
        id: "brascio",
        name: "Brascio",
        description: "Terrina di brasciole al sugo",
        price: s(10),
        tags: ["firma"],
        allergens: ix("glutine", "uova", "latte", "solfiti", "arachidi", "senape", "soia", "sesamo"),
      },
      {
        id: "caciopolpette",
        name: "Caciopolpette",
        description:
          "Terrina con polpette della nonna fritte con fonduta di formaggio, cacio e pepe",
        price: s(10),
        image: "/photos/bombette-fonduta.png",
        allergens: ix("glutine", "uova", "latte", "solfiti", "arachidi", "senape", "soia", "sesamo"),
      },
      {
        id: "porkpulled",
        name: "Porkpulled",
        description:
          "Terrina con pulled pork, polpette, cheddar fuso e salsa bacon",
        price: s(10),
        allergens: ix("glutine", "uova", "latte", "solfiti", "arachidi", "senape", "soia", "frutta_guscio", "sesamo"),
      },
      {
        id: "pistacchiosa",
        name: "Pistacchiosa",
        description:
          "Terrina con bombette al pistacchio, fonduta di formaggio e tocchetti di mortadella",
        price: s(10),
        tags: ["firma"],
        allergens: ix("glutine", "uova", "latte", "frutta_guscio", "solfiti", "arachidi", "senape", "soia", "sesamo"),
      },
      {
        id: "misto-terrine",
        name: "Misto Terrine",
        description: "Mix di terrine della casa (3 pz), ideale per 2/4 persone",
        price: s(25),
        allergens: ix(
          "glutine",
          "uova",
          "latte",
          "soia",
          "frutta_guscio",
          "arachidi",
          "sesamo",
          "senape",
          "solfiti",
        ),
      },
    ],
  },
  {
    id: "primi",
    title: "Primi",
    subtitle: "Pasta tirata dritto dalla tradizione",
    items: [
      {
        id: "spaghetti-assassina",
        name: "Spaghetti all'Assassina",
        description:
          "Piatto molto particolare: pasta cotta direttamente in padella con sugo di pomodoro, per un risultato bruciacchiato, croccante e piccante. Spaghetti, sugo di pomodoro, piccante, olio EVO.",
        price: s(10),
        tags: ["firma", "piccante"],
        allergens: ix("glutine", "solfiti", "uova", "arachidi", "sesamo", "soia", "frutta_guscio"),
      },
      {
        id: "carbonara",
        name: "Carbonara",
        description:
          "Primo piatto tipico della tradizione romana preparato con uova, guanciale, pecorino romano e pepe",
        price: s(10),
        allergens: ix("glutine", "uova", "latte", "senape", "arachidi", "soia", "sesamo", "solfiti", "frutta_guscio"),
      },
    ],
  },
  {
    id: "secondi",
    title: "Secondi",
    subtitle: "Qui si mangia sul serio",
    items: [
      {
        id: "mega-stick",
        name: "Mega Stick",
        description:
          "Mega grigliata: il meglio della nostra carne. Tagliata di manzo, costata di maiale, bombette, zampina, wurstel, uovo fritto, patate al forno, verdure grigliate. Consigliato per 4 persone.",
        price: s(50),
        tags: ["firma"],
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
      },
      {
        id: "tagliata-pork",
        name: "Tagliata Pork",
        description:
          "Tagliata di Angus da 300 gr, con contorno di datterino, rucola e grana",
        price: s(18),
        image: "/photos/tagliata-pork.png",
        tags: ["firma"],
        allergens: ix("latte", "solfiti", "arachidi", "senape", "soia", "frutta_guscio", "sesamo", "glutine", "uova"),
      },
      {
        id: "stinco-pork",
        name: "Stinco Pork",
        description: "Stinco di maiale da 200 gr, con patate al forno",
        price: s(12),
        image: "/photos/stinco-pork.png",
        allergens: ix("arachidi", "senape", "solfiti", "soia", "frutta_guscio", "sesamo", "glutine", "uova", "latte"),
      },
      {
        id: "tagliata-pollo",
        name: "Tagliata di pollo",
        description:
          "Tagliata di pollo da 250 gr con verdure grigliate e patate al forno",
        price: s(12),
        allergens: ix("glutine", "uova", "arachidi", "senape", "solfiti", "soia", "frutta_guscio", "sesamo", "latte"),
      },
      {
        id: "angus-pork",
        name: "Angus Pork",
        description:
          "Costata di Angus da 300 gr, con patate al forno, stracciatella e pistacchio",
        price: s(20),
        tags: ["firma"],
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
      },
    ],
  },
  {
    id: "burger",
    title: "The Burger House",
    subtitle: "American Taste — tredici panini, una regola: due mani e nessuna scusa",
    items: [
      {
        id: "the-king-burger",
        name: "The King Burger",
        description:
          "Doppio hamburger smashato, doppio cheddar, doppio bacon, patate dolci, insalata, pomodoro, maionese",
        price: s(15),
        tags: ["firma"],
        image: "/photos/burger-esagerato.png",
        ingredients: ingList("the-king-burger", [
          "Bun al sesamo (pane)",
          { name: "Carne di scottona smash", qty: 2 },
          { name: "Cheddar fuso", qty: 2 },
          { name: "Bacon", qty: 2 },
          "Patate dolci",
          "Insalata",
          "Pomodoro",
          "Maionese",
        ]),
        allergens: ix("glutine", "uova", "latte", "senape", "soia", "arachidi", "solfiti", "sesamo"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "porkaccio",
        name: "Porkaccio 2.0",
        description:
          "Polpette di scottona fritte, pulled, cheddar fuso, crocchè di patate e salsa BBQ",
        price: s(13),
        ingredients: ingList("porkaccio", [
          "Bun (pane)",
          "Polpette scottona fritte in panatura",
          "Pulled pork",
          "Cheddar fuso",
          "Crocchetta di patate",
          "Salsa BBQ",
        ]),
        allergens: ix("glutine", "uova", "latte", "senape", "soia", "arachidi", "sesamo", "solfiti"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "esagerato-pork",
        name: "Esagerato Pork",
        description:
          "Burger di scottona, pulled, briciole di bacon, salsa agrodolce, pepite di pollo, stracciatella",
        price: s(15),
        tags: ["firma"],
        image: "/photos/burger-esagerato.png",
        ingredients: ingList("esagerato-pork", [
          "Bun (pane)",
          "Burger scottona",
          "Pulled pork",
          "Bacon croccante",
          "Pepite di pollo fritte",
          "Salsa agrodolce",
          "Stracciatella",
        ]),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "sesamo"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "affumipork",
        name: "Affumipork",
        description:
          "Burger di scottona, pomodorini confit, misticanza, doppia scamorza affumicata, cipolla caramellata, doppio crudo di Parma, nodini fiordilatte e salsa bacon",
        price: s(13),
        ingredients: ingList("affumipork", [
          "Bun (pane)",
          "Burger scottona",
          "Pomodorini confit",
          "Misticanza",
          { name: "Scamorza affumicata", qty: 2 },
          "Cipolla caramellata",
          { name: "Prosciutto crudo di Parma", qty: 2 },
          "Nodini fiordilatte",
          "Salsa bacon",
        ]),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "sesamo"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "carbonara-pork",
        name: "Carbonara Pork",
        description:
          "Burger di scottona, doppio guanciale, uova strapazzate, pecorino e salsa carbonara",
        price: s(13),
        image: "/photos/burger-porkpistacchio.png",
        ingredients: ingList("carbonara-pork", [
          "Bun (pane)",
          "Burger scottona",
          { name: "Guanciale", qty: 2 },
          "Uova strapazzate",
          "Pecorino",
          "Salsa carbonara",
        ]),
        allergens: ix("glutine", "uova", "latte", "senape", "soia", "arachidi", "sesamo", "solfiti"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "assassina-pork",
        name: "Assassina Pork",
        description:
          "Hamburger di scottona, spaghetti all'Assassina e stracciatella",
        price: s(13),
        tags: ["firma", "piccante"],
        image: "/photos/burger-assassina.png",
        ingredients: ingList("assassina-pork", [
          "Bun (pane)",
          "Hamburger scottona",
          "Spaghetti all'Assassina (sugo piccante)",
          "Stracciatella",
        ]),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "sesamo", "senape", "solfiti", "frutta_guscio"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "godo-pork",
        name: "Godo Pork",
        description:
          "Burger di scottona, parmigiana di melanzane, provola fusa, crocchè di patate e crema di grana",
        price: s(13),
        image: "/photos/burger-godo.png",
        ingredients: ingList("godo-pork", [
          "Bun (pane)",
          "Burger scottona",
          "Parmigiana (melanzane, pomodoro, formaggi)",
          "Provola fusa",
          "Crocchetta di patate",
          "Crema di grana",
        ]),
        allergens: ix("glutine", "uova", "latte", "senape", "soia", "arachidi", "sesamo", "solfiti", "frutta_guscio"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "chicken-pork",
        name: "Chicken Pork",
        description:
          "Burger di pollo fritto, insalata iceberg, pomodoro, doppio bacon, doppio cheddar fuso, maionese",
        price: s(13),
        ingredients: ingList("chicken-pork", [
          "Bun (pane)",
          { name: "Disco pollo fritto in panatura", qty: 2 },
          "Insalata iceberg",
          "Pomodoro",
          { name: "Bacon", qty: 2 },
          { name: "Cheddar fuso", qty: 2 },
          "Maionese",
        ]),
        allergens: ix("glutine", "uova", "latte", "senape", "soia", "arachidi", "sesamo", "solfiti"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "porkpistacchio",
        name: "Porkpistacchio 2.0",
        description:
          "Burger di maialino impanato e fritto, mortadella, stracciatella al provolone, crema di pistacchio",
        price: s(13),
        image: "/photos/burger-porkpistacchio.png",
        tags: ["firma"],
        ingredients: ingList("porkpistacchio", [
          "Bun (pane)",
          "Maialino impanato fritto",
          "Mortadella",
          "Stracciatella",
          "Provolone",
          "Crema di pistacchio",
        ]),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "sesamo", "frutta_guscio"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "crispy-pork",
        name: "Crispy Pork",
        description:
          "Burger di pollo fritto, patate al forno, pulled, anelli di cipolla, salsa crispy",
        price: s(13),
        ingredients: ingList("crispy-pork", [
          "Bun (pane)",
          "Pollo fritto in panatura",
          "Patate al forno",
          "Pulled pork",
          "Anelli di cipolla fritti",
          "Salsa crispy (maionese/condimenti)",
        ]),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "sesamo"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "straccia-pork",
        name: "Straccia Pork",
        description:
          "Burger di scottona, patate al forno, cotto di Praga, stracciatella, crema di pistacchio",
        price: s(13),
        ingredients: ingList("straccia-pork", [
          "Bun (pane)",
          "Burger scottona",
          "Patate al forno",
          "Cotto di Praga",
          "Stracciatella",
          "Crema di pistacchio",
        ]),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "sesamo", "frutta_guscio"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "american-pork",
        name: "American Pork",
        description:
          "Burger di scottona, polpette di pulled, patate dolci, cipolla caramellata, cheddar fuso, bacon e salsa cheddar",
        price: s(13),
        ingredients: ingList("american-pork", [
          "Bun (pane)",
          "Burger scottona",
          "Polpettine al pulled",
          "Patate dolci",
          "Cipolla caramellata",
          "Bacon",
          "Cheddar fuso",
          "Salsa cheddar",
        ]),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "sesamo", "frutta_guscio"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "baby-pork",
        name: "Baby Pork",
        description: "Hamburger, cheddar, bacon, patatine, ketchup e maionese",
        price: s(10),
        ingredients: ingList("baby-pork", [
          "Bun (pane)",
          "Hamburger",
          "Cheddar",
          "Bacon",
          "Patatine fritte in accompagnamento",
          "Ketchup",
          "Maionese",
        ]),
        allergens: ix("glutine", "uova", "latte", "senape", "soia", "arachidi", "sesamo", "solfiti"),
        extraListId: LIST_ID_BURGER,
      },
      {
        id: "cheddar-pork",
        name: "Cheddar Pork",
        description:
          "Doppio burger di scottona, doppio cheddar, doppio bacon croccante e salsa BBQ",
        price: s(15),
        ingredients: ingList("cheddar-pork", [
          "Bun (pane)",
          { name: "Hamburger scottona", qty: 2 },
          { name: "Cheddar fuso", qty: 2 },
          { name: "Bacon croccante", qty: 2 },
          "Salsa BBQ",
        ]),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "sesamo", "frutta_guscio"),
        extraListId: LIST_ID_BURGER,
      },
    ],
  },
  {
    id: "pizze-classiche",
    title: "Pizze Classiche",
    subtitle: "Italian Style — come devono essere",
    items: [
      {
        id: "margherita",
        name: "Margherita",
        description: "Pomodoro, mozzarella, basilico e olio EVO",
        price: s(6),
        tags: ["veg"],
        ingredients: ingList("margherita", [
          "Pomodoro a crudo",
          "Mozzarella",
          "Basilico",
          "Olio EVO",
          "Impasto a lievitazione lenta",
        ]),
        allergens: ix("glutine", "latte", "solfiti"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "americana",
        name: "Americana",
        description: "Pomodoro, mozzarella, wurstel e patatine",
        price: s(8),
        ingredients: ingList("americana", [
          "Pomodoro",
          "Mozzarella",
          "Wurstel",
          "Patatine fritte a cubetti",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "soia", "arachidi", "senape", "solfiti", "uova", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "romana",
        name: "Romana",
        description: "Pomodoro, mozzarella, acciughe e capperi",
        price: s(7),
        ingredients: ingList("romana", [
          "Pomodoro",
          "Mozzarella",
          "Acciughe",
          "Capperi",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "pesce", "solfiti"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "diavola",
        name: "Diavola",
        description: "Pomodoro, mozzarella, ventricina e olio EVO",
        price: s(8),
        tags: ["piccante"],
        ingredients: ingList("diavola", [
          "Pomodoro",
          "Mozzarella",
          "Ventricina (salsiccia piccante calabra)",
          "Olio EVO",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "soia", "arachidi", "senape", "solfiti", "uova", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "capricciosa",
        name: "Capricciosa",
        description:
          "Pomodoro, mozzarella, prosciutto cotto, funghi, olive e carciofi",
        price: s(10),
        ingredients: ingList("capricciosa", [
          "Pomodoro",
          "Mozzarella",
          "Prosciutto cotto cotto in forno",
          "Funghi",
          "Olive nere",
          "Carciofi sott'olio (o cuori)",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "solfiti", "uova", "senape", "arachidi", "soia", "sesamo", "frutta_guscio"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "quattro-stagioni",
        name: "4 Stagioni",
        description:
          "Pomodoro, mozzarella, prosciutto cotto, carciofi, funghi e olive",
        price: s(10),
        ingredients: ingList("quattro-stagioni", [
          "Pomodoro",
          "Mozzarella",
          "Prosciutto cotto",
          "Carciofi",
          "Funghi",
          "Olive",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "solfiti", "senape", "arachidi", "soia", "uova", "sesamo", "frutta_guscio"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "quattro-formaggi",
        name: "4 Formaggi",
        description: "Mozzarella, gorgonzola, provola e grana",
        price: s(10),
        tags: ["veg"],
        ingredients: ingList("quattro-formaggi", [
          "Pomodoro a crudo o base bianca",
          "Mozzarella",
          "Gorgonzola DOP",
          "Provola",
          "Grana a scaglie",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "soia", "uova", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "provola-speck",
        name: "Provola e speck",
        description: "Pomodoro, mozzarella, provola affumicata e speck",
        price: s(10),
        ingredients: ingList("provola-speck", [
          "Pomodoro",
          "Mozzarella",
          "Provola affumicata",
          "Speck",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "soia", "uova", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "vegetariana",
        name: "Vegetariana",
        description:
          "Mozzarella, melanzane grigliate, zucchine grigliate, pomodorini e basilico",
        price: s(8),
        tags: ["veg"],
        ingredients: ingList("vegetariana", [
          "Pomodoro a crudo o base bianca",
          "Mozzarella",
          "Melanzane grigliate",
          "Zucchine grigliate",
          "Pomodorini",
          "Basilico",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "soia", "uova", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "bufalina",
        name: "Bufalina",
        description: "Pomodoro, mozzarella di bufala e basilico",
        price: s(7.5),
        tags: ["veg"],
        ingredients: ingList("bufalina", [
          "Pomodoro",
          "Mozzarella di bufala a crudo a fine cottura",
          "Basilico",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "solfiti"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "norcia-funghi",
        name: "Norcia e funghi",
        description: "Pomodoro, mozzarella, salsiccia di norcia e funghi",
        price: s(8),
        ingredients: ingList("norcia-funghi", [
          "Pomodoro",
          "Mozzarella",
          "Salsiccia di norcia a pezzetti",
          "Funghi",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "soia", "arachidi", "senape", "solfiti", "uova", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "bufala-norcia",
        name: "Bufala e Norcia",
        description: "Pomodoro, mozzarella di bufala e Norcia",
        price: s(8.5),
        ingredients: ingList("bufala-norcia", [
          "Pomodoro",
          "Stracci o fiordilatte di bufala a fine cottura",
          "Salsiccia di Norcia",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "soia", "arachidi", "senape", "solfiti", "uova", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "fa-pizzaiolo",
        name: "La fa il pizzaiolo",
        description: "La specialità del pizzaiolo",
        price: s(8.5),
        ingredients: ingList("fa-pizzaiolo", [
          "Impasto a lievitazione lenta",
          "Pomodoro a crudo o base (scelta del pizzaiolo)",
          "Formaggi, salumi e/o verdure a seconda della giornata (staff)",
        ]),
        allergens: ix("glutine", "latte", "uova", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "multigusto-14",
        name: "Multigusto",
        description:
          "Pomodoro, mozzarella, polpettine, salame piccante, pulled pork, funghi cardoncelli, Norcia e assassina (divisa in 4 sezioni differenti)",
        price: s(14),
        tags: ["firma"],
        image: "/photos/pizza-multigusto.png",
        ingredients: ingList("multigusto-14", [
          "Pomodoro (base in comune fra le sezioni)",
          "Mozzarella (base in comune fra le sezioni)",
          "Sezione 1: polpettine",
          "Sezione 2: salame piccante",
          "Sezione 2: pulled pork",
          "Sezione 3: salsiccia di Norcia",
          "Sezione 3: funghi cardoncelli",
          "Sezione 4: stile all'Assassina (pasta, sugo piccante, olio EVO)",
        ]),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "multigusto-15",
        name: "Multigusto Pistacchio",
        description:
          "Mozzarella, prosciutto cotto, pistacchio e stracciatella, funghi e crema di tartufo, zucchine alla poverella, melanzana scamorza (divisa in 4 sezioni differenti)",
        price: s(15),
        tags: ["firma"],
        image: "/photos/pizza-multigusto.png",
        ingredients: ingList("multigusto-15", [
          "Pomodoro (base in comune fra le sezioni)",
          "Mozzarella (base in comune fra le sezioni)",
          "Sezione 1: mortadella",
          "Sezione 1: pistacchio",
          "Sezione 1: stracciatella",
          "Sezione 2: funghi",
          "Sezione 2: crema al tartufo",
          "Sezione 3: zucchine alla poverella",
          "Sezione 4: melanzane",
          "Sezione 4: scamorza",
        ]),
        allergens: ix("glutine", "uova", "latte", "soia", "arachidi", "senape", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
    ],
  },
  {
    id: "pizze-speciali",
    title: "Pizze Speciali Be Pork",
    subtitle: "Classiche come non te le aspetti",
    items: [
      {
        id: "martina",
        name: "Martina",
        description: "Crema al basilico, mozzarella, capocollo e pom. sott'olio",
        price: s(10),
        ingredients: ingList("martina", [
          "Crema al basilico o pesto leggero",
          "Pomodoro a crudo o base bianca",
          "Mozzarella",
          "Capocollo (coppa)",
          "Pomodori sott'olio a fine cottura",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "uova", "arachidi", "senape", "soia", "frutta_guscio", "solfiti", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "mortazza",
        name: "Mortazza",
        description:
          "Mozzarella, mortadella, granella di pistacchio e grana",
        price: s(9),
        tags: ["firma"],
        ingredients: ingList("mortazza", [
          "Pomodoro a crudo o base bianca",
          "Mozzarella",
          "Mortadella a crudo a fine cottura",
          "Granella di pistacchio",
          "Grana",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "uova", "arachidi", "senape", "soia", "frutta_guscio", "sesamo", "solfiti"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "padana",
        name: "Padana",
        description: "Crema di grana, mozzarella, zucchine gratinate e bacon",
        price: s(10),
        ingredients: ingList("padana", [
          "Base bianca",
          "Crema di grana",
          "Mozzarella",
          "Zucchine gratinate con pangrattato",
          "Bacon",
          "Impasto",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "allitaliana",
        name: "All'Italiana",
        description:
          "Ciccio, mozzarella, prosciutto crudo, pomodoro, rucola e grana",
        price: s(10),
        ingredients: ingList("allitaliana", [
          { name: "Mozzarella", qty: 3 },
          "Prosciutto crudo a crudo",
          "Datterino o filetti di pomodoro",
          "Rucola",
          "Grattugiato o grana",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "uova", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "carbonara-pizza",
        name: "Carbonara",
        description: "Mozzarella, uovo, guanciale, pepe e pecorino",
        price: s(9),
        ingredients: ingList("carbonara-pizza", [
          "Base bianca o pomodoro leggero (secondo abitudine cucina)",
          "Mozzarella",
          "Uovo",
          "Guanciale",
          "Pepe nero",
          "Pecorino romano",
          "Impasto",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "giu-al-sud",
        name: "Giù al Sud",
        description: "Pomodoro, mozzarella, rape e salame piccante",
        price: s(10),
        tags: ["piccante"],
        ingredients: ingList("giu-al-sud", [
          "Pomodoro",
          "Mozzarella",
          "Cime di rapa o rape (saltate o crude)",
          "Salame piccante a pezzelli",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "uova", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "la-sarda",
        name: "La Sarda",
        description:
          "Mozzarella, pecorino sardo, salsiccia sarda, zest di limone e gocce di miele",
        price: s(11),
        ingredients: ingList("la-sarda", [
          "Pomodoro a crudo o base bianca",
          "Mozzarella",
          "Pecorino sardo",
          "Salsiccia sarda",
          "Miele",
          "Zest di limone",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "uova", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "deliziosa",
        name: "Deliziosa",
        description:
          "Pomodoro, mozzarella, capocollo, stracciatella e pom. sott'olio",
        price: s(9),
        ingredients: ingList("deliziosa", [
          "Pomodoro",
          "Mozzarella",
          "Capocollo a fine cottura",
          "Stracciatella",
          "Pomodori sott'olio",
          "Olio EVO a crudo",
          "Impasto",
        ]),
        allergens: ix("glutine", "latte", "uova", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "pizza-allassassina",
        name: "Pizza all'Assassina",
        description:
          "Pomodoro, spaghetti all'assassina, stracciatella, olio EVO e piccante",
        price: s(10),
        tags: ["firma", "piccante"],
        image: "/photos/pizza-multigusto.png",
        ingredients: ingList("pizza-allassassina", [
          "Impasto (base sottile)",
          "Pomodoro",
          "Mozzarella",
          "Pasta all'Assassina o lamelle (sugo piccante)",
          "Stracciatella",
          { name: "Olio EVO", qty: 2 },
          "Peperoncino",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "pulled-pizza",
        name: "Pulled Pizza",
        description: "Provola aff. pulled pork, salsa BBQ e salsa cheddar",
        price: s(10),
        tags: ["firma"],
        ingredients: ingList("pulled-pizza", [
          "Pomodoro",
          "Mozzarella",
          "Provola affumicata",
          "Pulled pork",
          "Salsa BBQ",
          "Salsa cheddar",
          "Impasto",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "crock",
        name: "Crock",
        description:
          "Mozzarella, crocchette di patate, prosciutto cotto alla brace, cipolla croccante, gocce di maionese, limone e pepe",
        price: s(10),
        ingredients: ingList("crock", [
          "Pomodoro",
          "Mozzarella",
          "Crocchette di patate",
          "Prosciutto cotto alla brace",
          "Cipolla fritta",
          "Maionese",
          "Limone",
          "Pepe a crudo",
          "Impasto",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "cheese-pizza",
        name: "Cheese Pizza",
        description:
          "Mozzarella, pomodori confit, burger sbriciolato, bacon croccante e salsa cheddar",
        price: s(10),
        ingredients: ingList("cheese-pizza", [
          "Pomodoro",
          "Mozzarella",
          "Pomodorini confit",
          "Macinato cotto a pezzettini",
          "Bacon",
          "Salsa cheddar",
          "Impasto",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "mortadella-pork",
        name: "Mortadella Pork",
        description:
          "Mozzarella, provola affumicata, mortadella alla barese e pesto di pistacchio",
        price: s(10),
        tags: ["firma"],
        ingredients: ingList("mortadella-pork", [
          "Pomodoro",
          "Mozzarella",
          "Provola affumicata",
          "Mortadella a crudo a fine cottura",
          "Pesto al pistacchio a crudo a fine cottura",
          "Impasto",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "nonna-pork",
        name: "Nonna Pork",
        description:
          "Fonduta di provolone, polpette con il ragù e pesto di pistacchio",
        price: s(10),
        ingredients: ingList("nonna-pork", [
          "Base (impasto)",
          "Fonduta di provolone",
          "Polpettine in ragù di manzo/maiale",
          "Pesto di pistacchio a goccia",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "parmiggiana-pizza",
        name: "Parmiggiana",
        description:
          "Scamorza affumicata, mozzarella, melanzane fritte e scaglie di grana",
        price: s(10),
        tags: ["veg"],
        ingredients: ingList("parmiggiana-pizza", [
          "Pomodoro a crudo o base bianca",
          "Mozzarella",
          "Scamorza",
          "Melanzane fritte a fette",
          "Grana a scaglie",
          "Impasto",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "bacon-pizza",
        name: "Bacon Pizza",
        description:
          "Scam. affumicata, bacon in due consistenze, salsa cheddar, cipolla croccante e salsa BBQ",
        price: s(10),
        ingredients: ingList("bacon-pizza", [
          "Pomodoro",
          "Mozzarella",
          "Scamorza affumicata",
          { name: "Bacon (due consistenze)", qty: 2 },
          "Cipolla fritta",
          "Salsa BBQ",
          "Salsa cheddar",
          "Impasto",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
      {
        id: "porka-brascio",
        name: "Porka Brascio'",
        description: "Salsa cacio e pepe, braciola con il ragù",
        price: s(10),
        tags: ["firma"],
        ingredients: ingList("porka-brascio", [
          "Base bianca o pomodoro leggero",
          "Crema cacio e pepe",
          "Braciola cotta nel ragù a pezzettoni",
          "Fondo di cottura (ragù)",
          "Impasto",
        ]),
        allergens: ix("glutine", "uova", "latte", "arachidi", "senape", "soia", "solfiti", "frutta_guscio", "sesamo"),
        extraListId: LIST_ID_PIZZA,
      },
    ],
  },
  {
    id: "birre",
    title: "Birre alla spina",
    subtitle: "Tedesche di carattere e una IPA di casa",
    items: [
      {
        id: "krombacher-pils",
        name: "Krombacher Pils",
        description:
          "Premium Lager cinque stelle prodotta in modo naturale in Germania. Chiara, schiuma solida e compatta, aroma gradevole di luppolo.",
        abv: "4.8%",
        price: {
          kind: "volume",
          small: { label: "0,2 L", price: 3.5 },
          large: { label: "0,4 L", price: 5.5 },
        },
        allergens: ix("glutine", "solfiti"),
      },
      {
        id: "krombacher-weizen",
        name: "Krombacher Weizen",
        description:
          "Birra bianca di frumento, colore bianco dorato, profumo dolciastro e frizzante, sapore pieno e rinfrescante.",
        abv: "5.4%",
        price: {
          kind: "volume",
          small: { label: "0,3 L", price: 4 },
          large: { label: "0,5 L", price: 6.5 },
        },
        allergens: ix("glutine", "solfiti"),
      },
      {
        id: "rhenania-alt",
        name: "Rhenania Alt",
        description:
          "Ambrata, ad alta fermentazione, carattere tipico e raffinato con una nota di malto discreta ma perfetta.",
        abv: "5.6%",
        price: {
          kind: "volume",
          small: { label: "0,3 L", price: 4.5 },
          large: { label: "0,5 L", price: 6 },
        },
        allergens: ix("glutine", "solfiti"),
      },
      {
        id: "krombacher-non-filtrata",
        name: "Krombacher Non Filtrata",
        description:
          "Colore brillante, schiuma compatta, gusto squisito con accenni di malto e finale in un amaro fine e piacevole.",
        abv: "7.1%",
        price: {
          kind: "volume",
          small: { label: "0,3 L", price: 3.5 },
          large: { label: "0,5 L", price: 7 },
        },
        allergens: ix("glutine", "solfiti"),
      },
      {
        id: "tennents-super",
        name: "Tennent's Super",
        description:
          "Corpo pieno e denso, giallo intenso con riflessi ramati. Aromi intensi di malto pregiato con note di mela.",
        abv: "7.1%",
        price: {
          kind: "volume",
          small: { label: "0,25 L", price: 4.5 },
          large: { label: "0,5 L", price: 7 },
        },
        allergens: ix("glutine", "solfiti"),
      },
      {
        id: "laguna-beach-ipa",
        name: "Laguna Beach IPA",
        description:
          "Artigianale, dorata, piena e fragrante. Esplosione di note agrumate e frutta esotica. Gusto amaricante deciso e rotondo, finale secco.",
        abv: "6.5%",
        price: {
          kind: "volume",
          small: { label: "0,30 L", price: 4 },
          large: { label: "0,30 L", price: 4 },
        },
        allergens: ix("glutine", "solfiti"),
      },
    ],
  },
  {
    id: "drink",
    title: "Drink & Cocktail",
    subtitle: "Il giro giusto per accompagnare",
    items: [
      { id: "spritz", name: "Aperol / Campari Spritz", price: s(6), allergens: ix("solfiti") },
      { id: "gin-tonic", name: "Gin Tonic", price: s(6), allergens: ix("solfiti") },
      { id: "gin-lemon", name: "Gin Lemon", price: s(6), allergens: ix("solfiti") },
      { id: "negroni", name: "Negroni / Negroni Sbagliato", price: s(6), allergens: ix("solfiti") },
      { id: "americano", name: "Americano", price: s(6), allergens: ix("solfiti") },
    ],
  },
  {
    id: "amari-distillati",
    title: "Amari & Distillati",
    subtitle: "Il digestivo è d'obbligo",
    items: [
      { id: "mirto-sardo", name: "Mirto sardo", price: s(3.5), allergens: ix("solfiti", "lupini") },
      { id: "limoncello", name: "Limoncello", price: s(3.5), allergens: ix("solfiti", "lupini") },
      { id: "amaro-del-capo", name: "Amaro del Capo", price: s(3.5), allergens: ix("solfiti", "lupini") },
      { id: "montenegro", name: "Montenegro", price: s(3.5), allergens: ix("solfiti", "lupini") },
      { id: "jagermeister", name: "Jägermeister", price: s(3.5), allergens: ix("lupini", "solfiti") },
      { id: "jack-daniels", name: "Jack Daniel's", price: s(4.5), allergens: ix("solfiti") },
      { id: "bep", name: "BEP", price: s(4.5), allergens: ix("solfiti") },
      { id: "red-label", name: "Red Label", price: s(4.5), allergens: ix("solfiti") },
      { id: "grappa-nonnino", name: "Grappa Nonnino", price: s(4.5), allergens: ix("solfiti") },
      { id: "rum", name: "Rum", price: s(4.5), allergens: ix("solfiti") },
    ],
  },
  {
    id: "dolci",
    title: "Dolci",
    subtitle: "Finire bene è un dovere",
    items: [
      { id: "tartufo-bianco", name: "Tartufo bianco", price: s(5), allergens: ix("latte", "uova", "frutta_guscio", "soia", "glutine", "arachidi") },
      { id: "tartufo-nero", name: "Tartufo nero", price: s(5), allergens: ix("latte", "uova", "frutta_guscio", "soia", "glutine", "arachidi") },
      { id: "souffle", name: "Soufflé al cioccolato", price: s(5), allergens: ix("uova", "latte", "soia", "frutta_guscio", "glutine", "arachidi") },
      { id: "sorbetto", name: "Sorbetto al limone", price: s(3) },
    ],
  },
  {
    id: "bevande",
    title: "Bevande",
    items: [
      { id: "acqua-naturale", name: "Acqua naturale", price: s(1.2) },
      { id: "acqua-frizzante", name: "Acqua frizzante", price: s(1.2) },
      { id: "coca-cola", name: "Coca Cola", price: s(3), allergens: ix("solfiti") },
      { id: "coca-cola-zero", name: "Coca Cola Zero", price: s(3), allergens: ix("solfiti") },
      { id: "fanta", name: "Fanta", price: s(3), allergens: ix("solfiti") },
      { id: "sprite", name: "Sprite", price: s(3), allergens: ix("solfiti") },
      { id: "chino", name: "Chinò", price: s(3), allergens: ix("solfiti") },
    ],
  },
];

export const formatPrice = (price: PriceFormat): string => {
  switch (price.kind) {
    case "single":
      return `€ ${price.value.toFixed(2).replace(".", ",")}`;
    case "sized":
      return `Big € ${price.big.toFixed(2).replace(".", ",")} / Small € ${price.small
        .toFixed(2)
        .replace(".", ",")}`;
    case "persone":
      return `2 pers. € ${price.per2.toFixed(2).replace(".", ",")} / 4 pers. € ${price.per4
        .toFixed(2)
        .replace(".", ",")}`;
    case "volume":
      return (price.variants?.length ? price.variants : [price.small, price.large])
        .map((variant) => `${variant.label} € ${variant.price.toFixed(2).replace(".", ",")}`)
        .join(" / ");
  }
};

export const priceFromNumber = (price: PriceFormat): number => {
  switch (price.kind) {
    case "single":
      return price.value;
    case "sized":
      return price.small;
    case "persone":
      return price.per2;
    case "volume":
      return (price.variants?.[0] ?? price.small).price;
  }
};
