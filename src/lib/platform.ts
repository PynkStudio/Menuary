// ─── PlatformMode ─────────────────────────────────────────────────────────────
// "marketing"         → menuary.it             sito marketing verticale food
// "marketing-bizery"  → bizery.it              sito marketing verticale services (Bizery)
// "marketing-orpheo"  → weuseorpheo.com        sito marketing verticale creative (Orpheo)
// "tenant"            -> dominio custom tenant   sito del singolo locale
// "platform-admin"    → admin.menuary.it        back-office piattaforma
// "preview"           → demo.menuary.it         anteprima tenant food via previewSlug
// "preview-bizery"    → demo.bizery.it          anteprima tenant bizery via previewSlug
// "preview-orpheo"    → demo.weuseorpheo.com    anteprima tenant creative via previewSlug
// "clients"           → clienti.menuary.it      area personale clienti
// "studio"            → studio.menuary.it       fatturazione e abbonamenti B2B (food)
// "studio-bizery"     → studio.bizery.it        fatturazione e abbonamenti B2B (services)
// "support"           → support.menuary.it      registro errori operativo interno
// "login"             → login.menuary.it        auth centralizzato (popup + redirect)
// "app"               → app.menuary.it          download app operative native
// "gestione"          → gestione.menuary.it     pannello gestione tenant food
// "gestione-bizery"   → gestione.bizery.it      pannello gestione tenant bizery (cross-domain popup auth)
// "gestione-custom"   → gestione.[dominio]      pannello gestione sul dominio del tenant
// "ordini-custom"     → ordini.[dominio]        console operativa ordini del tenant/sede
// "cassa-custom"      → cassa.[dominio]         POS/cassa operativa del tenant/sede
// "kiosk-custom"      → kiosk.[dominio]         runtime kiosk operativo del tenant/sede
// "cucina-custom"     → cucina.[dominio]        kitchen display operativo del tenant/sede
// "rider-custom"      → rider.[dominio]         app web rider delivery del tenant
// "admin-pynkstudio"      → admin.pynkstudio.it         pannello controllo PynkStudio (azienda madre)
// "pagamenti-pynkstudio"  → pagamenti.pynkstudio.it     portale pagamenti unificato (tutti i verticali)
export type PlatformMode =
  | "tenant"
  | "marketing"
  | "marketing-bizery"
  | "marketing-orpheo"
  | "platform-admin"
  | "admin-pynkstudio"
  | "pagamenti-pynkstudio"
  | "preview"
  | "preview-bizery"
  | "preview-orpheo"
  | "clients"
  | "studio"
  | "studio-bizery"
  | "support"
  | "login"
  | "app"
  | "gestione"
  | "gestione-bizery"
  | "gestione-custom"
  | "ordini-custom"
  | "cassa-custom"
  | "kiosk-custom"
  | "cucina-custom"
  | "rider-custom";

export const PLATFORM_MODE_HEADER = "x-platform-mode";

export const PLATFORM_HOSTS = {
  marketing:          ["menuary.it", "www.menuary.it", "menuary.localhost"],
  "marketing-bizery": ["bizery.it", "www.bizery.it", "bizery.localhost"],
  "marketing-orpheo": ["weuseorpheo.com", "www.weuseorpheo.com", "orpheo.localhost"],
  admin:              ["admin.menuary.it", "admin.menuary.localhost"],
  "admin-pynkstudio":     ["admin.pynkstudio.it", "admin.pynkstudio.localhost"],
  "pagamenti-pynkstudio": ["pagamenti.pynkstudio.it", "pagamenti.pynkstudio.localhost"],
  preview:            ["demo.menuary.it", "demo.menuary.localhost"],
  "preview-bizery":   ["demo.bizery.it", "demo.bizery.localhost"],
  "preview-orpheo":   ["demo.weuseorpheo.com", "demo.weuseorpheo.localhost"],
  clients:            ["clienti.menuary.it", "clienti.menuary.localhost"],
  studio:             ["studio.menuary.it", "studio.menuary.localhost"],
  "studio-bizery":    ["studio.bizery.it", "studio.bizery.localhost"],
  support:            ["support.menuary.it", "support.mennuary.it", "support.menuary.localhost"],
  login:              ["login.menuary.it", "login.menuary.localhost"],
  app:                ["app.menuary.it", "app.menuary.localhost"],
  gestione:           ["gestione.menuary.it", "gestione.menuary.localhost"],
  "gestione-bizery":  ["gestione.bizery.it", "gestione.bizery.localhost"],
} as const;

const PLATFORM_MODES: PlatformMode[] = [
  "tenant",
  "marketing",
  "marketing-bizery",
  "marketing-orpheo",
  "platform-admin",
  "admin-pynkstudio",
  "pagamenti-pynkstudio",
  "preview",
  "preview-bizery",
  "preview-orpheo",
  "clients",
  "studio",
  "studio-bizery",
  "support",
  "login",
  "app",
  "gestione",
  "gestione-bizery",
  "gestione-custom",
  "ordini-custom",
  "cassa-custom",
  "kiosk-custom",
  "cucina-custom",
  "rider-custom",
];

export function isPlatformMode(value: unknown): value is PlatformMode {
  return typeof value === "string" && PLATFORM_MODES.includes(value as PlatformMode);
}

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").toLowerCase().split(":")[0] ?? "";
}

export function getPlatformModeFromHost(
  host: string | null | undefined,
): PlatformMode {
  const normalized = normalizeHost(host);
  if (PLATFORM_HOSTS.marketing.includes(normalized as never))          return "marketing";
  if (PLATFORM_HOSTS["marketing-bizery"].includes(normalized as never)) return "marketing-bizery";
  if (PLATFORM_HOSTS["marketing-orpheo"].includes(normalized as never)) return "marketing-orpheo";
  if (PLATFORM_HOSTS.admin.includes(normalized as never))              return "platform-admin";
  if (PLATFORM_HOSTS["admin-pynkstudio"].includes(normalized as never))     return "admin-pynkstudio";
  if (PLATFORM_HOSTS["pagamenti-pynkstudio"].includes(normalized as never)) return "pagamenti-pynkstudio";
  if (PLATFORM_HOSTS.preview.includes(normalized as never))            return "preview";
  if (PLATFORM_HOSTS["preview-bizery"].includes(normalized as never))  return "preview-bizery";
  if (PLATFORM_HOSTS["preview-orpheo"].includes(normalized as never))  return "preview-orpheo";
  if (PLATFORM_HOSTS.clients.includes(normalized as never))            return "clients";
  if (PLATFORM_HOSTS.studio.includes(normalized as never))             return "studio";
  if (PLATFORM_HOSTS["studio-bizery"].includes(normalized as never))   return "studio-bizery";
  if (PLATFORM_HOSTS.support.includes(normalized as never))            return "support";
  if (PLATFORM_HOSTS.login.includes(normalized as never))              return "login";
  if (PLATFORM_HOSTS.app.includes(normalized as never))                return "app";
  if (PLATFORM_HOSTS.gestione.includes(normalized as never))           return "gestione";
  if (PLATFORM_HOSTS["gestione-bizery"].includes(normalized as never)) return "gestione-bizery";
  if (normalized.startsWith("gestione."))                              return "gestione-custom";
  if (normalized.startsWith("ordini."))                                return "ordini-custom";
  if (normalized.startsWith("cassa."))                                 return "cassa-custom";
  if (normalized.startsWith("kiosk."))                                 return "kiosk-custom";
  if (normalized.startsWith("cucina."))                                return "cucina-custom";
  if (normalized.startsWith("rider."))                                 return "rider-custom";
  return "tenant";
}

export function getPlatformModeFromHeaderValue(
  modeHeader: string | null | undefined,
  host: string | null | undefined,
): PlatformMode {
  return isPlatformMode(modeHeader) ? modeHeader : getPlatformModeFromHost(host);
}

// Utility: i marketing mode
export function isMarketingMode(mode: PlatformMode): boolean {
  return mode === "marketing" || mode === "marketing-bizery" || mode === "marketing-orpheo";
}

// demo.menuary.it / demo.bizery.it / demo.weuseorpheo.com: ambiente vetrina senza auth e con scritture
// solo-locali (localStorage). Vale anche sui loro alias .localhost.
export function isDemoHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  return (
    PLATFORM_HOSTS.preview.includes(normalized as never) ||
    PLATFORM_HOSTS["preview-bizery"].includes(normalized as never) ||
    PLATFORM_HOSTS["preview-orpheo"].includes(normalized as never)
  );
}

export function isClientsPortalMode(mode: PlatformMode): boolean {
  return mode === "clients";
}

export function isStudioPortalMode(mode: PlatformMode): boolean {
  return mode === "studio" || mode === "studio-bizery";
}
