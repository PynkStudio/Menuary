// ─── PlatformMode ─────────────────────────────────────────────────────────────
// "marketing"   → menuary.it          sito marketing verticale food
// "marketing-b" → [vertical-b].it     sito marketing verticale services
//                 TODO: sostituire il dominio placeholder quando il nome è definito
// "tenant"      → bepork.it / ecc.    sito del singolo locale
// "platform-admin" → admin.menuary.it back-office piattaforma
// "preview"     → demo.menuary.it     anteprima tenant via previewSlug
// "clients"     → clienti.menuary.it  area personale clienti / titolari (login + profilo)
// "studio"      → studio.menuary.it   fatturazione e abbonamenti per i locali (clienti B2B Menuary)
export type PlatformMode =
  | "tenant"
  | "marketing"
  | "marketing-b"
  | "platform-admin"
  | "preview"
  | "clients"
  | "studio";

export const PLATFORM_HOSTS = {
  marketing:   ["menuary.it", "www.menuary.it", "menuary.localhost"],
  // TODO: rimpiazzare "vertical-b.localhost" con il dominio reale del secondo verticale
  "marketing-b": ["vertical-b.localhost", "www.vertical-b.localhost"],
  admin:       ["admin.menuary.it", "admin.menuary.localhost"],
  preview:     ["demo.menuary.it", "demo.menuary.localhost"],
  clients:     ["clienti.menuary.it", "clienti.menuary.localhost"],
  studio:      ["studio.menuary.it", "studio.menuary.localhost"],
} as const;

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").toLowerCase().split(":")[0] ?? "";
}

export function getPlatformModeFromHost(
  host: string | null | undefined,
): PlatformMode {
  const normalized = normalizeHost(host);
  if (PLATFORM_HOSTS.marketing.includes(normalized as never))   return "marketing";
  if (PLATFORM_HOSTS["marketing-b"].includes(normalized as never)) return "marketing-b";
  if (PLATFORM_HOSTS.admin.includes(normalized as never))       return "platform-admin";
  if (PLATFORM_HOSTS.preview.includes(normalized as never))     return "preview";
  if (PLATFORM_HOSTS.clients.includes(normalized as never))     return "clients";
  if (PLATFORM_HOSTS.studio.includes(normalized as never))      return "studio";
  return "tenant";
}

// Utility: i due marketing mode
export function isMarketingMode(mode: PlatformMode): boolean {
  return mode === "marketing" || mode === "marketing-b";
}

export function isClientsPortalMode(mode: PlatformMode): boolean {
  return mode === "clients";
}

export function isStudioPortalMode(mode: PlatformMode): boolean {
  return mode === "studio";
}
