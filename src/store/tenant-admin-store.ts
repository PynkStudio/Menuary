"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserLocalJSONStorage } from "@/lib/zustand-json-storage";
import type { TenantFeatureFlags, TenantFeatureKey } from "@/lib/tenant";

const LEGACY_STORAGE_KEY = "bepork-tenant-admin-v1";
export const TENANT_ADMIN_STORAGE_KEY = "menuary-tenant-admin-v1";

export function migrateLegacyTenantAdminStorage() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(TENANT_ADMIN_STORAGE_KEY)) return;
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) window.localStorage.setItem(TENANT_ADMIN_STORAGE_KEY, legacy);
  } catch {}
}

type TenantRuntimeOverrides = {
  enabled?: boolean;
  features?: Partial<TenantFeatureFlags>;
};

type TenantAdminState = {
  overrides: Record<string, TenantRuntimeOverrides>;
  setTenantEnabled: (tenantId: string, enabled: boolean) => void;
  setFeatureEnabled: (
    tenantId: string,
    feature: TenantFeatureKey,
    enabled: boolean,
  ) => void;
  resetTenant: (tenantId: string) => void;
};

export const useTenantAdminStore = create<TenantAdminState>()(
  persist(
    (set) => ({
      overrides: {},
      setTenantEnabled: (tenantId, enabled) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [tenantId]: {
              ...state.overrides[tenantId],
              enabled,
            },
          },
        })),
      setFeatureEnabled: (tenantId, feature, enabled) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [tenantId]: {
              ...state.overrides[tenantId],
              features: {
                ...state.overrides[tenantId]?.features,
                [feature]: enabled,
              },
            },
          },
        })),
      resetTenant: (tenantId) =>
        set((state) => {
          const next = { ...state.overrides };
          delete next[tenantId];
          return { overrides: next };
        }),
    }),
    {
      name: TENANT_ADMIN_STORAGE_KEY,
      skipHydration: true,
      storage: createBrowserLocalJSONStorage(),
    },
  ),
);

export function mergeTenantOverrides<
  T extends {
    enabled: boolean;
    features: TenantFeatureFlags;
  },
>(tenant: T, override?: TenantRuntimeOverrides): T {
  if (!override) return tenant;
  return {
    ...tenant,
    enabled: override.enabled ?? tenant.enabled,
    features: {
      ...tenant.features,
      ...override.features,
    },
  };
}
