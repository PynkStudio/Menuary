// ─── PlatformMode ─────────────────────────────────────────────────────────────
// "marketing"         → menuary.it             sito marketing verticale food
// "marketing-bizery"  → bizery.it              sito marketing verticale services (Bizery)
// "tenant"            → bepork.it / ecc.        sito del singolo locale
// "platform-admin"    → admin.menuary.it        back-office piattaforma
// "preview"           → demo.menuary.it         anteprima tenant food via previewSlug
// "preview-bizery"    → demo.bizery.it          anteprima tenant bizery via previewSlug
// "clients"           → clienti.menuary.it      area personale clienti
// "studio"            → studio.menuary.it       fatturazione e abbonamenti B2B (food)
// "studio-bizery"     → studio.bizery.it        fatturazione e abbonamenti B2B (services)
// "login"             → login.menuary.it        auth centralizzato (popup + redirect)
// "gestione"          → gestione.menuary.it     pannello gestione tenant food
// "gestione-bizery"   → gestione.bizery.it      pannello gestione tenant bizery (cross-domain popup auth)
// "gestione-custom"   → gestione.[dominio]      pannello gestione sul dominio del tenant
export type PlatformMode =
  | "tenant"
  | "marketing"
  | "marketing-bizery"
  | "platform-admin"
  | "preview"
  | "preview-bizery"
  | "clients"
  | "studio"
  | "studio-bizery"
  | "login"
  | "gestione"
  | "gestione-bizery"
  | "gestione-custom";

export const PLATFORM_HOSTS = {
  marketing:          ["menuary.it", "www.menuary.it", "menuary.localhost"],
  "marketing-bizery": ["bizery.it", "www.bizery.it", "bizery.localhost"],
  admin:              ["admin.menuary.it", "admin.menuary.localhost"],
  preview:            ["demo.menuary.it", "demo.menuary.localhost"],
  "preview-bizery":   ["demo.bizery.it", "demo.bizery.localhost"],
  clients:            ["clienti.menuary.it", "clienti.menuary.localhost"],
  studio:             ["studio.menuary.it", "studio.menuary.localhost"],
  "studio-bizery":    ["studio.bizery.it", "studio.bizery.localhost"],
  login:              ["login.menuary.it", "login.menuary.localhost"],
  gestione:           ["gestione.menuary.it", "gestione.menuary.localhost"],
  "gestione-bizery":  ["gestione.bizery.it", "gestione.bizery.localhost"],
} as const;

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").toLowerCase().split(":")[0] ?? "";
}

export function getPlatformModeFromHost(
  host: string | null | undefined,
): PlatformMode {
  const normalized = normalizeHost(host);
  if (PLATFORM_HOSTS.marketing.includes(normalized as never))          return "marketing";
  if (PLATFORM_HOSTS["marketing-bizery"].includes(normalized as never)) return "marketing-bizery";
  if (PLATFORM_HOSTS.admin.includes(normalized as never))              return "platform-admin";
  if (PLATFORM_HOSTS.preview.includes(normalized as never))            return "preview";
  if (PLATFORM_HOSTS["preview-bizery"].includes(normalized as never))  return "preview-bizery";
  if (PLATFORM_HOSTS.clients.includes(normalized as never))            return "clients";
  if (PLATFORM_HOSTS.studio.includes(normalized as never))             return "studio";
  if (PLATFORM_HOSTS["studio-bizery"].includes(normalized as never))   return "studio-bizery";
  if (PLATFORM_HOSTS.login.includes(normalized as never))              return "login";
  if (PLATFORM_HOSTS.gestione.includes(normalized as never))           return "gestione";
  if (PLATFORM_HOSTS["gestione-bizery"].includes(normalized as never)) return "gestione-bizery";
  if (normalized.startsWith("gestione."))                              return "gestione-custom";
  return "tenant";
}

// Utility: i marketing mode
export function isMarketingMode(mode: PlatformMode): boolean {
  return mode === "marketing" || mode === "marketing-bizery";
}

export function isClientsPortalMode(mode: PlatformMode): boolean {
  return mode === "clients";
}

export function isStudioPortalMode(mode: PlatformMode): boolean {
  return mode === "studio" || mode === "studio-bizery";
}
