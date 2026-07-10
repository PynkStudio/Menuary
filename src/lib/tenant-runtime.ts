import {
  findTenantByDomain,
  findTenantByManagementHost,
  findTenantByPrefixedHost,
  findTenantByPreviewSlug,
} from "./tenant-registry";
import type { TenantProfile } from "./tenant";

export function resolveTenantFromHost(host: string | null | undefined): TenantProfile | undefined {
  if (!host) return undefined;
  const managementTenant = findTenantByManagementHost(host);
  if (managementTenant) return managementTenant;
  return findTenantByDomain(host);
}

export function resolveTenantFromManagementHost(
  host: string | null | undefined,
): TenantProfile | undefined {
  if (!host) return undefined;
  return findTenantByManagementHost(host);
}

export function resolveTenantFromPrefixedHost(
  host: string | null | undefined,
  prefix: "gestione" | "ordini" | "cassa" | "kiosk" | "cucina" | "rider",
): TenantProfile | undefined {
  if (!host) return undefined;
  return findTenantByPrefixedHost(host, prefix);
}

export function resolveTenantFromPreviewSlug(
  slug: string | null | undefined,
  _host?: string | null,
): TenantProfile | undefined {
  if (!slug) return undefined;
  return findTenantByPreviewSlug(slug);
}

/** Sede opzionale da query (?loc=slug) per multi-sede senza cambiare host. */
export function resolveLocationSlugFromSearchParams(
  searchParams: URLSearchParams | null | undefined,
): string | null {
  if (!searchParams) return null;
  return searchParams.get("loc") ?? searchParams.get("location");
}

/**
 * Sede da sottodominio: milano.tenant.it → "milano".
 * Controlla se `host` è un sottodominio di uno dei domini del tenant.
 * Reserved subdomains (www, app, api, mail, smtp, ftp) vengono ignorati.
 * Ritorna null se il host non è un sottodominio di un dominio del tenant.
 */
export function resolveLocationSlugFromHost(
  host: string | null | undefined,
  tenantDomains: string[],
): string | null {
  if (!host) return null;
  const RESERVED = new Set(["www", "app", "api", "mail", "smtp", "ftp", "admin", "demo", "gestione", "ordini", "cassa", "kiosk", "cucina", "rider", "clienti", "login", "studio"]);
  const normalized = host.split(":")[0].toLowerCase();
  for (const domain of tenantDomains) {
    const d = domain.toLowerCase();
    if (normalized.endsWith("." + d)) {
      const sub = normalized.slice(0, normalized.length - d.length - 1);
      if (sub && !sub.includes(".") && !RESERVED.has(sub)) return sub;
    }
  }
  return null;
}

/**
 * Risolve lo slug di sede dall'host o dai searchParams, in ordine di priorità:
 * 1. Sottodominio (milano.tenant.it)
 * 2. Query param (?loc=milano)
 */
export function resolveLocationSlug(
  host: string | null | undefined,
  tenantDomains: string[],
  searchParams: URLSearchParams | null | undefined,
): string | null {
  return (
    resolveLocationSlugFromHost(host, tenantDomains) ??
    resolveLocationSlugFromSearchParams(searchParams)
  );
}
