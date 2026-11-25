/**
 * Server-only bridge to PerX's platform-admin API. Never import this file
 * from a "use client" component — PERX_ADMIN_API_KEY has no NEXT_PUBLIC_
 * prefix on purpose and must never reach the browser bundle. Pages under
 * admin-pynkstudio/perx are Server Components that call this directly.
 */
const PERX_ADMIN_API_URL = process.env.PERX_ADMIN_API_URL ?? "";
const PERX_ADMIN_API_KEY = process.env.PERX_ADMIN_API_KEY ?? "";

class PerxApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`PerX admin API ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function perxFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${PERX_ADMIN_API_URL}${path}`, {
    ...options,
    headers: {
      "X-PerX-Admin-Key": PERX_ADMIN_API_KEY,
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new PerxApiError(res.status, body);
  return body as T;
}

export type PerxTenant = {
  id: string;
  name: string;
  slug: string;
};

export type PerxTenantSettings = {
  tenant_id: string;
  [key: string]: unknown;
};

export type PerxAdminCapability = {
  resource: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type PerxAdminOverview = {
  service: "perx";
  api_version: "v1";
  single_tenant_mode: boolean;
  counts: {
    tenants: number;
    users: number;
    active_users: number;
    domain_routes: number;
    active_domain_routes: number;
    unresolved_errors: number;
    unresolved_critical_errors: number;
  };
  capabilities: PerxAdminCapability[];
};

export type PerxUser = {
  id: string;
  tenant_id: string;
  email: string;
  personal_email?: string | null;
  professional_email?: string | null;
  full_name: string;
  is_active: boolean;
  is_platform_admin: boolean;
};

export type PerxDomainRoute = {
  id: string;
  hostname: string;
  app: "bignami" | "catdispatcher" | "insight_studio" | "perx_admin" | "randa" | "insured_portal";
  tenant_id?: string | null;
  tenant_name?: string | null;
  destination_url?: string | null;
  is_active: boolean;
  notes?: string | null;
  metadata_json?: Record<string, unknown> | null;
};

export type PerxErrorSeverity = "warning" | "error" | "critical";

export type PerxErrorLog = {
  id: string;
  tenant_id?: string | null;
  tenant_name?: string | null;
  source: string;
  severity: PerxErrorSeverity;
  message: string;
  stack_trace?: string | null;
  path?: string | null;
  method?: string | null;
  status_code?: number | null;
  context_json?: Record<string, unknown> | null;
  resolved: boolean;
  resolved_at?: string | null;
  resolved_by_user_id?: string | null;
  created_at: string;
};

export const perxApi = {
  getOverview: () => perxFetch<PerxAdminOverview>("/overview"),

  listTenants: () => perxFetch<PerxTenant[]>("/tenants"),

  getTenantSettings: (id: string) =>
    perxFetch<PerxTenantSettings>(`/tenants/${id}/settings`),

  listUsers: (tenantId?: string) =>
    perxFetch<PerxUser[]>(`/users${tenantId ? `?tenant_id=${tenantId}` : ""}`),

  listDomainRoutes: () => perxFetch<PerxDomainRoute[]>("/domain-routes"),

  listErrors: (params?: { tenant_id?: string; severity?: PerxErrorSeverity; resolved?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.tenant_id) search.set("tenant_id", params.tenant_id);
    if (params?.severity) search.set("severity", params.severity);
    if (params?.resolved !== undefined) search.set("resolved", String(params.resolved));
    const qs = search.toString();
    return perxFetch<PerxErrorLog[]>(`/errors${qs ? `?${qs}` : ""}`);
  },

  resolveError: (id: string, resolved = true) =>
    perxFetch<PerxErrorLog>(`/errors/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ resolved }),
    }),
};
