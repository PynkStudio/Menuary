export const SUPERADMIN_EMAIL = "info@menuary.it";

export const SITEADMIN_ROLES = [
  "superadmin",
  "admin",
  "venditore",
  "amministrazione",
  "gestore",
  "lead_inserter",
] as const;

export type SiteadminRole = (typeof SITEADMIN_ROLES)[number];

export type AdminPermission =
  | "crm:view"
  | "crm:create"
  | "crm:delete"
  | "crm:demo"
  | "packages:manage"
  | "subscriptions:view"
  | "commissions:view"
  | "tenant:manage"
  | "users:manage"
  | "inbox:view"
  | "inbox:compose"
  | "support:manage";

export const SITEADMIN_ROLE_LABELS: Record<SiteadminRole, string> = {
  superadmin: "Super admin",
  admin: "Admin",
  venditore: "Commerciale",
  amministrazione: "Amministrazione",
  gestore: "Gestore",
  lead_inserter: "Inserimento lead",
};

export const SITEADMIN_ROLE_DESCRIPTIONS: Record<SiteadminRole, string> = {
  superadmin: "Accesso completo a piattaforma, tenant, piani, billing e utenti.",
  admin: "Gestione operativa completa della piattaforma, inclusi inviti e revoche.",
  venditore: "CRM, lead, creazione demo, venduto e consultazione provvigioni.",
  amministrazione: "Abbonamenti, pagamenti, fatture e provvigioni.",
  gestore: "Tenant, moduli, sedi e pannelli di gestione cliente.",
  lead_inserter: "Può solo aggiungere lead manualmente, senza vedere il CRM completo.",
};

export const DEFAULT_COMMISSION_BY_SITEADMIN_ROLE: Record<SiteadminRole, number> = {
  superadmin: 30,
  admin: 30,
  venditore: 30,
  amministrazione: 30,
  gestore: 30,
  lead_inserter: 10,
};

const ALL_PERMISSIONS: AdminPermission[] = [
  "crm:view",
  "crm:create",
  "crm:delete",
  "crm:demo",
  "packages:manage",
  "subscriptions:view",
  "commissions:view",
  "tenant:manage",
  "users:manage",
  "inbox:view",
  "inbox:compose",
  "support:manage",
];

export const ROLE_PERMISSIONS: Record<SiteadminRole, AdminPermission[]> = {
  superadmin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  venditore: ["crm:view", "crm:create", "crm:demo", "commissions:view", "inbox:view", "inbox:compose", "support:manage"],
  amministrazione: ["subscriptions:view", "commissions:view", "inbox:view", "inbox:compose", "support:manage"],
  gestore: ["tenant:manage", "inbox:view", "support:manage"],
  lead_inserter: ["crm:create"],
};

export function isSiteadminRole(role: string | null | undefined): role is SiteadminRole {
  return SITEADMIN_ROLES.includes(role as SiteadminRole);
}

export function hasAdminPermission(
  role: SiteadminRole | null | undefined,
  permission: AdminPermission,
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getDefaultAdminPath(role: SiteadminRole | null | undefined): string {
  if (!role) return "/admin/login";
  if (hasAdminPermission(role, "crm:view")) return "/admin/crm";
  if (hasAdminPermission(role, "crm:create")) return "/admin/crm/nuovo";
  if (hasAdminPermission(role, "subscriptions:view")) return "/admin/abbonamenti";
  if (hasAdminPermission(role, "tenant:manage")) return "/admin/tenant";
  return "/admin/login";
}

export function requiredPermissionForAdminPath(pathname: string): AdminPermission | null {
  const normalized = pathname.replace(/\/+$/, "") || "/admin";
  if (normalized === "/admin/login" || normalized === "/admin/set-password") return null;
  if (normalized === "/admin/crm/nuovo") return "crm:create";
  if (normalized.startsWith("/admin/crm/nuovo/")) return "crm:create";
  if (normalized === "/admin/crm" || normalized.startsWith("/admin/crm/")) return "crm:view";
  if (normalized === "/admin/pacchetti" || normalized.startsWith("/admin/pacchetti/")) return "packages:manage";
  if (normalized === "/admin/assistente-ai" || normalized.startsWith("/admin/assistente-ai/")) return "tenant:manage";
  if (normalized === "/admin/abbonamenti" || normalized.startsWith("/admin/abbonamenti/")) return "subscriptions:view";
  if (normalized === "/admin/provvigioni" || normalized.startsWith("/admin/provvigioni/")) return "commissions:view";
  if (normalized === "/admin/tenant" || normalized.startsWith("/admin/tenant/")) return "tenant:manage";
  if (normalized === "/admin/utenti" || normalized.startsWith("/admin/utenti/")) return "users:manage";
  if (normalized === "/admin/inbox" || normalized.startsWith("/admin/inbox/")) return "inbox:view";
  if (normalized === "/admin/supporto" || normalized.startsWith("/admin/supporto/")) return "support:manage";
  return "users:manage";
}

export function canAccessAdminPath(role: SiteadminRole | null | undefined, pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/admin";
  if (normalized === "/admin") return Boolean(role && role !== "lead_inserter");
  const permission = requiredPermissionForAdminPath(normalized);
  if (!permission) return true;
  return hasAdminPermission(role, permission);
}
