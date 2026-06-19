"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useMenuStore } from "@/store/menu-store";
import { detectMenuOpportunities } from "@/lib/menu-detection";
import { formatEuro, minPrice } from "@/lib/price-utils";
import { priceVariants } from "@/lib/price-utils";
import type { AdminMenuItem, BundlePick, CartLine } from "@/lib/types";
import { MenuBundleCustomizer } from "./menu-bundle-customizer";

/**
 * Mostra le opportunità di conversione menu nel carrello.
 * Per ogni match completo mostra la group box "Fai il menu e risparmi X€".
 * Se l'utente clicca, le righe singole vengono sostituite dalla riga menu con
 * i bundle picks pre-compilati dalle scelte già presenti nel carrello.
 */
export function CartMenuConversion({ lines }: { lines: CartLine[] }) {
  const allItems = useMenuStore((s) => s.items);
  const allCategories = useMenuStore((s) => s.categories);
  const removeLine = useCartStore((s) => s.removeLine);
  const addLine = useCartStore((s) => s.addLine);

  const [bundleItem, setBundleItem] = useState<AdminMenuItem | null>(null);
  const [bundleInitial, setBundleInitial] = useState<CartLine | null>(null);
  // oppportunità già rifiutate dall'utente (per non ricomparire)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const opportunities = useMemo(
    () => detectMenuOpportunities(lines, allItems, allCategories),
    [lines, allItems, allCategories],
  );

  const visible = opportunities.filter(
    (op) => op.isComplete && op.savings > 0 && !dismissed.has(op.menuItem.id),
  );

  if (visible.length === 0) return null;

  function convertToMenu(op: (typeof visible)[number]) {
    const menuItem = op.menuItem;
    const variant = priceVariants(menuItem.price)[0];
    if (!variant) return;

    const bundlePicks: BundlePick[] = op.matchedSlots.map((m) => ({
      slotId: m.slot.id,
      slotLabel: m.slot.label,
      choiceItemId: m.cartLineItemId,
      choiceName: m.cartLineName,
    }));

    // Rimuove le righe singole che vengono inglobate nel menu
    for (const match of op.matchedSlots) {
      removeLine(match.cartLineId);
    }

    // Aggiunge la riga menu con i picks pre-compilati
    addLine({
      itemId: menuItem.id,
      categoryId: menuItem.categoryId,
      name: menuItem.name,
      qty: 1,
      variantKey: variant.key === "default" ? undefined : variant.key,
      variantLabel: variant.label,
      basePrice: variant.price,
      unitPrice: variant.price,
      bundlePicks,
    });
  }

  function openBundleEditor(op: (typeof visible)[number]) {
    const menuItem = op.menuItem;
    // Costruisce una CartLine temporanea con i picks pre-compilati per pre-popolare il wizard
    const variant = priceVariants(menuItem.price)[0];
    if (!variant) return;
    const preFilled: CartLine = {
      lineId: "",
      itemId: menuItem.id,
      categoryId: menuItem.categoryId,
      name: menuItem.name,
      qty: 1,
      basePrice: variant.price,
      unitPrice: variant.price,
      bundlePicks: op.matchedSlots.map((m) => ({
        slotId: m.slot.id,
        slotLabel: m.slot.label,
        choiceItemId: m.cartLineItemId,
        choiceName: m.cartLineName,
      })),
    };

    // Rimuove le righe singole prima di aprire il wizard
    for (const match of op.matchedSlots) {
      removeLine(match.cartLineId);
    }

    setBundleItem(menuItem);
    setBundleInitial(preFilled);
  }

  return (
    <>
      <div className="mx-5 mb-4 space-y-3">
        {visible.map((op) => {
          const menuPrice = minPrice(op.menuItem.price);
          const isComplete = op.unmatchedSlots.length === 0;

          return (
            <div
              key={op.menuItem.id}
              className="rounded-2xl border border-pork-mustard/50 bg-pork-mustard/10 px-4 py-3"
            >
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles size={13} className="shrink-0 text-pork-red" />
                <p className="text-xs font-black uppercase tracking-wide text-pork-red">
                  Offerta menu
                </p>
              </div>

              <p className="text-sm font-bold text-pork-ink">
                {op.menuItem.name}
              </p>

              <ul className="mt-1 space-y-0.5">
                {op.matchedSlots.map((m) => (
                  <li key={m.slot.id} className="text-[11px] text-pork-ink/70">
                    <span className="font-semibold">{m.slot.label}:</span>{" "}
                    {m.cartLineName}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-impact text-lg text-pork-red">
                    {formatEuro(menuPrice)}
                  </p>
                  <p className="text-xs font-semibold text-pork-ink/60">
                    Risparmi{" "}
                    <span className="text-pork-green font-bold">
                      {formatEuro(op.savings)}
                    </span>
                    {" "}rispetto ai singoli
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDismissed((s) => new Set([...s, op.menuItem.id]))}
                    className="rounded-full px-3 py-1.5 text-xs font-bold text-pork-ink/50 hover:bg-pork-ink/10"
                  >
                    No grazie
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isComplete) {
                        convertToMenu(op);
                      } else {
                        openBundleEditor(op);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-black text-pork-cream hover:bg-pork-red"
                  >
                    Fai il menu <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {bundleItem && (
        <MenuBundleCustomizer
          item={bundleItem}
          initialLine={bundleInitial ?? undefined}
          onClose={() => {
            setBundleItem(null);
            setBundleInitial(null);
          }}
        />
      )}
    </>
  );
}
