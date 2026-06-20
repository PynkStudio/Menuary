"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useCartStore } from "@/store/cart-store";
import { useMenuStore } from "@/store/menu-store";
import { formatEuro, minPrice, priceVariants, hasOnlyPriceVariants } from "@/lib/price-utils";
import { needsCustomization, ItemCustomizer } from "@/components/modules/shop/item-customizer";
import { MenuBundleCustomizer } from "@/components/modules/shop/menu-bundle-customizer";
import { FormatoChoiceModal } from "@/components/modules/shop/formato-choice-modal";
import { hasMenuBundle } from "@/lib/menu-bundle";
import { spawnCartFly } from "@/lib/cart-fly";
import type { AdminMenuItem, CartLine, MenuOrderChannel } from "@/lib/types";

type Hint = { itemId: string; name: string; text: string };

export function CartAiUpsell({
  lines,
  channel = "site",
  tableId,
}: {
  lines: CartLine[];
  channel?: MenuOrderChannel;
  tableId?: string | null;
}) {
  const tenant = useTenant();
  const { modules } = useEffectiveFeatures();
  const items = useMenuStore((s) => s.items);
  const extraLists = useMenuStore((s) => s.extraLists);
  const addLine = useCartStore((s) => s.addLine);
  const [hints, setHints] = useState<Hint[]>([]);
  const [customizeItem, setCustomizeItem] = useState<AdminMenuItem | null>(null);
  const [bundleItem, setBundleItem] = useState<AdminMenuItem | null>(null);
  const [formatoItem, setFormatoItem] = useState<AdminMenuItem | null>(null);

  useEffect(() => {
    if (!modules.upselling || lines.length === 0) {
      setHints([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/menu-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: tenant.id,
            itemIds: lines.map((l) => l.itemId),
            channel,
            tableId: tableId ?? null,
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          suggestions?: { itemId: string; name: string; text: string }[];
        };
        if (cancelled) return;
        setHints((data.suggestions ?? []).slice(0, 3));
      } catch {
        setHints([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [channel, lines, modules.upselling, tableId, tenant.id]);

  if (!modules.upselling || hints.length === 0) return null;

  function handleAdd(hint: Hint, e: React.MouseEvent<HTMLButtonElement>) {
    const menuItem = items.find((it) => it.id === hint.itemId);
    if (!menuItem || !menuItem.available) return;

    if (hasMenuBundle(menuItem)) {
      setBundleItem(menuItem);
      return;
    }
    if (hasOnlyPriceVariants(menuItem, extraLists)) {
      setFormatoItem(menuItem);
      return;
    }
    if (needsCustomization(menuItem, extraLists)) {
      setCustomizeItem(menuItem);
      return;
    }

    const flyFrom = e.currentTarget.getBoundingClientRect();
    const v = priceVariants(menuItem.price)[0];
    addLine({
      itemId: menuItem.id,
      categoryId: menuItem.categoryId,
      name: menuItem.name,
      qty: 1,
      variantKey: v.key === "default" ? undefined : v.key,
      variantLabel: v.label,
      basePrice: v.price,
      unitPrice: v.price,
    });
    spawnCartFly(flyFrom, menuItem.image ?? null);
    setHints((prev) => prev.filter((h) => h.itemId !== hint.itemId));
  }

  return (
    <>
      <div className="mx-5 mb-4 rounded-2xl border border-pork-mustard/40 bg-pork-mustard/10 px-4 py-3 text-sm text-pork-ink">
        <p className="text-xs font-bold uppercase text-pork-red">Suggerimenti</p>
        <div className="mt-2 space-y-2">
          {hints.map((h) => {
            const menuItem = items.find((it) => it.id === h.itemId);
            const available = menuItem?.available ?? false;
            return (
              <button
                key={h.itemId}
                type="button"
                disabled={!available}
                onClick={(e) => handleAdd(h, e)}
                className="flex w-full items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5 text-left ring-1 ring-pork-ink/10 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{h.name}</p>
                  <p className="mt-0.5 text-xs text-pork-ink/60">{h.text}</p>
                </div>
                {menuItem && (
                  <span className="shrink-0 font-impact text-sm text-pork-red">
                    {formatEuro(minPrice(menuItem.price))}
                  </span>
                )}
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pork-ink text-pork-cream">
                  <Plus size={16} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {customizeItem && (
        <ItemCustomizer
          item={customizeItem}
          extraLists={extraLists}
          onClose={() => setCustomizeItem(null)}
        />
      )}
      {bundleItem && (
        <MenuBundleCustomizer
          item={bundleItem}
          onClose={() => setBundleItem(null)}
        />
      )}
      {formatoItem && (
        <FormatoChoiceModal
          item={formatoItem}
          onClose={() => setFormatoItem(null)}
          onConfirm={(v, flyFrom) => {
            addLine({
              itemId: formatoItem.id,
              categoryId: formatoItem.categoryId,
              name: formatoItem.name,
              qty: 1,
              variantKey: v.key === "default" ? undefined : v.key,
              variantLabel: v.label,
              basePrice: v.price,
              unitPrice: v.price,
            });
            setFormatoItem(null);
            spawnCartFly(flyFrom ?? null, formatoItem.image ?? null);
          }}
        />
      )}
    </>
  );
}
