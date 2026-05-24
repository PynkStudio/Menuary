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
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SiteSettingsState>;
        const merged = { ...current, ...p };
        merged.showMenuPrices = p.showMenuPrices ?? current.showMenuPrices;
        merged.moduleOverrides = merged.moduleOverrides ?? {};
        merged.moduleSuspensions = merged.moduleSuspensions ?? {};
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
