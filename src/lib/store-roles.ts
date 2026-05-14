/**
 * Sistema ruoli e permessi per gestione.menuary.it
 *
 * Ogni utente ha un ruolo base che definisce i permessi di default.
 * Il campo `permissions` su admin_users contiene gli override espliciti:
 *   { can_cassa: true, can_manage_shifts: true }
 *
 * Per ottenere i permessi effettivi: getEffectiveCapabilities(role, permissions)
 */

export const STORE_ROLES = [
  "titolare",
  "manager",
  "chef",
  "cameriere",
  "personale_cucina",
] as const;

export const DEVICE_ROLES = ["kitdisplay", "kiosk"] as const;

export const PLATFORM_ROLES = ["platform_admin", "tenant_admin"] as const;

export type StoreRole = (typeof STORE_ROLES)[number];
export type DeviceRole = (typeof DEVICE_ROLES)[number];
export type AdminRole = StoreRole | DeviceRole | (typeof PLATFORM_ROLES)[number];

export interface StoreCapabilities {
  /** Accesso alla cassa (pagamenti, chiusura conto) */
  can_cassa: boolean;
  /** Può modificare menu e disponibilità voci */
  can_edit_menu: boolean;
  /** Vede e gestisce le prenotazioni */
  can_manage_reservations: boolean;
  /** Vede analytics e report del locale */
  can_view_analytics: boolean;
  /** Può creare/modificare turni altrui */
  can_manage_shifts: boolean;
  /** Può invitare e gestire account staff */
  can_manage_staff: boolean;
  /** Vede report finanziari e impostazioni abbonamento */
  can_view_financials: boolean;
}

/** Permessi di default per ogni ruolo — sovrascrivibili via admin_users.permissions */
export const ROLE_DEFAULTS: Record<StoreRole, StoreCapabilities> = {
  titolare: {
    can_cassa: true,
    can_edit_menu: true,
    can_manage_reservations: true,
    can_view_analytics: true,
    can_manage_shifts: true,
    can_manage_staff: true,
    can_view_financials: true,
  },
  manager: {
    can_cassa: false,
    can_edit_menu: true,
    can_manage_reservations: true,
    can_view_analytics: true,
    can_manage_shifts: true,
    can_manage_staff: false,
    can_view_financials: false,
  },
  chef: {
    can_cassa: false,
    can_edit_menu: true,
    can_manage_reservations: false,
    can_view_analytics: false,
    can_manage_shifts: false,
    can_manage_staff: false,
    can_view_financials: false,
  },
  cameriere: {
    can_cassa: false,
    can_edit_menu: false,
    can_manage_reservations: true,
    can_view_analytics: false,
    can_manage_shifts: false,
    can_manage_staff: false,
    can_view_financials: false,
  },
  personale_cucina: {
    can_cassa: false,
    can_edit_menu: false,
    can_manage_reservations: false,
    can_view_analytics: false,
    can_manage_shifts: false,
    can_manage_staff: false,
    can_view_financials: false,
  },
};

/**
 * Restituisce i permessi effettivi combinando i default del ruolo
 * con gli override espliciti salvati in admin_users.permissions
 */
export function getEffectiveCapabilities(
  role: AdminRole,
  permissionsOverride: Record<string, boolean> = {},
): StoreCapabilities {
  if (!STORE_ROLES.includes(role as StoreRole)) {
    // platform_admin e tenant_admin: accesso pieno
    const full: StoreCapabilities = {
      can_cassa: true,
      can_edit_menu: true,
      can_manage_reservations: true,
      can_view_analytics: true,
      can_manage_shifts: true,
      can_manage_staff: true,
      can_view_financials: true,
    };
    return full;
  }
  return {
    ...ROLE_DEFAULTS[role as StoreRole],
    ...permissionsOverride,
  };
}

/** Etichette leggibili per UI */
export const ROLE_LABELS: Record<AdminRole, string> = {
  platform_admin: "Admin piattaforma",
  tenant_admin: "Titolare (legacy)",
  titolare: "Titolare",
  manager: "Manager",
  chef: "Chef",
  cameriere: "Cameriere",
  personale_cucina: "Personale cucina",
  kitdisplay: "Display cucina",
  kiosk: "Kiosk",
};

/** Ruoli che possono fare login personale (non dispositivo) */
export function isPersonalRole(role: AdminRole): role is StoreRole {
  return STORE_ROLES.includes(role as StoreRole);
}

/** Tutti gli utenti possono vedere il proprio schedule turni (se modulo attivo) */
export const SHIFTS_MODULE = "shifts" as const;
