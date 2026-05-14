"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/components/core/tenant-provider";
import {
  getLocalModuleEnabled,
  isModuleSuspensionActive,
  useSettingsStore,
} from "@/store/settings-store";
import type { TenantFeatureKey } from "@/lib/tenant";
import {
  isTenantFeatureEffective,
  resolveTenantFeatures,
  TENANT_MODULES,
} from "@/lib/tenant-modules";

export function useEffectiveFeatures() {
  const tenant = useTenant();
  const allowTakeaway = useSettingsStore((state) => state.allowTakeaway);
  const allowTableOrders = useSettingsStore((state) => state.allowTableOrders);
  const kitchenDisplayEnabled = useSettingsStore(
    (state) => state.kitchenDisplayEnabled,
  );
  const dinerSeparationAtTables = useSettingsStore(
    (state) => state.dinerSeparationAtTables,
  );
  const moduleOverrides = useSettingsStore((state) => state.moduleOverrides);
  const moduleSuspensions = useSettingsStore((state) => state.moduleSuspensions);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const hasTimedSuspension = Object.values(moduleSuspensions).some(
      (suspension) =>
        suspension?.disabledUntil !== null &&
        isModuleSuspensionActive(suspension, now),
    );
    if (!hasTimedSuspension) return;
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, [moduleSuspensions, now]);

  const localFeatures = Object.fromEntries(
    TENANT_MODULES.map((module) => [
      module.key,
      getLocalModuleEnabled(
        {
          allowTakeaway,
          allowTableOrders,
          kitchenDisplayEnabled,
          dinerSeparationAtTables,
          moduleOverrides,
          moduleSuspensions,
        },
        module.key,
        now,
      ),
    ]),
  ) as Record<TenantFeatureKey, boolean>;

  const resolvedLocalFeatures = resolveTenantFeatures({
    ...tenant.features,
    ...localFeatures,
  });

  const enabled = (module: TenantFeatureKey) =>
    tenant.enabled &&
    isTenantFeatureEffective(tenant.features, module) &&
    resolvedLocalFeatures[module];

  return {
    tenantEnabled: tenant.enabled,
    modules: Object.fromEntries(
      TENANT_MODULES.map((module) => [module.key, enabled(module.key)]),
    ) as Record<TenantFeatureKey, boolean>,
    allowTakeaway: enabled("takeaway"),
    allowTableOrders: enabled("tableOrders"),
    orderKioskEnabled: enabled("orderKiosk"),
    kitchenDisplayEnabled: enabled("kitchenDisplay"),
    dinerSeparationAtTables: enabled("dinerSeparation"),
    favoritesEnabled: enabled("favorites"),
    reviewsEnabled: enabled("reviews"),
    galleryEnabled: enabled("gallery"),
  };
}
