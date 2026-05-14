"use client";

import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import type { TenantProfile } from "@/lib/tenant";
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
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantProfile {
  const tenant = useContext(TenantContext);
  if (!tenant) throw new Error("useTenant must be used inside TenantProvider");
  return tenant;
}
