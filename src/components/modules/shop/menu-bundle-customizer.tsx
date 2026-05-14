"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, Search, X } from "lucide-react";
import type { AdminMenuItem, BundlePick, CartLine } from "@/lib/types";
import { priceVariants, formatEuro } from "@/lib/price-utils";
import { useCartStore } from "@/store/cart-store";
import { spawnCartFly } from "@/lib/cart-fly";
import { useMenuStore } from "@/store/menu-store";
import { bundleSlotOptionGroups } from "@/lib/menu-bundle";
import { cn } from "@/lib/utils";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";
import { AllergenModalCollapsible } from "@/components/modules/menu/allergen-modal-collapsible";
import { SpicyLevelBadge } from "@/components/modules/menu/spicy-level-badge";
import { getResolvedPiccanteLevel } from "@/lib/piccante";

function bundlePicksToMap(picks?: BundlePick[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of picks ?? []) {
    out[p.slotId] = p.choiceItemId;
  }
  return out;
}

export function MenuBundleCustomizer({
  item,
  onClose,
  editLineId,
  initialLine,
}: {
  item: AdminMenuItem;
  onClose: () => void;
  editLineId?: string;
  initialLine?: CartLine;
}) {
  const slots = useMemo(() => item.bundleSlots ?? [], [item.bundleSlots]);
  const allItems = useMenuStore((s) => s.items);
  const categories = useMenuStore((s) => s.categories);
  const addLine = useCartStore((s) => s.addLine);
  const replaceLine = useCartStore((s) => s.replaceLine);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const variants = priceVariants(item.price);
  const [variantKey, setVariantKey] = useState(() => {
    const first = variants[0]?.key ?? "default";
    if (!initialLine?.variantKey) return first;
    return variants.find((v) => v.key === initialLine.variantKey)?.key ?? first;
  });
  const [pickBySlot, setPickBySlot] = useState<Record<string, string>>(() =>
    bundlePicksToMap(initialLine?.bundlePicks),
  );
  const [query, setQuery] = useState("");
  const [activeSlotId, setActiveSlotId] = useState(slots[0]?.id ?? "");
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
  const activeSlot = slots.find((s) => s.id === activeSlotId) ?? slots[0];

  const groups = useMemo(() => {
    if (!activeSlot) return [];
    return bundleSlotOptionGroups(activeSlot, allItems, categories);
  }, [activeSlot, allItems, categories]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            (it.description?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  const bundlePicks: BundlePick[] | undefined = useMemo(() => {
    if (slots.length === 0) return undefined;
    const out: BundlePick[] = [];
    for (const sl of slots) {
      const choiceItemId = pickBySlot[sl.id];
      if (!choiceItemId) return undefined;
      const picked = allItems.find((i) => i.id === choiceItemId);
      if (!picked) return undefined;
      out.push({
        slotId: sl.id,
        slotLabel: sl.label,
        choiceItemId,
        choiceName: picked.name,
      });
    }
    return out;
  }, [slots, pickBySlot, allItems]);

  const complete = bundlePicks !== undefined && bundlePicks.length === slots.length;
  const unitPrice = activeVariant?.price ?? 0;
  const total = unitPrice * qty;
  const spicyLevel = getResolvedPiccanteLevel(item);

  function selectChoice(slotId: string, choiceItemId: string) {
    setPickBySlot((prev) => ({ ...prev, [slotId]: choiceItemId }));
    const idx = slots.findIndex((s) => s.id === slotId);
    if (idx >= 0 && idx < slots.length - 1) {
      setActiveSlotId(slots[idx + 1]!.id);
      setQuery("");
    }
  }

  function handleAdd() {
    if (!complete || !bundlePicks || !activeVariant) return;
    const flyFrom = addBtnRef.current?.getBoundingClientRect();
    const payload = {
      itemId: item.id,
      categoryId: item.categoryId,
      name: item.name,
      qty,
      variantKey: activeVariant.key === "default" ? undefined : activeVariant.key,
      variantLabel: activeVariant.label,
      basePrice: activeVariant.price,
      unitPrice: activeVariant.price,
      bundlePicks,
      note: note.trim() || undefined,
    };
    if (editLineId) {
      replaceLine(editLineId, payload);
    } else {
      addLine(payload);
    }
    onClose();
    spawnCartFly(flyFrom ?? null, item.image ?? null);
  }

  if (!mounted || slots.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-pork-ink/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-pork-cream shadow-2xl sm:max-h-[88dvh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-pork-ink/10 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <div>
            <p className="impact-title text-xs text-pork-red">
              {editLineId ? "Modifica" : "Menu fisso"}
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
            <section className="mb-5">
              <h3 className="impact-title mb-2 text-sm">Formato</h3>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setVariantKey(v.key)}
                    className={cn(
                      "rounded-xl border-2 bg-white p-3 text-center transition-all active:scale-95",
                      variantKey === v.key
                        ? "border-pork-red"
                        : "border-pork-ink/10 hover:border-pork-ink/30",
                    )}
                  >
                    <span className="impact-title text-xs text-pork-ink/70">
                      {v.label ?? "Standard"}
                    </span>
                    <p className="headline text-lg text-pork-red">{formatEuro(v.price)}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          <nav className="mb-4 flex flex-wrap gap-2" aria-label="Passi scelta menu">
            {slots.map((sl) => {
              const done = Boolean(pickBySlot[sl.id]);
              const isActive = sl.id === activeSlotId;
              return (
                <button
                  key={sl.id}
                  type="button"
                  onClick={() => {
                    setActiveSlotId(sl.id);
                    setQuery("");
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors",
                    isActive
                      ? "bg-pork-ink text-pork-cream"
                      : done
                        ? "bg-pork-green/20 text-pork-ink"
                        : "bg-pork-ink/10 text-pork-ink/70",
                  )}
                >
                  {sl.label}
                  {done ? " ✓" : ""}
                </button>
              );
            })}
          </nav>

          {activeSlot && (
            <section>
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="impact-title text-sm">{activeSlot.label}</h3>
                  {activeSlot.hint && (
                    <p className="text-[11px] text-pork-ink/55">{activeSlot.hint}</p>
                  )}
                </div>
              </div>

              <div className="relative mb-3">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pork-ink/35"
                  size={16}
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca nel listino…"
                  className="w-full rounded-xl border-2 border-pork-ink/10 bg-white py-2.5 pl-10 pr-3 text-base outline-none focus:border-pork-red sm:text-sm"
                />
              </div>

              <div className="space-y-5">
                {filteredGroups.length === 0 ? (
                  <p className="text-sm text-pork-ink/50">Nessun risultato.</p>
                ) : (
                  filteredGroups.map((g) => (
                    <div key={g.categoryId}>
                      <p className="impact-title mb-2 text-xs text-pork-red">{g.title}</p>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {g.items.map((it) => {
                          const selected = pickBySlot[activeSlot.id] === it.id;
                          return (
                            <li key={it.id}>
                              <button
                                type="button"
                                onClick={() => selectChoice(activeSlot.id, it.id)}
                                className={cn(
                                  "flex w-full flex-col items-start gap-0.5 rounded-xl border-2 bg-white px-3 py-2.5 text-left text-sm transition-all active:scale-[0.98]",
                                  selected
                                    ? "border-pork-red ring-1 ring-pork-red/30"
                                    : "border-pork-ink/10 hover:border-pork-ink/25",
                                )}
                              >
                                <span className="font-bold leading-tight">{it.name}</span>
                                {it.description && (
                                  <span className="line-clamp-2 text-[11px] text-pork-ink/55">
                                    {it.description}
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          <section className="mt-5">
            <h3 className="impact-title mb-2 text-sm">Nota per la cucina</h3>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opzionale"
              className="w-full resize-none rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2.5 text-base outline-none focus:border-pork-red sm:text-sm"
            />
          </section>
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
            disabled={!complete}
            onClick={handleAdd}
            className="btn-primary flex-1 text-base disabled:cursor-not-allowed disabled:opacity-40"
          >
            {editLineId ? "Salva" : "Aggiungi"} · {formatEuro(total)}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
