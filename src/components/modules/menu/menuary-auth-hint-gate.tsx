"use client";

import { MenuaryAccountBanner } from "@/components/modules/menu/menuary-account-banner";

/**
 * Hint per login Menuary sui flussi cliente (menu, asporto, tavolo).
 * La dismiss è in sessionStorage con chiave per-tenant condivisa da
 * `MenuaryAccountBanner`: chiudere su un flusso vale per tutti nella stessa sessione.
 */
export function MenuaryAuthHintGate() {
  return <MenuaryAccountBanner />;
}
