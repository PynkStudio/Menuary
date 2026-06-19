"use client";

import { useEffect, useState } from "react";
import { useTenantOrNull } from "@/components/core/tenant-provider";
import {
  activateTenantScopedStorage,
  rehydrateTenantScopedStoreForKey,
  rehydrateUnscopedStores,
} from "@/lib/tenant-scoped-stores";
import {
  migrateLegacyTenantAdminStorage,
  TENANT_ADMIN_STORAGE_KEY,
  useTenantAdminStore,
} from "@/store/tenant-admin-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const tenant = useTenantOrNull();
  const tenantId = tenant?.id ?? null;
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    setHydrated(false);
    migrateLegacyTenantAdminStorage();
    Promise.all([
      useTenantAdminStore.persist.rehydrate(),
      tenantId ? activateTenantScopedStorage(tenantId) : rehydrateUnscopedStores(),
    ]).then(() => {
      if (mounted) setHydrated(true);
    });

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (rehydrateTenantScopedStoreForKey(e.key)) return;
      if (e.key === TENANT_ADMIN_STORAGE_KEY) {
        useTenantAdminStore.persist.rehydrate();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [tenantId]);

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
