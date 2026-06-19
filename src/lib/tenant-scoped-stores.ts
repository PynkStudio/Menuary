"use client";

import {
  activateCartTenantStorage,
  cartStorageKey,
  getActiveCartTenantId,
  useCartStore,
} from "@/store/cart-store";
import {
  activateFavoritesTenantStorage,
  favoritesStorageKey,
  getActiveFavoritesTenantId,
  useFavoritesStore,
} from "@/store/favorites-store";
import {
  activateMenuTenantStorage,
  getActiveMenuTenantId,
  menuStorageKey,
  useMenuStore,
} from "@/store/menu-store";
import {
  activateRestaurantServicesTenantStorage,
  getActiveRestaurantServicesTenantId,
  restaurantServicesStorageKey,
  useRestaurantServicesStore,
} from "@/store/restaurant-services-store";
import {
  activateSettingsTenantStorage,
  getActiveSettingsTenantId,
  settingsStorageKey,
  useSettingsStore,
} from "@/store/settings-store";

let activeTenantScopedStorageId: string | null = null;

export function getActiveTenantScopedStorageId(): string | null {
  return activeTenantScopedStorageId;
}

export async function activateTenantScopedStorage(tenantId: string) {
  await Promise.all([
    activateMenuTenantStorage(tenantId),
    activateCartTenantStorage(tenantId),
    activateFavoritesTenantStorage(tenantId),
    activateSettingsTenantStorage(tenantId),
    activateRestaurantServicesTenantStorage(tenantId),
  ]);
  activeTenantScopedStorageId = tenantId;
}

export async function rehydrateUnscopedStores() {
  await Promise.all([
    useMenuStore.persist.rehydrate(),
    useCartStore.persist.rehydrate(),
    useFavoritesStore.persist.rehydrate(),
    useSettingsStore.persist.rehydrate(),
    useRestaurantServicesStore.persist.rehydrate(),
  ]);
}

export function rehydrateTenantScopedStoreForKey(key: string): boolean {
  const tenantId = activeTenantScopedStorageId;
  if (!tenantId) return false;

  if (key === menuStorageKey(tenantId) && getActiveMenuTenantId() === tenantId) {
    void useMenuStore.persist.rehydrate();
    return true;
  }
  if (key === cartStorageKey(tenantId) && getActiveCartTenantId() === tenantId) {
    void useCartStore.persist.rehydrate();
    return true;
  }
  if (key === favoritesStorageKey(tenantId) && getActiveFavoritesTenantId() === tenantId) {
    void useFavoritesStore.persist.rehydrate();
    return true;
  }
  if (key === settingsStorageKey(tenantId) && getActiveSettingsTenantId() === tenantId) {
    void useSettingsStore.persist.rehydrate();
    return true;
  }
  if (
    key === restaurantServicesStorageKey(tenantId) &&
    getActiveRestaurantServicesTenantId() === tenantId
  ) {
    void useRestaurantServicesStore.persist.rehydrate();
    return true;
  }

  return false;
}
