"use client";

import { useEffect, useState } from "react";
import { useMenuStore } from "@/store/menu-store";
import { useCartStore } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { useSettingsStore } from "@/store/settings-store";
import { useTenantAdminStore } from "@/store/tenant-admin-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      useMenuStore.persist.rehydrate(),
      useCartStore.persist.rehydrate(),
      useFavoritesStore.persist.rehydrate(),
      useSettingsStore.persist.rehydrate(),
      useTenantAdminStore.persist.rehydrate(),
    ]).then(() => {
      if (mounted) setHydrated(true);
    });

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "bepork-menu-v1") useMenuStore.persist.rehydrate();
      if (e.key === "bepork-cart-v1") useCartStore.persist.rehydrate();
      if (e.key === "bepork-favorites-v1") useFavoritesStore.persist.rehydrate();
      if (e.key === "bepork-settings-v1") useSettingsStore.persist.rehydrate();
      if (e.key === "bepork-tenant-admin-v1") {
        useTenantAdminStore.persist.rehydrate();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <div data-hydrated={hydrated ? "1" : "0"} suppressHydrationWarning>
      {children}
    </div>
  );
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
