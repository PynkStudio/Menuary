"use client";

import { Heart, ShoppingBag } from "lucide-react";
import { useCartStore, cartCount } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { useHydrated } from "@/components/core/providers";
import { cn } from "@/lib/utils";

const fabClass =
  "inline-flex w-full min-w-[9.5rem] items-center justify-center gap-2 rounded-full bg-pork-ink px-4 py-2.5 text-sm font-bold text-pork-cream shadow-xl shadow-pork-ink/30 transition-all hover:-translate-y-0.5 hover:bg-pork-brick active:scale-95 sm:min-w-[10.5rem] sm:gap-3 sm:px-5 sm:py-3 sm:text-base";

export function ShopFabs() {
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const setOpen = useCartStore((s) => s.setOpen);
  const cartQty = cartCount(lines);
  const favIds = useFavoritesStore((s) => s.ids);
  const setFavOpen = useFavoritesStore((s) => s.setOpen);

  if (!hydrated) return null;

  const showFav = favIds.length > 0;
  const showCart = cartQty > 0;

  if (!showFav && !showCart) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 z-40 flex flex-col items-end gap-2 sm:right-6 top-[calc(5rem+env(safe-area-inset-top))] sm:top-[calc(6rem+env(safe-area-inset-top))]"
      aria-label="Azioni rapide"
    >
      <div className="pointer-events-auto flex flex-col items-stretch gap-2">
        {showFav && (
          <button
            type="button"
            onClick={() => setFavOpen(true)}
            className={cn(fabClass, "ring-2 ring-pork-mustard/80 hover:ring-pork-mustard")}
            aria-label={`Preferiti: ${favIds.length} piatti`}
          >
            <Heart size={20} className="shrink-0 fill-current text-pork-mustard" />
            <span>Preferiti</span>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-pork-mustard px-1.5 text-xs font-black text-pork-ink">
              {favIds.length}
            </span>
          </button>
        )}
        {showCart && (
          <button
            type="button"
            data-cart-fab-target
            onClick={() => setOpen(true)}
            className={fabClass}
            aria-label={`Carrello: ${cartQty} elementi`}
          >
            <ShoppingBag size={20} className="shrink-0" />
            <span>Carrello</span>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-pork-mustard px-1.5 text-xs font-black text-pork-ink">
              {cartQty}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
