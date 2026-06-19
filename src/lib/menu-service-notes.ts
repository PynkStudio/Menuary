import type { MenuServiceNoteKey } from "@/lib/menu-data";
import { siteConfig } from "@/lib/site-config";

/** Extra mostrato in modale (non più come testo sotto il prezzo). */
export const SENZA_LATTOSIO_EXTRA = {
  id: "__senza_lattosio",
  name: "Senza lattosio",
  price: 1,
} as const;

const CATEGORIES_WITH_SENZA_LATTOSIO = new Set([
  "pizze-classiche",
  "pizze-speciali",
  "burger",
  "club-sandwich",
]);

export function categoryOffersSenzaLattosio(categoryId: string): boolean {
  return CATEGORIES_WITH_SENZA_LATTOSIO.has(categoryId);
}

const CATEGORY_DEFAULT_NOTES: Partial<
  Record<string, MenuServiceNoteKey[]>
> = {
  "pizze-classiche": ["impastoNapoletano", "aggiunte"],
  "pizze-speciali": ["impastoNapoletano", "aggiunte"],
  burger: ["aggiunte"],
  "club-sandwich": ["aggiunte"],
};

export function getMenuServiceNotes(
  categoryId: string,
  item?: { serviceNotes?: MenuServiceNoteKey[] },
): MenuServiceNoteKey[] {
  if (item?.serviceNotes !== undefined) return item.serviceNotes;
  return CATEGORY_DEFAULT_NOTES[categoryId] ?? [];
}

export function menuServiceNoteText(key: MenuServiceNoteKey): string {
  return siteConfig.disclaimers[key];
}
