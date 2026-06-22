import type { PriceFormat } from "./menu-data";
import { categoryOffersSenzaLattosio } from "./menu-service-notes";
import { resolveExtrasForItem, type ExtraList } from "./extra-lists";
import { normalizeMenuIngredients } from "./ingredients";
import type { AdminMenuItem } from "./types";

export type PriceVariant = {
  key: string;
  label?: string;
  price: number;
};

/** Solo prezzi multipli, senza ingredienti/extra da configurare. */
export function hasOnlyPriceVariants(
  item: AdminMenuItem,
  extraLists: ExtraList[],
): boolean {
  const v = priceVariants(item.price);
  if (v.length <= 1) return false;
  const hasIng = normalizeMenuIngredients(item.id, item.ingredients).length > 0;
  const hasEx = resolveExtrasForItem(item, extraLists).length > 0;
  const hasVariantGroups = (item.variantGroups ?? []).some((group) => group.options.length > 0);
  if (hasIng || hasEx || hasVariantGroups) return false;
  if (categoryOffersSenzaLattosio(item.categoryId)) return false;
  return true;
}

export function priceVariants(price: PriceFormat): PriceVariant[] {
  switch (price.kind) {
    case "single":
      return [{ key: "default", price: price.value }];
    case "sized":
      return [
        { key: "small", label: "Small", price: price.small },
        { key: "big", label: "Big", price: price.big },
      ];
    case "persone":
      return [
        { key: "per2", label: "2 persone", price: price.per2 },
        { key: "per4", label: "4 persone", price: price.per4 },
      ];
    case "volume":
      if (price.variants?.length) {
        return price.variants.map((variant) => ({
          key: variant.id,
          label: variant.label,
          price: variant.price,
        }));
      }
      return [
        { key: "small", label: price.small.label, price: price.small.price },
        { key: "large", label: price.large.label, price: price.large.price },
      ];
  }
}

export function formatEuro(n: number): string {
  return `€ ${n.toFixed(2).replace(".", ",")}`;
}

export function minPrice(price: PriceFormat): number {
  const variants = priceVariants(price);
  return Math.min(...variants.map((v) => v.price));
}

export function hasMultipleVariants(price: PriceFormat): boolean {
  return priceVariants(price).length > 1;
}
