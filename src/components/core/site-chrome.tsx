"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/tenant-shell/navbar";
import { Footer } from "@/components/tenant-shell/footer";
import { WhatsappFloat } from "@/components/modules/reservations/whatsapp-float";
import { ShopFabs } from "@/components/modules/shop/shop-fabs";
import { CartDrawer } from "@/components/modules/shop/cart-drawer";
import { CartFlyOverlay } from "@/components/modules/shop/cart-fly-overlay";
import { FavoritesDrawer } from "@/components/modules/favorites/favorites-drawer";
import { usePlatformMode } from "@/components/core/platform-mode-provider";

function isInternal(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/admin") || pathname.startsWith("/cucina");
}

export function SiteChrome() {
  const pathname = usePathname();
  const mode = usePlatformMode();
  if (
    isInternal(pathname) ||
    mode === "marketing" ||
    mode === "clients" ||
    mode === "studio" ||
    mode === "platform-admin" ||
    mode === "preview"
  ) {
    return null;
  }
  return (
    <>
      <Navbar />
      <WhatsappFloat />
      <ShopFabs />
      <CartFlyOverlay />
      <CartDrawer />
      <FavoritesDrawer />
    </>
  );
}

export function SiteFooterGate() {
  const pathname = usePathname();
  const mode = usePlatformMode();
  if (
    isInternal(pathname) ||
    mode === "marketing" ||
    mode === "clients" ||
    mode === "studio" ||
    mode === "platform-admin" ||
    mode === "preview"
  ) {
    return null;
  }
  return <Footer />;
}
