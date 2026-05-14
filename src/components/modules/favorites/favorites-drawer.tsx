"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { HeartOff, Trash2, X } from "lucide-react";
import { MenuCardInteractive } from "@/components/modules/menu/menu-card-interactive";
import { useFavoritesStore } from "@/store/favorites-store";
import { useMenuStore } from "@/store/menu-store";
import type { AdminMenuItem } from "@/lib/types";
import { useHydrated } from "@/components/core/providers";
import { cn } from "@/lib/utils";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";

export function FavoritesDrawer() {
  const hydrated = useHydrated();
  const open = useFavoritesStore((s) => s.openDrawer);
  const setOpen = useFavoritesStore((s) => s.setOpen);
  const favIds = useFavoritesStore((s) => s.ids);
  const clearFav = useFavoritesStore((s) => s.clear);
  const items = useMenuStore((s) => s.items);

  const favoriteItems = useMemo(
    () =>
      favIds
        .map((id) => items.find((i) => i.id === id))
        .filter((i): i is AdminMenuItem => !!i),
    [favIds, items],
  );

  useEffect(() => {
    if (!open) return;
    bodyScrollLock();
    return () => bodyScrollUnlock();
  }, [open]);

  if (!hydrated) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[57] bg-pork-ink/70 backdrop-blur-sm transition-opacity duration-300 ease-out",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-[58] flex h-dvh max-h-dvh w-full max-w-md flex-col bg-pork-cream pt-[env(safe-area-inset-top)] shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Preferiti"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-pork-ink/10 px-5 py-4">
          <div>
            <span className="chip-mustard text-[10px]">Preferiti</span>
            <h2 className="headline mt-1 text-2xl">I tuoi piatti</h2>
            <p className="mt-1 text-xs text-pork-ink/55">
              Salvati solo su questo dispositivo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-pork-ink/10 active:bg-pork-ink/15"
            aria-label="Chiudi preferiti"
          >
            <X size={22} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-5 py-4">
          {favoriteItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-pork-ink/60">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-pork-cream">
                <HeartOff size={28} className="text-pork-ink/40" />
              </div>
              <p className="impact-title text-lg">Non hai ancora scelto nulla.</p>
              <p className="max-w-[16rem] text-sm text-pork-ink/55">
                Apri il menu e tocca il cuore sui piatti che ti ispirano.
              </p>
              <Link
                href="/menu"
                onClick={() => setOpen(false)}
                className="btn-primary mt-2 inline-flex"
              >
                Vai al menu
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="impact-title text-sm text-pork-red">
                  {favoriteItems.length} piatt{favoriteItems.length === 1 ? "o" : "i"}
                </p>
                <button
                  type="button"
                  onClick={() => clearFav()}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-pork-ink/5 px-3 py-2 text-xs font-semibold text-pork-ink/70 hover:bg-pork-ink/10 sm:text-sm"
                >
                  <Trash2 size={14} /> Svuota
                </button>
              </div>
              <div className="flex flex-col gap-4 pb-6">
                {favoriteItems.map((item) => (
                  <MenuCardInteractive key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
