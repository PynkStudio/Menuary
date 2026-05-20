"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/tenant-shell/navbar";
import { Footer } from "@/components/tenant-shell/footer";
import { WhatsappFloat } from "@/components/modules/reservations/whatsapp-float";
import { ShopFabs } from "@/components/modules/shop/shop-fabs";
import { CartDrawer } from "@/components/modules/shop/cart-drawer";
import { CartFlyOverlay } from "@/components/modules/shop/cart-fly-overlay";
import { FavoritesDrawer } from "@/components/modules/favorites/favorites-drawer";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import { useTenantOrNull } from "@/components/core/tenant-provider";
import { resolveTenantFeatures } from "@/lib/tenant-modules";

const EXCLUDED_MODES = new Set([
  "marketing",
  "marketing-bizery",
  "clients",
  "studio",
  "platform-admin",
  "preview",
  "preview-bizery",
  "login",
  "gestione",
  "gestione-bizery",
  "gestione-custom",
] as const);

function isInternal(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/cucina") ||
    pathname.startsWith("/k/")
  );
}

/**
 * Shell globale per i siti tenant: monta navbar, footer, drawer e overlay
 * in base ai moduli effettivamente attivi nel profilo del tenant.
 *
 * Aggiungere un nuovo modulo con componenti globali (overlay, drawer, fab):
 *  1. Aggiungere il modulo in TENANT_MODULES (tenant-modules.ts)
 *  2. Aggiungere il componente qui, condizionato al flag corretto
 *  Non serve toccare nient'altro — il sistema di implies garantisce i sub-sistemi.
 */
export function SiteChrome() {
  const pathname = usePathname();
  const mode = usePlatformMode();
  const tenant = useTenantOrNull();

  const features = useMemo(
    () => (tenant ? resolveTenantFeatures(tenant.features) : null),
    [tenant],
  );

  if (isInternal(pathname) || EXCLUDED_MODES.has(mode as never) || !features) {
    return null;
  }

  // I moduli ordini portano sempre con sé carrello, varianti e overlay animazione.
  const hasOrderModule =
    features.takeaway || features.tableOrders || features.orderKiosk;

  return (
    <>
      <Navbar />
      {/* Modulo: reservations / contatti */}
      {features.reservations && <WhatsappFloat />}
      {/* Modulo: ordini (takeaway · tavolo · kiosk) — carrello sempre bundled */}
      {hasOrderModule && <ShopFabs />}
      {hasOrderModule && <CartFlyOverlay />}
      {hasOrderModule && <CartDrawer />}
      {/* Modulo: favorites — sempre attivo con onlineMenu (vedi implies in tenant-modules) */}
      {features.favorites && <FavoritesDrawer />}
    </>
  );
}

export function SiteFooterGate() {
  const pathname = usePathname();
  const mode = usePlatformMode();

  if (isInternal(pathname) || EXCLUDED_MODES.has(mode as never)) {
    return null;
  }

  return <Footer />;
}
