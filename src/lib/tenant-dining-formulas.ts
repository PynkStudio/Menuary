/**
 * Formule "All You Can Eat" / esperienze di pasto separate dal menu.
 *
 * Concettualmente NON sono prodotti: sono modalità di sessione (cliente al
 * tavolo sceglie una formula, da quel momento i piatti del menu vivono dentro
 * la formula attiva). Vengono mostrate in lettura sopra il menu pubblico e
 * diventeranno selettore nel flow "ordine al tavolo" — qui sotto il dato.
 */

/** Giorni 0-6 (0 = domenica). */
export type DiningFormulaDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DiningFormula = {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Etichetta breve per i contesti compatti (es. "AYCE Pranzo"). */
  shortLabel?: string;
  /** HH:mm locale. */
  from?: string;
  /** HH:mm locale. */
  to?: string;
  /** Giorni applicabili. Omesso = tutti i giorni. */
  days?: DiningFormulaDay[];
  /** Nota a piè di card (es. "Bambini fino 1,20 m"). */
  footnote?: string;
  /** Formula "firma" del locale — flag visivo. */
  signature?: boolean;
  /** Disponibilità nei canali d'ordine. Default: solo al tavolo. */
  channels?: Array<"dine-in" | "takeaway" | "delivery">;
};

export const nomSushiFormulas: DiningFormula[] = [
  {
    id: "ayce-pranzo",
    name: "Pranzo AYCE",
    shortLabel: "Pranzo",
    description:
      "Antipasti, dim sum, finger food, tacos, nigiri, gunkan, futomaki e uramaki.",
    price: 18.9,
    from: "12:00",
    to: "15:00",
    days: [1, 2, 3, 4, 5],
    signature: true,
    channels: ["dine-in"],
  },
  {
    id: "ayce-pranzo-ridotto",
    name: "Pranzo ridotto",
    shortLabel: "Pranzo ridotto",
    description: "Stessa carta del pranzo AYCE.",
    price: 12.9,
    from: "12:00",
    to: "15:00",
    days: [1, 2, 3, 4, 5],
    footnote: "Bambini fino a 1,20 m",
    channels: ["dine-in"],
  },
  {
    id: "ayce-festivi",
    name: "Festivi & weekend",
    shortLabel: "Festivi",
    description: "Stessa formula AYCE pranzo.",
    price: 20.9,
    from: "12:00",
    to: "15:00",
    days: [0, 6],
    channels: ["dine-in"],
  },
  {
    id: "ayce-cena",
    name: "Cena AYCE",
    shortLabel: "Cena",
    description:
      "Carta estesa con tartare, carpacci, sashimi, Nøm Crudité e Nøm Specials.",
    price: 32.9,
    from: "19:00",
    to: "23:30",
    signature: true,
    channels: ["dine-in"],
  },
  {
    id: "ayce-cena-ridotto",
    name: "Cena ridotta",
    shortLabel: "Cena ridotta",
    description: "Stessa carta della cena AYCE.",
    price: 17.9,
    from: "19:00",
    to: "23:30",
    footnote: "Bambini fino a 1,20 m",
    channels: ["dine-in"],
  },
  {
    id: "aperisushi",
    name: "Aperisushi",
    shortLabel: "Aperisushi",
    description:
      "1 drink + combo cucina (nuvole di drago, edamame, riso cantonese, involtini, ravioli fritti, wakame, spiedini di pollo) oppure combo sushi (nuvole di drago, edamame, gunkan, taco pesto, nigiri misti, hosomaki, uramaki).",
    price: 13.9,
    from: "19:00",
    to: "21:00",
    signature: true,
    channels: ["dine-in"],
  },
];

export function getDiningFormulasForTenant(tenantId: string): DiningFormula[] {
  if (tenantId === "nom-sushi") return nomSushiFormulas;
  return [];
}
