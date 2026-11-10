import type { DishBlock, DishIssue, DishText } from "./types";

export const DISH_DEFAULT_LOCALE = "it";

/** Risolve un testo tradotto: lingua richiesta, poi lingua base (it-IT → it), poi italiano, poi la prima disponibile. */
export function dishText(text: DishText | undefined, locale: string, fallback = DISH_DEFAULT_LOCALE): string {
  if (text == null) return "";
  if (typeof text === "string") return text;
  const base = locale.split("-")[0];
  return text[locale] ?? text[base] ?? text[fallback] ?? Object.values(text).find(Boolean) ?? "";
}

export type DishBuilderCopy = {
  back: string;
  undo: string;
  clear: string;
  submit: string;
  added: string;
  addedAgain: string;
  removed: string;
  addedToOrder: string;
  removeOne: string;
  soldOut: string;
  free: string;
  details: string;
  close: string;
  allergens: string;
  addToDish: string;
  portion: string;
  portions: string;
  emptyDish: string;
  maxPortionsOne: string;
  maxPortions: string;
  groupMax: string;
  totalMax: string;
  unavailable: string;
  groupMinOne: string;
  groupMin: string;
  upTo: string;
  menuEntryCta: string;
  menuEntryKicker: string;
};

const IT: DishBuilderCopy = {
  back: "Indietro",
  undo: "Annulla",
  clear: "Svuota",
  submit: "Aggiungi all'ordine",
  added: "{name} aggiunto",
  addedAgain: "{name} x{n}",
  removed: "{name} tolto",
  addedToOrder: "Aggiunto all'ordine",
  removeOne: "Togli una porzione di {name}",
  soldOut: "Esaurito",
  free: "Gratis",
  details: "Dettagli di {name}",
  close: "Chiudi",
  allergens: "Allergeni",
  addToDish: "Aggiungi",
  portion: "porzione",
  portions: "porzioni",
  emptyDish: "nessun ingrediente",
  maxPortionsOne: "{name}: una sola porzione",
  maxPortions: "{name}: massimo {max} porzioni",
  groupMax: "{group}: massimo {max}",
  totalMax: "Massimo {max} ingredienti",
  unavailable: "{name} non disponibile",
  groupMinOne: "Scegli almeno un ingrediente in «{group}»",
  groupMin: "Scegli almeno {min} ingredienti in «{group}»",
  upTo: "fino a {max}",
  menuEntryCta: "Inizia",
  menuEntryKicker: "Novità",
};

const EN: DishBuilderCopy = {
  back: "Back",
  undo: "Undo",
  clear: "Clear",
  submit: "Add to order",
  added: "{name} added",
  addedAgain: "{name} x{n}",
  removed: "{name} removed",
  addedToOrder: "Added to your order",
  removeOne: "Remove one portion of {name}",
  soldOut: "Sold out",
  free: "Free",
  details: "{name} details",
  close: "Close",
  allergens: "Allergens",
  addToDish: "Add",
  portion: "portion",
  portions: "portions",
  emptyDish: "no toppings",
  maxPortionsOne: "{name}: one portion only",
  maxPortions: "{name}: up to {max} portions",
  groupMax: "{group}: up to {max}",
  totalMax: "Up to {max} ingredients",
  unavailable: "{name} is not available",
  groupMinOne: "Pick at least one item in “{group}”",
  groupMin: "Pick at least {min} items in “{group}”",
  upTo: "up to {max}",
  menuEntryCta: "Start",
  menuEntryKicker: "New",
};

const ES: DishBuilderCopy = {
  ...EN,
  back: "Atrás",
  undo: "Deshacer",
  clear: "Vaciar",
  submit: "Añadir al pedido",
  added: "{name} añadido",
  removed: "{name} quitado",
  addedToOrder: "Añadido al pedido",
  removeOne: "Quitar una porción de {name}",
  soldOut: "Agotado",
  free: "Gratis",
  details: "Detalles de {name}",
  close: "Cerrar",
  allergens: "Alérgenos",
  addToDish: "Añadir",
  portion: "porción",
  portions: "porciones",
  emptyDish: "sin ingredientes",
  maxPortionsOne: "{name}: solo una porción",
  maxPortions: "{name}: máximo {max} porciones",
  groupMax: "{group}: máximo {max}",
  totalMax: "Máximo {max} ingredientes",
  unavailable: "{name} no disponible",
  groupMinOne: "Elige al menos un ingrediente en «{group}»",
  groupMin: "Elige al menos {min} ingredientes en «{group}»",
  upTo: "hasta {max}",
  menuEntryCta: "Empezar",
  menuEntryKicker: "Nuevo",
};

const FR: DishBuilderCopy = {
  ...EN,
  back: "Retour",
  undo: "Annuler",
  clear: "Vider",
  submit: "Ajouter à la commande",
  added: "{name} ajouté",
  removed: "{name} retiré",
  addedToOrder: "Ajouté à la commande",
  removeOne: "Retirer une portion de {name}",
  soldOut: "Épuisé",
  free: "Offert",
  details: "Détails : {name}",
  close: "Fermer",
  allergens: "Allergènes",
  addToDish: "Ajouter",
  portion: "portion",
  portions: "portions",
  emptyDish: "aucun ingrédient",
  maxPortionsOne: "{name} : une seule portion",
  maxPortions: "{name} : {max} portions maximum",
  groupMax: "{group} : {max} maximum",
  totalMax: "{max} ingrédients maximum",
  unavailable: "{name} indisponible",
  groupMinOne: "Choisissez au moins un ingrédient dans « {group} »",
  groupMin: "Choisissez au moins {min} ingrédients dans « {group} »",
  upTo: "jusqu'à {max}",
  menuEntryCta: "Commencer",
  menuEntryKicker: "Nouveau",
};

const DE: DishBuilderCopy = {
  ...EN,
  back: "Zurück",
  undo: "Rückgängig",
  clear: "Leeren",
  submit: "Zur Bestellung",
  added: "{name} hinzugefügt",
  removed: "{name} entfernt",
  addedToOrder: "Zur Bestellung hinzugefügt",
  removeOne: "Eine Portion {name} entfernen",
  soldOut: "Ausverkauft",
  free: "Gratis",
  details: "Details: {name}",
  close: "Schließen",
  allergens: "Allergene",
  addToDish: "Hinzufügen",
  portion: "Portion",
  portions: "Portionen",
  emptyDish: "keine Zutaten",
  maxPortionsOne: "{name}: nur eine Portion",
  maxPortions: "{name}: höchstens {max} Portionen",
  groupMax: "{group}: höchstens {max}",
  totalMax: "Höchstens {max} Zutaten",
  unavailable: "{name} nicht verfügbar",
  groupMinOne: "Wähle mindestens eine Zutat bei „{group}“",
  groupMin: "Wähle mindestens {min} Zutaten bei „{group}“",
  upTo: "bis zu {max}",
  menuEntryCta: "Los geht's",
  menuEntryKicker: "Neu",
};

const COPY: Record<string, DishBuilderCopy> = { it: IT, en: EN, es: ES, fr: FR, de: DE };

/** Testi della UI nella lingua del cliente, con le sovrascritture del tenant (anche tradotte). */
export function resolveDishCopy(
  locale: string,
  overrides?: Partial<Record<keyof DishBuilderCopy, DishText>>,
): DishBuilderCopy {
  const base = COPY[locale] ?? COPY[locale.split("-")[0]] ?? EN;
  if (!overrides) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(overrides) as Array<[keyof DishBuilderCopy, DishText]>) {
    const text = dishText(value, locale);
    if (text) out[key] = text;
  }
  return out;
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

const CURRENCY_LOCALE: Record<string, string> = { it: "it-IT", en: "en-IE", es: "es-ES", fr: "fr-FR", de: "de-DE" };

export function formatDishPrice(value: number, locale: string, currency = "EUR"): string {
  const tag = CURRENCY_LOCALE[locale] ?? CURRENCY_LOCALE[locale.split("-")[0]] ?? locale;
  try {
    return new Intl.NumberFormat(tag, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function blockMessage(
  block: DishBlock,
  copy: DishBuilderCopy,
  names: { ingredient: (id: string) => string; group: (id: string) => string },
): string {
  switch (block.code) {
    case "unknown":
      return "";
    case "unavailable":
      return fill(copy.unavailable, { name: names.ingredient(block.ingredientId) });
    case "maxPortions":
      return fill(block.max === 1 ? copy.maxPortionsOne : copy.maxPortions, {
        name: names.ingredient(block.ingredientId),
        max: block.max,
      });
    case "groupMax":
      return fill(copy.groupMax, { group: names.group(block.groupId), max: block.max });
    case "totalMax":
      return fill(copy.totalMax, { max: block.max });
  }
}

export function issueMessage(issue: DishIssue, copy: DishBuilderCopy, groupName: string): string {
  return fill(issue.min === 1 ? copy.groupMinOne : copy.groupMin, { group: groupName, min: issue.min });
}
