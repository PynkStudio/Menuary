import type { AdminMenuItem, AdminMenuCategory, CartLine, MenuBundleSlot } from "@/lib/types";
import { minPrice } from "@/lib/price-utils";

export type SlotMatch = {
  slot: MenuBundleSlot;
  cartLineIndex: number;
  cartLineId: string;
  cartLineName: string;
  cartLineItemId: string;
};

export type MenuOpportunity = {
  menuItem: AdminMenuItem;
  /** Slot completamente coperti da righe del carrello. */
  matchedSlots: SlotMatch[];
  /** Slot non coperti (per opportunità parziali). */
  unmatchedSlots: MenuBundleSlot[];
  /** true se tutti gli slot sono coperti. */
  isComplete: boolean;
  /** Risparmio in euro (positivo = conviene il menu). Basato sul prezzo minimo di ogni item. */
  savings: number;
};

export function itemCoversSlot(
  itemId: string,
  categoryId: string,
  slot: MenuBundleSlot,
): boolean {
  if (slot.sourceCategoryIds.includes(categoryId)) return true;
  if (slot.sourceItemIds?.includes(itemId)) return true;
  return false;
}

/**
 * Dato un carrello e il catalogo, trova tutti i menu (item con bundleSlots) che
 * potrebbero essere composti con le righe presenti.
 *
 * L'assegnazione è greedy: ogni riga del carrello viene usata al massimo per uno slot.
 * Vengono restituite solo le opportunità con almeno uno slot coperto.
 * Se il risparmio è ≤ 0 l'opportunità viene comunque restituita (il chiamante decide).
 */
export function detectMenuOpportunities(
  cartLines: CartLine[],
  allItems: AdminMenuItem[],
  allCategories: AdminMenuCategory[],
): MenuOpportunity[] {
  const menuItems = allItems.filter(
    (it) => it.available && (it.bundleSlots?.length ?? 0) > 0,
  );
  if (menuItems.length === 0) return [];

  const catById = new Map(allCategories.map((c) => [c.id, c]));

  const results: MenuOpportunity[] = [];

  for (const menuItem of menuItems) {
    const slots = menuItem.bundleSlots!;
    const usedLineIndexes = new Set<number>();
    const matchedSlots: SlotMatch[] = [];

    for (const slot of slots) {
      let found = false;
      for (let i = 0; i < cartLines.length; i++) {
        if (usedLineIndexes.has(i)) continue;
        const line = cartLines[i];
        const lineItem = allItems.find((it) => it.id === line.itemId);
        if (!lineItem) continue;
        if (itemCoversSlot(lineItem.id, lineItem.categoryId, slot)) {
          matchedSlots.push({
            slot,
            cartLineIndex: i,
            cartLineId: line.lineId,
            cartLineName: line.name,
            cartLineItemId: line.itemId,
          });
          usedLineIndexes.add(i);
          found = true;
          break;
        }
      }
      if (!found) {
        // slot non coperto — resta in unmatchedSlots
      }
    }

    if (matchedSlots.length === 0) continue;

    const unmatchedSlots = slots.filter(
      (s) => !matchedSlots.some((m) => m.slot.id === s.id),
    );
    const isComplete = unmatchedSlots.length === 0;

    // Calcola risparmio: somma prezzi minimi degli item abbinati meno il prezzo menu
    let matchedItemsTotal = 0;
    for (const match of matchedSlots) {
      const lineItem = allItems.find((it) => it.id === match.cartLineItemId);
      if (lineItem) matchedItemsTotal += minPrice(lineItem.price);
    }
    const menuPrice = minPrice(menuItem.price);
    const savings = matchedItemsTotal - menuPrice;

    results.push({ menuItem, matchedSlots, unmatchedSlots, isComplete, savings });
  }

  return results.sort((a, b) => b.savings - a.savings);
}

/**
 * Verifica se un singolo item del catalogo è selezionabile per uno slot specifico.
 * Usato dal wizard di composizione per filtrare le scelte.
 */
export function itemIsEligibleForSlot(
  item: AdminMenuItem,
  slot: MenuBundleSlot,
): boolean {
  return itemCoversSlot(item.id, item.categoryId, slot);
}
