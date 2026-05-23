"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Flame, Heart, Leaf, Minus, Plus, Star, XCircle } from "lucide-react";
import type { AdminMenuItem } from "@/lib/types";
import {
  priceVariants,
  formatEuro,
  hasOnlyPriceVariants,
} from "@/lib/price-utils";
import { PriceSticker } from "@/components/modules/menu/price-sticker";
import { cn } from "@/lib/utils";
import { useCartStore, cartQtyForItem } from "@/store/cart-store";
import { spawnCartFly } from "@/lib/cart-fly";
import { useFavoritesStore } from "@/store/favorites-store";
import { ItemCustomizer, needsCustomization } from "@/components/modules/shop/item-customizer";
import { MenuBundleCustomizer } from "@/components/modules/shop/menu-bundle-customizer";
import { hasMenuBundle } from "@/lib/menu-bundle";
import {
  getMenuServiceNotes,
  menuServiceNoteText,
} from "@/lib/menu-service-notes";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useTenant } from "@/components/core/tenant-provider";
import { canAddToCart } from "@/lib/ordering-rules";
import {
  formatIngredientsLine,
  normalizeMenuIngredients,
} from "@/lib/ingredients";
import { FormatoChoiceModal } from "@/components/modules/shop/formato-choice-modal";
import { AllergenBadges } from "@/components/modules/menu/allergen-badges";
import { SpicyLevelBadge } from "@/components/modules/menu/spicy-level-badge";
import { getResolvedPiccanteLevel } from "@/lib/piccante";
import { useMenuStore } from "@/store/menu-store";

const tagMeta: Record<
  NonNullable<AdminMenuItem["tags"]>[number],
  { label: string; icon: React.ReactNode; className: string }
> = {
  firma: {
    label: "Firma",
    icon: <Star size={12} />,
    className: "bg-pork-red text-white",
  },
  piccante: {
    label: "Piccante",
    icon: <Flame size={12} />,
    className: "bg-pork-mustard text-pork-ink",
  },
  veg: {
    label: "Veg",
    icon: <Leaf size={12} />,
    className: "bg-pork-green text-white",
  },
  novita: {
    label: "Novità",
    icon: <Star size={12} />,
    className: "bg-pork-pink text-white",
  },
};

const priceVariantColors: Array<"mustard" | "red"> = ["mustard", "red"];

export function MenuCardInteractive({ item }: { item: AdminMenuItem }) {
  const tenant = useTenant();
  const pathname = usePathname();
  const { allowTakeaway, allowTableOrders, favoritesEnabled } = useEffectiveFeatures();
  const orderingAllowed = canAddToCart(pathname, {
    allowTakeaway,
    allowTableOrders,
  });

  const variants = priceVariants(item.price);
  const serviceNotes = getMenuServiceNotes(item.categoryId, item);
  const cardServiceNotes = useMemo(
    () =>
      serviceNotes.filter((k) => k !== "aggiunte" && k !== "senzaLattosio"),
    [serviceNotes],
  );
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [formatoOpen, setFormatoOpen] = useState(false);

  const lines = useCartStore((s) => s.lines);
  const addLine = useCartStore((s) => s.addLine);
  const decOneUnitOfItem = useCartStore((s) => s.decOneUnitOfItem);
  const extraLists = useMenuStore((s) => s.extraLists);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const qtyInCart = useMemo(
    () => cartQtyForItem(lines, item.id),
    [lines, item.id],
  );
  const favIds = useFavoritesStore((s) => s.ids);
  const toggleFav = useFavoritesStore((s) => s.toggle);
  const isFav = favIds.includes(item.id);

  const unavailable = !item.available;
  const canCustomize = needsCustomization(item, extraLists);
  const spicyLevel = getResolvedPiccanteLevel(item);

  function handleAddClick() {
    if (unavailable || !orderingAllowed) return;
    if (hasMenuBundle(item)) {
      setBundleOpen(true);
      return;
    }
    if (hasOnlyPriceVariants(item, extraLists)) {
      setFormatoOpen(true);
      return;
    }
    if (canCustomize) {
      setCustomizerOpen(true);
    } else {
      const variant = variants[0];
      addLine({
        itemId: item.id,
        categoryId: item.categoryId,
        name: item.name,
        qty: 1,
        variantKey:
          variant.key === "default" ? undefined : variant.key,
        variantLabel: variant.label,
        basePrice: variant.price,
        unitPrice: variant.price,
      });
      spawnCartFly(
        addBtnRef.current?.getBoundingClientRect(),
        item.image ?? null,
      );
    }
  }

  function handleDecClick(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (unavailable || !orderingAllowed || qtyInCart <= 0) return;
    decOneUnitOfItem(item.id);
  }

  const multiPrice = variants.length > 1;
  const showAdd = orderingAllowed && !unavailable;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-pork-ink/5 transition-all",
        unavailable
          ? "opacity-70"
          : "hover:-translate-y-1 hover:shadow-xl",
      )}
    >
      {unavailable && (
        <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-pork-ink px-3 py-1 text-[10px] font-black uppercase tracking-wide text-pork-cream">
          <XCircle size={12} /> Esaurito
        </div>
      )}

      {favoritesEnabled && tenant.features.favorites && (
        <button
          type="button"
          aria-label={isFav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
          aria-pressed={isFav}
          onClick={() => toggleFav(item.id)}
          className={cn(
            "absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all active:scale-90",
            isFav
              ? "bg-pork-red text-white"
              : "bg-white/90 text-pork-ink hover:bg-pork-red hover:text-white",
          )}
        >
          <Heart size={18} fill={isFav ? "currentColor" : "none"} />
        </button>
      )}

      {item.image ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-pork-ink/5">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className={cn(
              "object-cover transition-transform duration-700",
              unavailable ? "grayscale" : "group-hover:scale-105",
            )}
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="impact-title text-2xl leading-tight text-pork-ink">
            {item.name}
          </h3>
        </div>

        {item.description && (
          <p className="text-sm leading-relaxed text-pork-ink/70">
            {item.description}
          </p>
        )}

        {item.ingredients && item.ingredients.length > 0 && (
          <p className="text-xs italic text-pork-ink/50">
            {formatIngredientsLine(
              normalizeMenuIngredients(item.id, item.ingredients),
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {item.abv && (
            <span className="chip bg-pork-ink text-pork-cream">
              {item.abv} vol.
            </span>
          )}
          <AllergenBadges allergens={item.allergens} />
          {spicyLevel ? <SpicyLevelBadge level={spicyLevel} /> : null}
          {item.tags
            ?.filter((t) => t !== "piccante")
            .map((t) => {
              const meta = tagMeta[t];
              return (
                <span
                  key={t}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                    meta.className,
                  )}
                >
                  {meta.icon}
                  {meta.label}
                </span>
              );
            })}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 shrink-0 flex-col items-start gap-1.5">
              {!multiPrice ? (
                <PriceSticker variant="mustard" rotate={-3}>
                  {formatEuro(variants[0]?.price ?? 0)}
                  {variants[0]?.label && (
                    <span className="ml-1 text-xs font-normal opacity-80">
                      {variants[0].label}
                    </span>
                  )}
                </PriceSticker>
              ) : (
                <div className="flex flex-wrap items-end gap-1.5">
                  {variants.map((v, i) => (
                    <PriceSticker
                      key={v.key}
                      variant={priceVariantColors[i % 2]}
                      rotate={i % 2 === 0 ? -3 : 3}
                    >
                      {formatEuro(v.price)}
                      {v.label && (
                        <span className="ml-1 text-xs font-normal opacity-80">
                          {v.label}
                        </span>
                      )}
                    </PriceSticker>
                  ))}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              {hasMenuBundle(item) && showAdd && (
                <span className="hidden rounded-full bg-pork-mustard/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-pork-ink sm:block">
                  Scegli nel menu
                </span>
              )}
              {canCustomize &&
                !hasMenuBundle(item) &&
                !hasOnlyPriceVariants(item, extraLists) &&
                showAdd && (
                  <span className="hidden rounded-full bg-pork-mustard/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-pork-ink sm:block">
                    Personalizza
                  </span>
                )}
              {showAdd && (
                <div className="inline-flex items-center gap-1">
                  {qtyInCart > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleDecClick}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-pork-ink/10 text-pork-ink shadow ring-1 ring-pork-ink/15 transition-all hover:bg-pork-red hover:text-white active:scale-90"
                        aria-label={`Rimuovi una porzione di ${item.name} dal carrello`}
                      >
                        <Minus size={18} />
                      </button>
                      <span className="min-w-[1.75rem] text-center font-impact text-xl tabular-nums text-pork-ink">
                        {qtyInCart}
                      </span>
                    </>
                  )}
                  <button
                    ref={addBtnRef}
                    type="button"
                    onClick={handleAddClick}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-pork-ink text-pork-cream shadow-lg transition-all hover:bg-pork-red active:scale-90"
                    aria-label={`Aggiungi ${item.name} al carrello`}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {cardServiceNotes.length > 0 && (
            <ul className="space-y-0.5 text-[11px] leading-snug text-pork-ink/55">
              {cardServiceNotes.map((k) => (
                <li key={k}>{menuServiceNoteText(k)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {customizerOpen && (
        <ItemCustomizer
          item={item}
          extraLists={extraLists}
          onClose={() => setCustomizerOpen(false)}
        />
      )}
      {bundleOpen && (
        <MenuBundleCustomizer item={item} onClose={() => setBundleOpen(false)} />
      )}
      {formatoOpen && (
        <FormatoChoiceModal
          item={item}
          onClose={() => setFormatoOpen(false)}
          onConfirm={(v, flyFrom) => {
            addLine({
              itemId: item.id,
              categoryId: item.categoryId,
              name: item.name,
              qty: 1,
              variantKey: v.key === "default" ? undefined : v.key,
              variantLabel: v.label,
              basePrice: v.price,
              unitPrice: v.price,
            });
            setFormatoOpen(false);
            spawnCartFly(flyFrom ?? null, item.image ?? null);
          }}
        />
      )}
    </article>
  );
}
