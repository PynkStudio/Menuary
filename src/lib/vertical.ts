/**
 * vertical.ts
 *
 * Helper per gestire i due rami verticali della piattaforma.
 *
 * "food"     → ristoranti, bar, pizzerie, trattorie  (marketing: menuary.it)
 * "services" → studi, saloni, centri benessere, ecc. (marketing: bizery.it)
 * "creative" → artisti, autori, musicisti, attori, registi (marketing: weuseorpheo.com)
 *
 * Aggiungere un nuovo vertical:
 *   1. Aggiungere il valore a TenantVertical in tenant.ts
 *   2. Aggiungere la entry in VERTICAL_REGISTRY qui sotto
 *   3. Aggiungere i PLATFORM_HOSTS in platform.ts
 *   4. Creare le pagine marketing in src/components/[vertical-slug]/pages/
 *   5. Aggiungere il branch nel dispatcher src/app/page.tsx (e le altre pagine)
 */

import type { TenantVertical, TenantFeatureKey } from "@/lib/tenant";
import { TENANT_MODULE_BY_KEY } from "@/lib/tenant-modules";

// ─── Registry verticali ───────────────────────────────────────────────────────

export type VerticalMeta = {
  id: TenantVertical;
  /** Nome commerciale del prodotto (es. "Menuary") */
  productName: string;
  /** Dominio marketing (es. "menuary.it") */
  marketingDomain: string;
  /** Placeholder copy usato nell'UI quando ci si riferisce al tipo di attività */
  businessNoun: string;           // es. "ristorante" | "studio"
  businessNounPlural: string;     // es. "ristoranti" | "studi"
  /** Testo del link "prenota" principale */
  reservationCTA: string;         // es. "Prenota un tavolo" | "Prenota un appuntamento"
  /** Testo che accompagna il menu/listino */
  menuLabel: string;              // es. "Menu" | "Servizi"
};

export const VERTICAL_REGISTRY: Record<TenantVertical, VerticalMeta> = {
  food: {
    id: "food",
    productName: "Menuary",
    marketingDomain: "menuary.it",
    businessNoun: "ristorante",
    businessNounPlural: "ristoranti",
    reservationCTA: "Prenota un tavolo",
    menuLabel: "Menu",
  },
  services: {
    id: "services",
    productName: "Bizery",
    marketingDomain: "bizery.it",
    businessNoun: "azienda",
    businessNounPlural: "aziende e studi",
    reservationCTA: "Prenota un appuntamento",
    menuLabel: "Listino prezzi",
  },
  creative: {
    id: "creative",
    productName: "Orpheo",
    marketingDomain: "weuseorpheo.com",
    businessNoun: "artista",
    businessNounPlural: "artisti e professionisti creativi",
    reservationCTA: "Richiedi disponibilità",
    menuLabel: "Opere e progetti",
  },
};

// ─── Helper pubblici ──────────────────────────────────────────────────────────

/** Restituisce i metadati del vertical. */
export function getVerticalMeta(vertical: TenantVertical): VerticalMeta {
  return VERTICAL_REGISTRY[vertical];
}

/**
 * Restituisce label e description del modulo per il vertical specificato.
 * Se non esiste un override per quel vertical, usa il default del modulo.
 */
export function getModuleCopy(
  key: TenantFeatureKey,
  vertical: TenantVertical,
): { label: string; description: string } {
  const mod = TENANT_MODULE_BY_KEY[key];
  const override = mod.verticalCopy?.[vertical];
  return override ?? { label: mod.label, description: mod.description };
}

/**
 * Shorthand per ottenere solo la label del modulo.
 * Uso: getModuleLabel("reservations", tenant.vertical)
 * → "Prenotazioni" (food) | "Appuntamenti" (services)
 */
export function getModuleLabel(
  key: TenantFeatureKey,
  vertical: TenantVertical,
): string {
  return getModuleCopy(key, vertical).label;
}
