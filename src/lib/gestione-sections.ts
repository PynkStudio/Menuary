import type { TenantFeatureFlags, TenantVertical } from "@/lib/tenant";
import type { StoreCapabilities } from "@/lib/store-roles";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { getModuleLabel } from "@/lib/vertical";
import type { GestioneMessages } from "@/i18n/gestione";

/**
 * Cosa serve per un'operazione di gestione:
 * - "member": qualsiasi membro abilitato del tenant, account dispositivo compresi
 *   (portale operativo: cucina, coda ordini, stampa)
 * - "staff": membro umano, esclusi kiosk e display cucina
 * - "admin": tenantadmin o siteadmin
 * - una capability di StoreCapabilities (gli admin le hanno tutte)
 */
export type GestioneRequirement = "member" | "staff" | "admin" | keyof StoreCapabilities;

export type GestioneViewer = {
  isAdmin: boolean;
  isDevice: boolean;
  capabilities: StoreCapabilities;
};

export function viewerMeets(viewer: GestioneViewer, need: GestioneRequirement): boolean {
  if (need === "member") return true;
  if (viewer.isAdmin) return true;
  if (viewer.isDevice) return false;
  if (need === "staff") return true;
  if (need === "admin") return false;
  return Boolean(viewer.capabilities[need]);
}

export type GestioneNavGroup = "today" | "offer" | "customers" | "channels" | "settings";

type ModuleAccess = ReturnType<typeof getGestioneModuleAccess>;

type SectionContext = {
  access: ModuleAccess;
  features: TenantFeatureFlags;
  vertical: TenantVertical;
};

export type GestioneSectionKey =
  | "dashboard"
  | "orders"
  | "kitchen"
  | "reservations"
  | "tables"
  | "menu"
  | "loyalty"
  | "google"
  | "blog"
  | "linktree"
  | "mail"
  | "analytics"
  | "aiAssistant"
  | "kiosk"
  | "rider"
  | "agenda"
  | "patrimoniale"
  | "activity"
  | "orderSettings"
  | "checkout"
  | "staff"
  | "shifts"
  | "billing"
  | "settings"
  | "profile";

export type GestioneSection = {
  key: GestioneSectionKey;
  /** Percorso relativo alla base gestione ("" = dashboard). */
  path: string;
  /** Sezioni senza gruppo stanno nel menu account, non nella navigazione. */
  group: GestioneNavGroup | null;
  need: GestioneRequirement;
  enabled: (ctx: SectionContext) => boolean;
};

/**
 * Unica tabella delle sezioni della gestione: la navigazione e i guard delle
 * pagine leggono da qui, così una voce visibile non può portare a un 404 e una
 * pagina non può restare aperta a chi non vede la voce.
 */
export const GESTIONE_SECTIONS: readonly GestioneSection[] = [
  { key: "dashboard", path: "", group: "today", need: "staff", enabled: () => true },
  { key: "orders", path: "ordini", group: "today", need: "member", enabled: ({ access }) => access.hasOrders },
  { key: "kitchen", path: "cucina", group: "today", need: "member", enabled: ({ access }) => Boolean(access.modules.kitchenDisplay) },
  { key: "reservations", path: "prenotazioni", group: "today", need: "can_manage_reservations", enabled: ({ access }) => access.canManageReservations },
  { key: "tables", path: "tavoli", group: "today", need: "can_manage_reservations", enabled: ({ access }) => access.canManageTables },
  { key: "agenda", path: "agenda", group: "today", need: "admin", enabled: ({ access }) => access.canManagePynkAgenda },

  { key: "menu", path: "listino", group: "offer", need: "can_edit_menu", enabled: ({ access }) => access.canManageMenu },

  { key: "loyalty", path: "fidelity", group: "customers", need: "admin", enabled: ({ access }) => access.canManageFidelity },
  { key: "google", path: "google", group: "customers", need: "admin", enabled: ({ access }) => access.hasGoogleBusiness },
  { key: "mail", path: "mail", group: "customers", need: "admin", enabled: ({ access }) => access.canManageMail },
  { key: "blog", path: "blog", group: "customers", need: "admin", enabled: ({ access }) => access.canManageBlog },
  { key: "linktree", path: "linktree", group: "customers", need: "admin", enabled: ({ access }) => access.canManageLinktree },
  { key: "analytics", path: "analytics", group: "customers", need: "can_view_analytics", enabled: ({ access }) => access.canViewAnalytics },

  { key: "aiAssistant", path: "assistente-ai", group: "channels", need: "admin", enabled: ({ access }) => Boolean(access.modules.aiPhone || access.modules.aiWhatsapp) },
  { key: "kiosk", path: "kiosk", group: "channels", need: "admin", enabled: ({ access }) => Boolean(access.modules.orderKiosk) },
  { key: "rider", path: "rider", group: "channels", need: "admin", enabled: ({ access }) => access.canManageRider },

  { key: "activity", path: "attivita", group: "settings", need: "admin", enabled: ({ access, vertical }) => access.canManageActivity && vertical !== "creative" },
  { key: "orderSettings", path: "ordini/impostazioni", group: "settings", need: "admin", enabled: ({ access }) => access.hasOrders },
  { key: "checkout", path: "cassa", group: "settings", need: "can_cassa", enabled: ({ access }) => access.canManageCheckout || access.canManagePrintStations },
  { key: "staff", path: "staff", group: "settings", need: "can_manage_staff", enabled: ({ access }) => access.canManageStaff },
  { key: "shifts", path: "turni", group: "settings", need: "can_manage_shifts", enabled: ({ access, vertical }) => access.canManageShifts && vertical !== "creative" },
  { key: "patrimoniale", path: "patrimoniale", group: "settings", need: "admin", enabled: ({ access }) => access.canManagePatrimoniale },

  { key: "billing", path: "fatturazione", group: null, need: "can_view_financials", enabled: () => true },
  { key: "settings", path: "impostazioni", group: null, need: "staff", enabled: () => true },
  { key: "profile", path: "profilo", group: null, need: "staff", enabled: () => true },
];

export const GESTIONE_NAV_GROUPS: readonly GestioneNavGroup[] = ["today", "offer", "customers", "channels", "settings"];

export function getGestioneSection(key: GestioneSectionKey): GestioneSection {
  const section = GESTIONE_SECTIONS.find((item) => item.key === key);
  if (!section) throw new Error(`Sezione gestione sconosciuta: ${key}`);
  return section;
}

export function isGestioneSectionAvailable(
  section: GestioneSection,
  tenant: { features: TenantFeatureFlags; vertical: TenantVertical },
  viewer: GestioneViewer,
): boolean {
  const access = getGestioneModuleAccess(tenant.features);
  return (
    section.enabled({ access, features: tenant.features, vertical: tenant.vertical }) &&
    viewerMeets(viewer, section.need)
  );
}

/** Etichetta di una sezione: le voci legate a un modulo usano il nome del verticale. */
export function getGestioneSectionLabel(
  key: GestioneSectionKey,
  tenant: { features: TenantFeatureFlags; vertical: TenantVertical },
  labels: GestioneMessages["navigation"],
): string {
  const { vertical } = tenant;
  switch (key) {
    case "menu":
      return getModuleLabel(vertical === "creative" ? "worksCatalog" : "onlineMenu", vertical);
    case "reservations":
      return getModuleLabel(vertical === "creative" ? "creativeBooking" : "reservations", vertical);
    case "tables":
      return getModuleLabel("tablePlanner", vertical);
    case "loyalty":
      if (vertical === "creative") return getModuleLabel("fanbaseCommunity", vertical);
      return vertical === "services" ? labels.items.customersCrm : labels.items.loyalty;
    case "checkout":
      return getGestioneModuleAccess(tenant.features).canManageCheckout ? labels.items.checkout : labels.items.printers;
    default:
      return labels.items[key];
  }
}
