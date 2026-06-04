"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Flame, Heart, Leaf, Minus, Plus, Star, X, XCircle } from "lucide-react";
import type { AdminMenuItem } from "@/lib/types";
import {
  priceVariants,
  formatEuro,
  hasOnlyPriceVariants,
} from "@/lib/price-utils";
import { PriceSticker } from "@/components/modules/menu/price-sticker";
import { cn } from "@/lib/utils";
import { useCartStore, cartQtyForItem } from "@/store/cart-store";
import { useModalAnimation } from "@/lib/use-modal-animation";
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
import { useSettingsStore } from "@/store/settings-store";
import {
  formatIngredientsLine,
  normalizeMenuIngredients,
} from "@/lib/ingredients";
import { FormatoChoiceModal } from "@/components/modules/shop/formato-choice-modal";
import { AllergenBadges } from "@/components/modules/menu/allergen-badges";
import { SpicyLevelBadge } from "@/components/modules/menu/spicy-level-badge";
import { getResolvedPiccanteLevel } from "@/lib/piccante";
import { useMenuStore } from "@/store/menu-store";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";
import { resolveExtrasForItem } from "@/lib/extra-lists";
import { activeMenuTags, menuTagLabel } from "@/lib/menu-tags";

const tagMeta: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
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

const priceVariantColors: Array<"mustard" | "red" | "green" | "pink"> = ["mustard", "red", "green", "pink"];

export function MenuCardInteractive({ item }: { item: AdminMenuItem }) {
  const tenant = useTenant();
  const pathname = usePathname();
  const { allowTakeaway, allowTableOrders, orderKioskEnabled, favoritesEnabled } = useEffectiveFeatures();
  const showMenuPricesSetting = useSettingsStore((state) => state.showMenuPrices);
  const onlineOrderingActive = allowTakeaway || allowTableOrders || orderKioskEnabled;
  const showPrices = onlineOrderingActive || showMenuPricesSetting;
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
  const [detailOpen, setDetailOpen] = useState(false);

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

  function handleCardKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key !== "Enter" && e.key !== " ") return;
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    e.preventDefault();
    setDetailOpen(true);
  }

  function handleOrderFromDetail() {
    setDetailOpen(false);
    handleAddClick();
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
      role="button"
      tabIndex={0}
      aria-label={`Apri dettagli di ${item.name}`}
      onClick={() => setDetailOpen(true)}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-pork-ink/5 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pork-red/35",
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
          onClick={(e) => {
            e.stopPropagation();
            toggleFav(item.id);
          }}
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
          {activeMenuTags(item)
            ?.filter((t) => t !== "piccante")
            .map((t) => {
              const meta = tagMeta[t] ?? {
                label: menuTagLabel(t),
                icon: <Star size={12} />,
                className: "bg-pork-ink text-pork-cream",
              };
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
            {showPrices ? (
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
            ) : (
              <div className="min-w-0 flex-1" />
            )}

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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddClick();
                    }}
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

      {detailOpen && (
        <MenuItemDetailModal
          item={item}
          showPrices={showPrices}
          showOrder={showAdd}
          serviceNotes={serviceNotes}
          extraLists={extraLists}
          orderLabel={
            hasMenuBundle(item)
              ? "Scegli nel menu"
              : hasOnlyPriceVariants(item, extraLists)
                ? "Scegli formato"
                : canCustomize
                  ? "Personalizza"
                  : "Aggiungi"
          }
          onClose={() => setDetailOpen(false)}
          onOrder={handleOrderFromDetail}
        />
      )}
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

function MenuItemDetailModal({
  item,
  showPrices,
  showOrder,
  serviceNotes,
  extraLists,
  orderLabel,
  onClose,
  onOrder,
}: {
  item: AdminMenuItem;
  showPrices: boolean;
  showOrder: boolean;
  serviceNotes: ReturnType<typeof getMenuServiceNotes>;
  extraLists: ReturnType<typeof useMenuStore.getState>["extraLists"];
  orderLabel: string;
  onClose: () => void;
  onOrder: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { closing, requestClose, panelRef } = useModalAnimation(onClose);
  const variants = priceVariants(item.price);
  const ingredientRows = useMemo(
    () => normalizeMenuIngredients(item.id, item.ingredients),
    [item.id, item.ingredients],
  );
  const extras = useMemo(() => resolveExtrasForItem(item, extraLists), [item, extraLists]);
  const spicyLevel = getResolvedPiccanteLevel(item);

  useEffect(() => {
    setMounted(true);
    bodyScrollLock();
    return () => bodyScrollUnlock();
  }, []);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[80] flex items-end justify-center bg-pork-ink/70 backdrop-blur-sm sm:items-center",
        closing ? "motion-safe:animate-modal-overlay-out" : "motion-safe:animate-modal-overlay-in",
      )}
      onClick={(e) => {
        e.stopPropagation();
        requestClose();
      }}
    >
      <div
        ref={panelRef}
        className={cn(
          "flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-pork-cream shadow-2xl sm:max-h-[88dvh] sm:rounded-3xl",
          closing
            ? "motion-safe:animate-modal-sheet-out motion-safe:sm:animate-modal-scale-out"
            : "motion-safe:animate-modal-sheet-in motion-safe:sm:animate-modal-scale-in",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {item.image ? (
          <div className="relative aspect-[16/10] max-h-[42dvh] w-full shrink-0 overflow-hidden bg-pork-ink/5">
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={requestClose}
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-pork-ink shadow-md transition hover:bg-pork-red hover:text-white"
              aria-label="Chiudi"
            >
              <X size={20} />
            </button>
          </div>
        ) : null}

        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-pork-ink/10 px-5 py-4">
          <div className="min-w-0">
            <p className="impact-title text-xs text-pork-red">Dettaglio piatto</p>
            <h2 className="headline text-3xl leading-tight text-pork-ink">{item.name}</h2>
            {item.description && (
              <p className="mt-2 text-sm leading-relaxed text-pork-ink/70">
                {item.description}
              </p>
            )}
          </div>
          {!item.image && (
            <button
              type="button"
              onClick={requestClose}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full hover:bg-pork-ink/10 active:bg-pork-ink/15"
              aria-label="Chiudi"
            >
              <X size={20} />
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-5 py-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.abv && (
              <span className="chip bg-pork-ink text-pork-cream">{item.abv} vol.</span>
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

          {showPrices && (
            <DetailSection title="Prezzo">
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <div
                    key={v.key}
                    className="rounded-2xl border border-pork-ink/10 bg-white px-4 py-3"
                  >
                    <p className="impact-title text-xs text-pork-ink/55">
                      {v.label ?? "Standard"}
                    </p>
                    <p className="headline text-2xl text-pork-red">
                      {formatEuro(v.price)}
                    </p>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          {ingredientRows.length > 0 && (
            <DetailSection title="Ingredienti">
              <p className="text-sm leading-relaxed text-pork-ink/70">
                {formatIngredientsLine(ingredientRows)}
              </p>
            </DetailSection>
          )}

          {extras.length > 0 && (
            <DetailSection title="Aggiunte disponibili">
              <ul className="grid gap-2 sm:grid-cols-2">
                {extras.map((extra) => (
                  <li
                    key={extra.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-semibold">{extra.name}</span>
                    <span className="font-impact text-pork-red">
                      +{formatEuro(extra.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {item.bundleSlots && item.bundleSlots.length > 0 && (
            <DetailSection title="Opzioni menu">
              <ul className="space-y-2">
                {item.bundleSlots.map((slot) => (
                  <li key={slot.id} className="rounded-xl bg-white px-3 py-2">
                    <p className="impact-title text-xs text-pork-ink/70">{slot.label}</p>
                    {slot.hint && (
                      <p className="mt-1 text-xs text-pork-ink/55">{slot.hint}</p>
                    )}
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {serviceNotes.length > 0 && (
            <DetailSection title="Note">
              <ul className="space-y-1 text-sm leading-relaxed text-pork-ink/65">
                {serviceNotes.map((k) => (
                  <li key={k}>{menuServiceNoteText(k)}</li>
                ))}
              </ul>
            </DetailSection>
          )}
        </div>

        <footer className="flex shrink-0 gap-2 border-t border-pork-ink/10 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <button type="button" onClick={requestClose} className="btn-ghost flex-1">
            Chiudi
          </button>
          {showOrder && (
            <button type="button" onClick={onOrder} className="btn-primary flex-1">
              {orderLabel}
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="impact-title mb-2 text-sm text-pork-ink">{title}</h3>
      {children}
    </section>
  );
}
