"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
} from "react";
import type { TenantProfile } from "@/lib/tenant";
import {
  activateTenantScopedStorage,
  getActiveTenantScopedStorageId,
} from "@/lib/tenant-scoped-stores";
import {
  mergeTenantOverrides,
  useTenantAdminStore,
} from "@/store/tenant-admin-store";

const TenantContext = createContext<TenantProfile | null>(null);

export function TenantProvider({
  tenant,
  children,
}: PropsWithChildren<{ tenant: TenantProfile }>) {
  const override = useTenantAdminStore((state) => state.overrides[tenant.id]);
  const effectiveTenant = useMemo(
    () => mergeTenantOverrides(tenant, override),
    [override, tenant],
  );

  return (
    <TenantContext.Provider value={effectiveTenant}>
      <TenantScopedStoreBridge tenantId={effectiveTenant.id} />
      {children}
    </TenantContext.Provider>
  );
}

function TenantScopedStoreBridge({ tenantId }: { tenantId: string }) {
  const previousTenantRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    previousTenantRef.current = getActiveTenantScopedStorageId();
    void activateTenantScopedStorage(tenantId);

    return () => {
      const previousTenantId = previousTenantRef.current;
      if (!previousTenantId || getActiveTenantScopedStorageId() !== tenantId) return;
      void activateTenantScopedStorage(previousTenantId);
    };
  }, [tenantId]);

  return null;
}

export function useTenant(): TenantProfile {
  const tenant = useContext(TenantContext);
  if (!tenant) throw new Error("useTenant must be used inside TenantProvider");
  return tenant;
}

/** Versione null-safe di useTenant — da usare in componenti che vengono montati
 *  anche in mode non-tenant (es. SiteChrome, che viene renderizzato globalmente). */
export function useTenantOrNull(): TenantProfile | null {
  return useContext(TenantContext);
}
