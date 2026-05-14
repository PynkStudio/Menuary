/**
 * favicon.ts
 *
 * Centralizza i path delle icone per ogni sito della piattaforma.
 * Ogni sito ha la propria cartella in /public/favicons/[sito]/:
 *
 *   icon.svg       → favicon SVG scalabile (tab browser, bookmark) — OBBLIGATORIO
 *   icon-192.png   → PNG 192×192 per PWA e android home screen — consigliato
 *   apple.png      → PNG 180×180 per iOS home screen (apple-touch-icon) — consigliato
 *
 * Il file icon.svg è sufficiente per tutti i browser moderni.
 * I PNG vanno generati dai loghi originali e aggiunti manualmente.
 */

import type { Metadata } from "next";
import type { PlatformMode } from "@/lib/platform";
import type { TenantProfile } from "@/lib/tenant";

type IconSet = NonNullable<Metadata["icons"]>;

/** Restituisce il prefisso della cartella favicon in /public per un dato sito. */
function faviconBase(mode: PlatformMode, tenant: TenantProfile): string {
  if (mode === "marketing")   return "/favicons/menuary";
  if (mode === "clients")     return "/favicons/menuary";
  if (mode === "studio")      return "/favicons/menuary";
  if (mode === "marketing-b") return "/favicons/vertical-b";
  // Per i tenant, la cartella coincide con l'id del tenant.
  // Se non esiste ancora una cartella dedicata, ricade su bepork come default.
  return `/favicons/${tenant.id}`;
}

/**
 * Genera il set completo di <link rel="icon"> per il Metadata di Next.js.
 * Usa SVG come formato principale (preferito dai browser moderni).
 * Aggiunge PNG come fallback se presenti.
 */
export function buildIconSet(mode: PlatformMode, tenant: TenantProfile): IconSet {
  const base = faviconBase(mode, tenant);

  return {
    icon: [
      // SVG — scalabile, leggero, supportato da tutti i browser moderni
      { url: `${base}/icon.svg`, type: "image/svg+xml" },
      // PNG 192 — fallback per browser che non supportano SVG favicon
      // (crea il file con le giuste dimensioni se vuoi usarlo)
      { url: `${base}/icon-192.png`, type: "image/png", sizes: "192x192" },
    ],
    apple: [
      // iOS home screen icon (180×180 PNG)
      { url: `${base}/apple.png`, sizes: "180x180" },
    ],
    shortcut: `${base}/icon.svg`,
  };
}

/**
 * Colori del tema di sfondo per il <meta name="theme-color">.
 * Corrisponde al colore della tab/barra browser su mobile.
 */
export function themeColor(mode: PlatformMode, tenant: TenantProfile): string {
  if (mode === "marketing")   return "#18231f"; // Menuary ink
  if (mode === "clients")     return "#18231f";
  if (mode === "studio")      return "#18231f";
  if (mode === "marketing-b") return "#1a1a2e"; // Vertical B placeholder
  // Usa il colore "ink" del tema del tenant
  return tenant.theme.ink;
}
