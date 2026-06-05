"use client";

import { FavoritesDrawer } from "@/components/modules/favorites/favorites-drawer";
import { CartDrawer } from "@/components/modules/shop/cart-drawer";
import { CartFlyOverlay } from "@/components/modules/shop/cart-fly-overlay";
import { ShopFabs } from "@/components/modules/shop/shop-fabs";
import { useEffectiveFeatures } from "@/lib/use-effective-features";

export function MenuActionOverlays() {
  const {
    allowTakeaway,
    allowTableOrders,
    orderKioskEnabled,
    favoritesEnabled,
  } = useEffectiveFeatures();
  const hasOrderModule = allowTakeaway || allowTableOrders || orderKioskEnabled;
  const hasQuickActions = hasOrderModule || favoritesEnabled;

  return (
    <>
      {hasQuickActions && <ShopFabs />}
      {hasOrderModule && <CartFlyOverlay />}
      {hasOrderModule && <CartDrawer />}
      {favoritesEnabled && <FavoritesDrawer />}
    </>
  );
}
