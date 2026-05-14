"use client";

import { Users } from "lucide-react";
import { useHydrated } from "@/components/core/providers";
import { useCartStore } from "@/store/cart-store";

/** Striscia sotto l’hero /menu quando il carrello è legato a una sessione tavolo. */
export function MenuActiveTableBar() {
  const hydrated = useHydrated();
  const ctx = useCartStore((s) => s.context);

  if (!hydrated) return null;
  if (ctx.type !== "tavolo" || !ctx.sessionId || !ctx.tableLabel) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-pork-mustard/15 px-4 py-3 text-sm text-pork-cream ring-1 ring-pork-mustard/30">
      <span className="chip-mustard !text-pork-ink">Al tavolo</span>
      <span className="font-semibold">{ctx.tableLabel}</span>
      {ctx.sessionCode && (
        <span className="text-pork-cream/80">
          · codice <span className="font-impact tracking-widest text-pork-mustard">{ctx.sessionCode}</span>
        </span>
      )}
      {ctx.nickname && (
        <span className="inline-flex items-center gap-1 rounded-full bg-pork-red/90 px-2 py-0.5 text-xs font-bold text-white">
          <Users size={12} />
          {ctx.nickname}
        </span>
      )}
    </div>
  );
}
