"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { WhatsappFloat } from "./whatsapp-float";
import { ShopFabs } from "./shop-fabs";
import { CartDrawer } from "./cart-drawer";
import { CartFlyOverlay } from "./cart-fly-overlay";
import { FavoritesDrawer } from "./favorites-drawer";
import { usePlatformMode } from "./platform-mode-provider";

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
    mode === "platform-admin" ||
    mode === "preview"
  ) {
    return null;
  }
  return <Footer />;
}
