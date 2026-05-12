"use client";

import { useTenant } from "@/components/tenant-provider";
import { useSettingsStore } from "@/store/settings-store";

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

  return {
    tenantEnabled: tenant.enabled,
    allowTakeaway: tenant.enabled && tenant.features.takeaway && allowTakeaway,
    allowTableOrders:
      tenant.enabled && tenant.features.tableOrders && allowTableOrders,
    kitchenDisplayEnabled:
      tenant.enabled &&
      tenant.features.kitchenDisplay &&
      kitchenDisplayEnabled,
    dinerSeparationAtTables:
      tenant.enabled &&
      tenant.features.dinerSeparation &&
      dinerSeparationAtTables,
    favoritesEnabled: tenant.enabled && tenant.features.favorites,
    reviewsEnabled: tenant.enabled && tenant.features.reviews,
    galleryEnabled: tenant.enabled && tenant.features.gallery,
  };
}
