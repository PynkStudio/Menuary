/**
 * Ruoli e permessi per gestione.menuary.it
 *
 * SiteadminRole → chi opera su admin.menuary.it (siteadmin table)
 * EmployeeRole  → dipendenti degli store (employee table)
 *
 * getEffectiveCapabilities() combina i default del ruolo con gli override
 * espliciti salvati in employee.permissions
 */

export const EMPLOYEE_ROLES = [
  "manager",
  "chef",
  "cameriere",
  "personale_cucina",
] as const;

export const DEVICE_ROLES = ["kitdisplay", "kiosk"] as const;

export type SiteadminRole = "superadmin" | "admin" | "venditore" | "amministrazione" | "gestore";
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number] | (typeof DEVICE_ROLES)[number];

/** @deprecated Usa EMPLOYEE_ROLES */
export const STORE_ROLES = EMPLOYEE_ROLES;

export interface StoreCapabilities {
  can_cassa: boolean;
  can_edit_menu: boolean;
  can_manage_reservations: boolean;
  can_view_analytics: boolean;
  can_manage_shifts: boolean;
  can_manage_staff: boolean;
  can_view_financials: boolean;
}

export const ROLE_DEFAULTS: Record<(typeof EMPLOYEE_ROLES)[number], StoreCapabilities> = {
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

const FULL_ACCESS: StoreCapabilities = {
  can_cassa: true,
  can_edit_menu: true,
  can_manage_reservations: true,
  can_view_analytics: true,
  can_manage_shifts: true,
  can_manage_staff: true,
  can_view_financials: true,
};

export function getEffectiveCapabilities(
  role: EmployeeRole | null,
  permissionsOverride: Record<string, boolean> = {},
): StoreCapabilities {
  if (!role || !EMPLOYEE_ROLES.includes(role as never)) return FULL_ACCESS;
  return { ...ROLE_DEFAULTS[role as (typeof EMPLOYEE_ROLES)[number]], ...permissionsOverride };
}

export const ROLE_LABELS: Record<SiteadminRole | EmployeeRole, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  venditore: "Venditore",
  amministrazione: "Amministrazione",
  gestore: "Gestore",
  manager: "Manager",
  chef: "Chef",
  cameriere: "Cameriere",
  personale_cucina: "Personale cucina",
  kitdisplay: "Display cucina",
  kiosk: "Kiosk",
};
