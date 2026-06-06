"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/tenant-shell/navbar";
import { Footer } from "@/components/tenant-shell/footer";
import { WhatsappFloat } from "@/components/modules/reservations/whatsapp-float";
import { MenuActionOverlays } from "@/components/modules/menu/menu-action-overlays";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import { useTenantOrNull } from "@/components/core/tenant-provider";
import { resolveTenantFeatures } from "@/lib/tenant-modules";
import { findTenantByPreviewSlug } from "@/lib/tenant-registry";

const EXCLUDED_MODES = new Set([
  "marketing",
  "marketing-bizery",
  "marketing-orpheo",
  "clients",
  "studio",
  "platform-admin",
  "preview",
  "preview-bizery",
  "preview-orpheo",
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

function isPathPreview(pathname: string | null): boolean {
  const slug = pathname?.split("/").filter(Boolean)[0];
  if (!slug) return false;
  return !!findTenantByPreviewSlug(slug);
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

  if (
    isInternal(pathname) ||
    EXCLUDED_MODES.has(mode as never) ||
    isPathPreview(pathname) ||
    !features
  ) {
    return null;
  }

  return (
    <>
      <Navbar />
      {/* Modulo: reservations / contatti */}
      {features.reservations && <WhatsappFloat />}
      <MenuActionOverlays />
    </>
  );
}

export function SiteFooterGate() {
  const pathname = usePathname();
  const mode = usePlatformMode();

  if (
    isInternal(pathname) ||
    EXCLUDED_MODES.has(mode as never) ||
    isPathPreview(pathname)
  ) {
    return null;
  }

  return <Footer />;
}
