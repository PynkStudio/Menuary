/** Stessa forma di `MenuExtra` in menu-data (file separato per evitare import circolari). */
type ExtraRow = { id: string; name: string; price: number };

export type ExtraList = {
  id: string;
  name: string;
  extras: ExtraRow[];
};

const EX_LIST_PIZZA: ExtraRow[] = [
  { id: "pz-patatine", name: "Patatine fritte", price: 0.5 },
  { id: "pz-wurstel", name: "Wurstel", price: 0.5 },
  { id: "pz-funghi", name: "Funghi", price: 1 },
  { id: "pz-proc-cotto", name: "Prosciutto cotto", price: 1 },
  { id: "pz-salame", name: "Salame", price: 1 },
  { id: "pz-olive", name: "Olive", price: 0.5 },
  { id: "pz-rucola", name: "Rucola", price: 0.5 },
  { id: "pz-grana", name: "Grattugiato / grana", price: 0.5 },
  { id: "pz-bufala", name: "Bufala in strisce", price: 1 },
  { id: "pz-peperone", name: "Peperoncino", price: 0.5 },
  { id: "pz-acciughe", name: "Acciughe", price: 1 },
  { id: "pz-bacon", name: "Bacon", price: 1 },
  { id: "pz-ventricina", name: "Salsiccia / ventricina", price: 1 },
  { id: "pz-cipolla", name: "Cipolla", price: 0.5 },
];

const EX_LIST_BURGER: ExtraRow[] = [
  { id: "bg-bacon", name: "Bacon", price: 1 },
  { id: "bg-cheddar", name: "Cheddar fuso", price: 1 },
  { id: "bg-bbq", name: "Salsa BBQ", price: 0.5 },
  { id: "bg-doppia", name: "Doppia carne", price: 2 },
  { id: "bg-cipolla", name: "Cipolla caramellata", price: 0.5 },
  { id: "bg-uovo", name: "Uovo fritto", price: 1 },
];

const EX_LIST_CLUB: ExtraRow[] = [
  { id: "cl-bacon", name: "Bacon", price: 1 },
  { id: "cl-cheddar", name: "Cheddar", price: 0.5 },
  { id: "cl-bbq", name: "Salsa BBQ", price: 0.5 },
  { id: "cl-mayo", name: "Mayo extra", price: 0.5 },
];

const EX_LIST_KIMOS_PIZZA: ExtraRow[] = [
  { id: "kpz-pomodoro", name: "Pomodoro", price: 0.5 },
  { id: "kpz-mozzarella", name: "Mozzarella", price: 1 },
  { id: "kpz-funghi", name: "Funghi", price: 1 },
  { id: "kpz-prosciutto-cotto", name: "Prosciutto cotto", price: 1 },
  { id: "kpz-salame", name: "Salame", price: 1 },
  { id: "kpz-piccante", name: "Salame piccante", price: 1 },
  { id: "kpz-olive", name: "Olive", price: 0.5 },
  { id: "kpz-cipolla", name: "Cipolla", price: 0.5 },
  { id: "kpz-acciughe", name: "Acciughe", price: 1 },
  { id: "kpz-salmone", name: "Salmone affumicato", price: 1.5 },
  { id: "kpz-wurstel", name: "Wurstel", price: 0.5 },
  { id: "kpz-panna", name: "Panna", price: 0.5 },
  { id: "kpz-grana", name: "Grana / grattugiato", price: 0.5 },
  { id: "kpz-rucola", name: "Rucola", price: 0.5 },
];

/** Ids fissi usati dal menu seed BePork: aggiornando la lista in admin si propagano tutti i piatti collegati. */
export const LIST_ID_PIZZA = "lista-pizze" as const;
export const LIST_ID_BURGER = "lista-burger" as const;
export const LIST_ID_CLUB = "lista-club" as const;
export const LIST_ID_KIMOS_PIZZA = "kimos-lista-pizze" as const;

const BEPORK_EXTRA_LISTS: readonly ExtraList[] = [
  { id: LIST_ID_PIZZA, name: "Aggiunte pizze", extras: [...EX_LIST_PIZZA] },
  { id: LIST_ID_BURGER, name: "Aggiunte burger", extras: [...EX_LIST_BURGER] },
  { id: LIST_ID_CLUB, name: "Aggiunte club sandwich", extras: [...EX_LIST_CLUB] },
] as const;

const KIMOS_EXTRA_LISTS: readonly ExtraList[] = [
  { id: LIST_ID_KIMOS_PIZZA, name: "Aggiunte pizze Kimos", extras: [...EX_LIST_KIMOS_PIZZA] },
] as const;

/** @deprecated usa getTenantDefaultExtraLists(tenantId) */
export const DEFAULT_EXTRA_LISTS = BEPORK_EXTRA_LISTS;

/** Restituisce le liste aggiunte predefinite per il tenant. Solo BePork e Kimos hanno un seed; gli altri partono vuoti. */
export function getTenantDefaultExtraLists(tenantId: string): readonly ExtraList[] {
  if (tenantId === "bepork") return BEPORK_EXTRA_LISTS;
  if (tenantId === "kimos") return KIMOS_EXTRA_LISTS;
  return [];
}

export function resolveExtrasForItem(
  item: { extraListId?: string; extras?: ExtraRow[] },
  extraLists: ExtraList[],
): ExtraRow[] {
  if (item.extraListId) {
    const list = extraLists.find((l) => l.id === item.extraListId);
    if (list) return list.extras.map((e) => ({ ...e }));
  }
  return (item.extras ?? []).map((e) => ({ ...e }));
}

export function mergeExtraListsWithDefaults(
  persisted: ExtraList[] | undefined,
  seed: readonly ExtraList[],
): ExtraList[] {
  const p = persisted ?? [];
  const pById = new Map(p.map((l) => [l.id, l] as const));
  const seedById = new Set(seed.map((l) => l.id));
  const fromSeed = seed.map((s) => {
    const u = pById.get(s.id);
    if (u) {
      return {
        id: u.id,
        name: u.name,
        extras: u.extras.map((e) => ({ ...e })),
      };
    }
    return { id: s.id, name: s.name, extras: s.extras.map((e) => ({ ...e })) };
  });
  const onlyCustom = p
    .filter((l) => !seedById.has(l.id))
    .map((l) => ({
      id: l.id,
      name: l.name,
      extras: l.extras.map((e) => ({ ...e })),
    }));
  return [...fromSeed, ...onlyCustom];
}
