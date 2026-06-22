"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, X } from "lucide-react";
import type { AdminMenuItem, CartLine } from "@/lib/types";
import { priceVariants, formatEuro } from "@/lib/price-utils";
import { useCartStore } from "@/store/cart-store";
import { spawnCartFly } from "@/lib/cart-fly";
import { cn } from "@/lib/utils";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";
import { AllergenModalCollapsible } from "@/components/modules/menu/allergen-modal-collapsible";
import { SpicyLevelBadge } from "@/components/modules/menu/spicy-level-badge";
import { getResolvedPiccanteLevel } from "@/lib/piccante";
import {
  categoryOffersSenzaLattosio,
  SENZA_LATTOSIO_EXTRA,
} from "@/lib/menu-service-notes";
import { normalizeMenuIngredients, type MenuIngredient } from "@/lib/ingredients";
import { resolveExtrasForItem, type ExtraList } from "@/lib/extra-lists";

export function needsCustomization(
  item: AdminMenuItem,
  extraLists: ExtraList[],
): boolean {
  const variantsCount = priceVariants(item.price).length;
  const hasIngredients =
    (normalizeMenuIngredients(item.id, item.ingredients).length ?? 0) > 0;
  const hasExtras = resolveExtrasForItem(item, extraLists).length > 0;
  const hasVariantGroups = (item.variantGroups ?? []).some((group) => group.options.length > 0);
  const lactose = categoryOffersSenzaLattosio(item.categoryId);
  return variantsCount > 1 || hasIngredients || hasExtras || hasVariantGroups || lactose;
}

export function ItemCustomizer({
  item,
  extraLists,
  onClose,
  editLineId,
  initialLine,
}: {
  item: AdminMenuItem;
  extraLists: ExtraList[];
  onClose: () => void;
  /** Se impostato, salva sostituendo la riga esistente. */
  editLineId?: string;
  initialLine?: CartLine;
}) {
  const variants = priceVariants(item.price);
  const mergedExtras = useMemo(() => {
    const real = [...resolveExtrasForItem(item, extraLists)];
    if (
      categoryOffersSenzaLattosio(item.categoryId) &&
      !real.some((e) => e.id === SENZA_LATTOSIO_EXTRA.id)
    ) {
      return [SENZA_LATTOSIO_EXTRA, ...real];
    }
    return real;
  }, [item, extraLists]);
  const addLine = useCartStore((s) => s.addLine);
  const replaceLine = useCartStore((s) => s.replaceLine);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const [variantKey, setVariantKey] = useState<string>(() => {
    const first = variants[0]?.key ?? "default";
    if (!initialLine?.variantKey) return first;
    return variants.find((v) => v.key === initialLine.variantKey)?.key ?? first;
  });
  const ingredientRows = useMemo<MenuIngredient[]>(
    () => normalizeMenuIngredients(item.id, item.ingredients),
    [item.id, item.ingredients],
  );
  const [removed, setRemoved] = useState<string[]>(() => {
    const rows = normalizeMenuIngredients(item.id, item.ingredients);
    const raw = initialLine?.removedIngredients ?? [];
    if (raw.length === 0) return raw;
    const byId = new Set(rows.map((r) => r.id));
    const isLegacy = raw.some((r) => r && !byId.has(r));
    if (!isLegacy) return raw;
    const out: string[] = [];
    const used = new Map<string, number>();
    for (const token of raw) {
      if (byId.has(token)) {
        out.push(token);
        continue;
      }
      const n = (used.get(token) ?? 0) + 1;
      used.set(token, n);
      const withName = rows.filter((x) => x.name === token);
      const line = withName[n - 1] ?? withName[0];
      if (line) out.push(line.id);
    }
    return out;
  });
  const [extras, setExtras] = useState<string[]>(
    () => initialLine?.addedExtras?.map((e) => e.id) ?? [],
  );
  const [variantChoices, setVariantChoices] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const group of item.variantGroups ?? []) {
      const initial = initialLine?.variantSelections?.find((selection) => selection.groupId === group.id);
      out[group.id] = initial?.optionId ?? group.defaultOptionId ?? group.options[0]?.id ?? "";
    }
    return out;
  });
  const [note, setNote] = useState(() => initialLine?.note ?? "");
  const [qty, setQty] = useState(() => initialLine?.qty ?? 1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    bodyScrollLock();
    return () => bodyScrollUnlock();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const activeVariant = variants.find((v) => v.key === variantKey) ?? variants[0];
  const selectedExtras = useMemo(
    () => mergedExtras.filter((e) => extras.includes(e.id)),
    [mergedExtras, extras],
  );
  const selectedVariantSelections = useMemo(
    () =>
      (item.variantGroups ?? []).flatMap((group) => {
        const optionId = variantChoices[group.id] || group.defaultOptionId || group.options[0]?.id;
        const option = group.options.find((candidate) => candidate.id === optionId);
        if (!option) return [];
        return [{
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          price: option.price ?? 0,
        }];
      }),
    [item.variantGroups, variantChoices],
  );
  const extrasTotal = selectedExtras.reduce((a, e) => a + e.price, 0);
  const variantsTotal = selectedVariantSelections.reduce((a, selection) => a + selection.price, 0);
  const unitPrice = activeVariant.price + extrasTotal + variantsTotal;
  const total = unitPrice * qty;
  const spicyLevel = getResolvedPiccanteLevel(item);

  function toggleRemoveSlot(ingId: string) {
    setRemoved((prev) =>
      prev.includes(ingId) ? prev.filter((x) => x !== ingId) : [...prev, ingId],
    );
  }
  function toggleExtra(id: string) {
    setExtras((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleAdd() {
    const flyFrom = addBtnRef.current?.getBoundingClientRect();
    const payload = {
      itemId: item.id,
      categoryId: item.categoryId,
      name: item.name,
      qty,
      variantKey: activeVariant.key === "default" ? undefined : activeVariant.key,
      variantLabel: activeVariant.label,
      basePrice: activeVariant.price,
      unitPrice,
      removedIngredients: removed.length
        ? [...removed].sort()
        : undefined,
      addedExtras: selectedExtras.length
        ? selectedExtras.map((e) => ({ id: e.id, name: e.name, price: e.price }))
        : undefined,
      variantSelections: selectedVariantSelections.length
        ? selectedVariantSelections
        : undefined,
      note: note.trim() || undefined,
    };
    if (editLineId) {
      replaceLine(editLineId, {
        ...payload,
        bundlePicks: initialLine?.bundlePicks,
      });
    } else {
      addLine(payload);
    }
    onClose();
    spawnCartFly(flyFrom ?? null, item.image ?? null);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-pork-ink/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-pork-cream shadow-2xl sm:max-h-[85dvh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-pork-ink/10 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <div>
            <p className="impact-title text-xs text-pork-red">
              {editLineId ? "Modifica" : "Personalizza"}
            </p>
            <h2 className="headline text-2xl leading-tight">{item.name}</h2>
            {item.description && (
              <p className="mt-1 text-xs text-pork-ink/60">{item.description}</p>
            )}
            {spicyLevel ? (
              <div className="mt-2">
                <SpicyLevelBadge level={spicyLevel} compact />
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full hover:bg-pork-ink/10 active:bg-pork-ink/15"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </header>

        <AllergenModalCollapsible allergens={item.allergens} />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
          {variants.length > 1 && (
            <Section title="Formato">
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setVariantKey(v.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border-2 bg-white p-3 transition-all active:scale-95",
                      variantKey === v.key
                        ? "border-pork-red"
                        : "border-pork-ink/10 hover:border-pork-ink/30",
                    )}
                  >
                    <span className="impact-title text-xs text-pork-ink/70">
                      {v.label ?? "Standard"}
                    </span>
                    <span className="headline text-xl text-pork-red">
                      {formatEuro(v.price)}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {(item.variantGroups ?? []).map((group) => (
            <Section
              key={group.id}
              title={group.name}
              subtitle={group.required ? "Scelta obbligatoria" : "Scelta opzionale"}
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.options.map((option) => {
                  const isSelected = (variantChoices[group.id] || group.defaultOptionId || group.options[0]?.id) === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setVariantChoices((current) => ({ ...current, [group.id]: option.id }))}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border-2 bg-white px-4 py-3 text-left transition-all active:scale-95",
                        isSelected
                          ? "border-pork-red"
                          : "border-pork-ink/10 hover:border-pork-ink/30",
                      )}
                    >
                      <span className="font-semibold">{option.name}</span>
                      {(option.price ?? 0) > 0 ? (
                        <span className="font-impact text-pork-red">+{formatEuro(option.price ?? 0)}</span>
                      ) : (
                        <span className="text-xs font-bold text-pork-ink/45">Incluso</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Section>
          ))}

          {ingredientRows.length > 0 && (
            <Section
              title="Ingredienti"
              subtitle="Ogni riga: − togli una sola unità, + se cambi idea (doppi = due righe)"
            >
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ingredientRows.map((ing) => {
                  const isRemoved = removed.includes(ing.id);
                  return (
                    <li key={ing.id}>
                      <div
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-xl border-2 bg-white px-3 py-2 text-left text-sm",
                          isRemoved
                            ? "border-pork-red/40 bg-pork-red/5"
                            : "border-pork-ink/10",
                        )}
                      >
                        <span
                          className={cn(
                            "min-w-0 flex-1 leading-snug",
                            isRemoved && "text-pork-red/80 line-through",
                          )}
                        >
                          {ing.name}
                        </span>
                        {isRemoved ? (
                          <button
                            type="button"
                            onClick={() => toggleRemoveSlot(ing.id)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pork-green/15 text-pork-green transition hover:bg-pork-green/25"
                            title="Rimetti"
                            aria-label={`Rimetti ${ing.name}`}
                          >
                            <Plus size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleRemoveSlot(ing.id)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pork-ink/10 text-pork-ink transition hover:bg-pork-red/20 hover:text-pork-red"
                            title="Togli questa unità"
                            aria-label={`Togli ${ing.name}`}
                          >
                            <Minus size={16} />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {removed.length > 0 && (
                <p className="mt-2 text-[11px] text-pork-ink/70">
                  Escluso:{" "}
                  {removed
                    .map((id) => {
                      const r = ingredientRows.find((x) => x.id === id);
                      return r?.name ?? id;
                    })
                    .join(", ")}
                </p>
              )}
            </Section>
          )}

          {mergedExtras.length > 0 && (
            <Section title="Aggiunte" subtitle="Sovrapprezzo per ognuna">
              <ul className="space-y-2">
                {mergedExtras.map((extra) => {
                  const isAdded = extras.includes(extra.id);
                  return (
                    <li key={extra.id}>
                      <button
                        type="button"
                        onClick={() => toggleExtra(extra.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl border-2 bg-white px-4 py-3 text-left transition-all active:scale-95",
                          isAdded
                            ? "border-pork-red"
                            : "border-pork-ink/10 hover:border-pork-ink/30",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                              isAdded
                                ? "bg-pork-red text-white"
                                : "bg-pork-ink/10 text-pork-ink/40",
                            )}
                          >
                            {isAdded ? "✓" : "+"}
                          </span>
                          <span className="font-semibold">{extra.name}</span>
                        </div>
                        <span className="font-impact text-pork-red">
                          +{formatEuro(extra.price)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          <Section title="Nota per la cucina" subtitle="Opzionale">
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es. ben cotto, senza sale, da dividere…"
              className="w-full resize-none rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2.5 text-base outline-none focus:border-pork-red sm:text-sm"
            />
          </Section>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-pork-ink/10 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <div className="inline-flex items-center gap-1 rounded-full bg-pork-cream p-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-pork-ink shadow-sm hover:bg-pork-ink hover:text-pork-cream sm:h-9 sm:w-9"
              aria-label="Rimuovi uno"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-9 text-center text-lg font-bold tabular-nums sm:text-base">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-pork-ink shadow-sm hover:bg-pork-ink hover:text-pork-cream sm:h-9 sm:w-9"
              aria-label="Aggiungi uno"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            ref={addBtnRef}
            type="button"
            onClick={handleAdd}
            className="btn-primary flex-1 text-base"
          >
            {editLineId ? "Salva" : "Aggiungi"} · {formatEuro(total)}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="impact-title text-sm">{title}</h3>
        {subtitle && (
          <span className="text-[11px] text-pork-ink/50">{subtitle}</span>
        )}
      </header>
      {children}
    </section>
  );
}
