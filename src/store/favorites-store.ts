"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserLocalJSONStorage } from "@/lib/zustand-json-storage";

const LEGACY_FAV_KEY = "bepork-favorites-v1";
const FAV_KEY_PREFIX = "menuary-favorites-v1";
const FAV_FALLBACK_KEY = `${FAV_KEY_PREFIX}:unscoped`;

let activeFavoritesTenantId: string | null = null;

export function favoritesStorageKey(tenantId: string): string {
  return `${FAV_KEY_PREFIX}:${tenantId}`;
}

function migrateLegacyFavoritesStorage(tenantId: string, nextKey: string) {
  if (typeof window === "undefined" || tenantId !== "bepork") return;
  try {
    if (window.localStorage.getItem(nextKey)) return;
    const legacy = window.localStorage.getItem(LEGACY_FAV_KEY);
    if (legacy) window.localStorage.setItem(nextKey, legacy);
  } catch {}
}

export interface FavoritesState {
  ids: string[];
  openDrawer: boolean;
  toggle: (id: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      openDrawer: false,
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id)
            ? s.ids.filter((x) => x !== id)
            : [...s.ids, id],
        })),
      clear: () => set({ ids: [] }),
      setOpen: (openDrawer) => set({ openDrawer }),
    }),
    {
      name: FAV_FALLBACK_KEY,
      skipHydration: true,
      storage: createBrowserLocalJSONStorage(),
      partialize: (s) => ({ ids: s.ids }),
    },
  ),
);

export function getActiveFavoritesTenantId(): string | null {
  return activeFavoritesTenantId;
}

export async function activateFavoritesTenantStorage(tenantId: string) {
  const nextKey = favoritesStorageKey(tenantId);
  if (activeFavoritesTenantId === tenantId && useFavoritesStore.persist.getOptions().name === nextKey) {
    return;
  }
  migrateLegacyFavoritesStorage(tenantId, nextKey);
  activeFavoritesTenantId = tenantId;
  useFavoritesStore.persist.setOptions({ name: nextKey });
  useFavoritesStore.setState({ ids: [], openDrawer: false });
  await useFavoritesStore.persist.rehydrate();
}
