import type { SiteSettingsState } from "@/store/settings-store";

/**
 * Chiavi dello store impostazioni che vivono sul server (tenant_site_settings).
 * Sono tutte impostazioni pubbliche del sito: chi visita deve vedere quelle
 * scelte dal gestore, non i default del proprio browser.
 */
export const SERVER_SITE_SETTINGS_KEYS = [
  "dinerSeparationAtTables",
  "allowTakeaway",
  "allowTableOrders",
  "kitchenDisplayEnabled",
  "showMenuPrices",
  "moduleOverrides",
  "moduleSuspensions",
  "hoursWeek",
  "phoneOverride",
  "addressOverride",
  "mainEmailOverride",
  "workWithUsEnabled",
  "workWithUsEmailOverride",
  "collaborationsEnabled",
  "collaborationsEmailOverride",
  "socialLinks",
  "socialLinksConfigured",
  "reservationTimeSettings",
  "siteCurrency",
  "activeLanguages",
] as const satisfies readonly (keyof SiteSettingsState)[];

export type ServerSiteSettingsKey = (typeof SERVER_SITE_SETTINGS_KEYS)[number];
export type ServerSiteSettings = Partial<Pick<SiteSettingsState, ServerSiteSettingsKey>>;

export function pickServerSiteSettings(input: unknown): ServerSiteSettings {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const source = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of SERVER_SITE_SETTINGS_KEYS) {
    if (key in source && source[key] !== undefined) out[key] = source[key];
  }
  return out as ServerSiteSettings;
}

/** Permesso minimo per salvare una patch: menu e prenotazioni non richiedono l'admin. */
export function siteSettingsPatchRequirement(
  patch: ServerSiteSettings,
): "admin" | "can_edit_menu" | "can_manage_reservations" {
  const keys = Object.keys(patch);
  if (keys.length > 0 && keys.every((key) => key === "showMenuPrices")) return "can_edit_menu";
  if (keys.length > 0 && keys.every((key) => key === "reservationTimeSettings")) return "can_manage_reservations";
  return "admin";
}
