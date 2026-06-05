"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserLocalJSONStorage } from "@/lib/zustand-json-storage";
import type { TenantFeatureKey } from "@/lib/tenant";
import type { DaySchedule } from "@/lib/venue-hours";
import { defaultHoursWeek } from "@/lib/venue-hours";

const STORAGE_KEY = "bepork-settings-v1";

export type ModuleSuspension = {
  disabledUntil: number | null;
  createdAt: number;
};

export type SocialLinkKey =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "x"
  | "threads"
  | "tripadvisor"
  | "google"
  | "whatsapp";

export type SocialLinks = Record<SocialLinkKey, string>;

export const EMPTY_SOCIAL_LINKS: SocialLinks = {
  instagram: "",
  facebook: "",
  tiktok: "",
  youtube: "",
  linkedin: "",
  x: "",
  threads: "",
  tripadvisor: "",
  google: "",
  whatsapp: "",
};

export type ReservationTimeMode = "opening_offset" | "fixed";

export type ReservationTimeSettings = {
  mode: ReservationTimeMode;
  /** Minuti dopo l'apertura da cui accettare prenotazioni (modalità offset). */
  startOffsetMinutes: number;
  /** Minuti prima della chiusura entro cui accettare prenotazioni (modalità offset). */
  endOffsetMinutes: number;
  /** Orario fisso di inizio (HH:mm, modalità fixed). */
  fixedStartTime: string;
  /** Orario fisso di fine (HH:mm, modalità fixed). */
  fixedEndTime: string;
};

export const DEFAULT_RESERVATION_TIME_SETTINGS: ReservationTimeSettings = {
  mode: "opening_offset",
  startOffsetMinutes: 0,
  endOffsetMinutes: 0,
  fixedStartTime: "",
  fixedEndTime: "",
};

export type SiteSettingsState = {
  dinerSeparationAtTables: boolean;
  allowTakeaway: boolean;
  allowTableOrders: boolean;
  kitchenDisplayEnabled: boolean;
  showMenuPrices: boolean;
  moduleOverrides: Partial<Record<TenantFeatureKey, boolean>>;
  moduleSuspensions: Partial<Record<TenantFeatureKey, ModuleSuspension>>;
  /** Orari mostrati al pubblico (7 giorni, ordine fisso come in sede). */
  hoursWeek: DaySchedule[];
  phoneOverride: string;
  addressOverride: string;
  mainEmailOverride: string;
  workWithUsEnabled: boolean;
  workWithUsEmailOverride: string;
  collaborationsEnabled: boolean;
  collaborationsEmailOverride: string;
  socialLinks: SocialLinks;
  socialLinksConfigured: boolean;
  reservationTimeSettings: ReservationTimeSettings;
};

export type SettingsStore = SiteSettingsState & {
  set: (patch: Partial<SiteSettingsState>) => void;
  setModuleEnabled: (module: TenantFeatureKey, enabled: boolean) => void;
  suspendModule: (
    module: TenantFeatureKey,
    disabledUntil: number | null,
  ) => void;
  resetDefaults: () => void;
};

/** Valori di default delle impostazioni sito (anche per testi legali SSR). */
export const SITE_SETTINGS_DEFAULTS: SiteSettingsState = {
  dinerSeparationAtTables: false,
  allowTakeaway: true,
  allowTableOrders: true,
  kitchenDisplayEnabled: true,
  showMenuPrices: true,
  moduleOverrides: {},
  moduleSuspensions: {},
  hoursWeek: defaultHoursWeek(),
  phoneOverride: "",
  addressOverride: "",
  mainEmailOverride: "",
  workWithUsEnabled: false,
  workWithUsEmailOverride: "",
  collaborationsEnabled: false,
  collaborationsEmailOverride: "",
  socialLinks: EMPTY_SOCIAL_LINKS,
  socialLinksConfigured: false,
  reservationTimeSettings: DEFAULT_RESERVATION_TIME_SETTINGS,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...SITE_SETTINGS_DEFAULTS,
      set: (patch) => set((s) => ({ ...s, ...patch })),
      setModuleEnabled: (module, enabled) =>
        set((s) => {
          const nextModuleOverrides = {
            ...s.moduleOverrides,
            [module]: enabled,
          };
          const legacyPatch: Partial<SiteSettingsState> =
            module === "takeaway"
              ? { allowTakeaway: enabled }
              : module === "tableOrders"
                ? { allowTableOrders: enabled }
                : module === "kitchenDisplay"
                  ? { kitchenDisplayEnabled: enabled }
                  : module === "dinerSeparation"
                    ? { dinerSeparationAtTables: enabled }
                    : {};
          return {
            ...s,
            ...legacyPatch,
            moduleOverrides: nextModuleOverrides,
            moduleSuspensions: enabled
              ? withoutModuleSuspension(s.moduleSuspensions, module)
              : s.moduleSuspensions,
          };
        }),
      suspendModule: (module, disabledUntil) =>
        set((s) => {
          const nextModuleOverrides = {
            ...s.moduleOverrides,
            [module]: disabledUntil === null ? false : true,
          };
          const nextModuleSuspensions = {
            ...s.moduleSuspensions,
            [module]: {
              disabledUntil,
              createdAt: Date.now(),
            },
          };
          const legacyPatch: Partial<SiteSettingsState> =
            module === "takeaway"
              ? { allowTakeaway: disabledUntil !== null }
              : module === "tableOrders"
                ? { allowTableOrders: disabledUntil !== null }
                : module === "kitchenDisplay"
                  ? { kitchenDisplayEnabled: disabledUntil !== null }
                  : module === "dinerSeparation"
                    ? { dinerSeparationAtTables: disabledUntil !== null }
                    : {};
          return {
            ...s,
            ...legacyPatch,
            moduleOverrides: nextModuleOverrides,
            moduleSuspensions: nextModuleSuspensions,
          };
        }),
      resetDefaults: () =>
        set((prev) => ({
          ...prev,
          ...SITE_SETTINGS_DEFAULTS,
          hoursWeek: defaultHoursWeek(),
        })),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      storage: createBrowserLocalJSONStorage(),
      partialize: (s) => ({
        dinerSeparationAtTables: s.dinerSeparationAtTables,
        allowTakeaway: s.allowTakeaway,
        allowTableOrders: s.allowTableOrders,
        kitchenDisplayEnabled: s.kitchenDisplayEnabled,
        showMenuPrices: s.showMenuPrices,
        moduleOverrides: s.moduleOverrides,
        moduleSuspensions: s.moduleSuspensions,
        hoursWeek: s.hoursWeek,
        phoneOverride: s.phoneOverride,
        addressOverride: s.addressOverride,
        mainEmailOverride: s.mainEmailOverride,
        workWithUsEnabled: s.workWithUsEnabled,
        workWithUsEmailOverride: s.workWithUsEmailOverride,
        collaborationsEnabled: s.collaborationsEnabled,
        collaborationsEmailOverride: s.collaborationsEmailOverride,
        socialLinks: s.socialLinks,
        socialLinksConfigured: s.socialLinksConfigured,
        reservationTimeSettings: s.reservationTimeSettings,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SiteSettingsState>;
        const merged = { ...current, ...p };
        merged.showMenuPrices = p.showMenuPrices ?? current.showMenuPrices;
        merged.moduleOverrides = merged.moduleOverrides ?? {};
        merged.moduleSuspensions = merged.moduleSuspensions ?? {};
        merged.socialLinks = { ...EMPTY_SOCIAL_LINKS, ...(p.socialLinks ?? {}) };
        merged.socialLinksConfigured = p.socialLinksConfigured ?? current.socialLinksConfigured;
        merged.reservationTimeSettings = { ...DEFAULT_RESERVATION_TIME_SETTINGS, ...(p.reservationTimeSettings ?? {}) };
        if (!merged.hoursWeek || merged.hoursWeek.length !== 7) {
          merged.hoursWeek = defaultHoursWeek();
        }
        return merged as SettingsStore;
      },
    },
  ),
);

export function getLocalModuleEnabled(
  settings: Pick<
    SiteSettingsState,
    | "allowTakeaway"
    | "allowTableOrders"
    | "kitchenDisplayEnabled"
    | "dinerSeparationAtTables"
    | "moduleOverrides"
    | "moduleSuspensions"
  >,
  module: TenantFeatureKey,
  now = Date.now(),
): boolean {
  const baseEnabled =
    module === "takeaway"
      ? settings.allowTakeaway
      : module === "tableOrders"
        ? settings.allowTableOrders
        : module === "kitchenDisplay"
          ? settings.kitchenDisplayEnabled
          : module === "dinerSeparation"
            ? settings.dinerSeparationAtTables
            : settings.moduleOverrides[module] ?? true;

  if (!baseEnabled) return false;
  return !isModuleSuspensionActive(settings.moduleSuspensions[module], now);
}

export function isModuleSuspensionActive(
  suspension: ModuleSuspension | undefined,
  now = Date.now(),
): boolean {
  if (!suspension) return false;
  if (suspension.disabledUntil === null) return true;
  return suspension.disabledUntil > now;
}

function withoutModuleSuspension(
  suspensions: Partial<Record<TenantFeatureKey, ModuleSuspension>>,
  module: TenantFeatureKey,
) {
  const next = { ...suspensions };
  delete next[module];
  return next;
}
