import {
  findTenantByDomain,
  findTenantByPreviewSlug,
  getDefaultTenantForVertical,
} from "./tenant-registry";
import { getPlatformModeFromHost } from "./platform";
import type { TenantProfile } from "./tenant";

function verticalFromMode(mode: ReturnType<typeof getPlatformModeFromHost>): TenantProfile["vertical"] {
  return mode === "marketing-bizery" || mode === "preview-bizery" || mode === "gestione-bizery"
    ? "services"
    : "food";
}

export function resolveTenantFromHost(host: string | null | undefined): TenantProfile {
  if (!host) return getDefaultTenantForVertical("food");
  const tenant = findTenantByDomain(host);
  if (tenant) return tenant;
  const vertical = verticalFromMode(getPlatformModeFromHost(host));
  return getDefaultTenantForVertical(vertical);
}

export function resolveTenantFromPreviewSlug(
  slug: string | null | undefined,
  host?: string | null,
): TenantProfile {
  if (!slug) return getDefaultTenantForVertical(host ? verticalFromMode(getPlatformModeFromHost(host)) : "food");
  return findTenantByPreviewSlug(slug) ?? getDefaultTenantForVertical(
    host ? verticalFromMode(getPlatformModeFromHost(host)) : "food",
  );
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
  const RESERVED = new Set(["www", "app", "api", "mail", "smtp", "ftp", "admin", "demo", "gestione", "clienti", "login", "studio"]);
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
