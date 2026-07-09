/**
 * Utilità per costruire e interpretare gli URL di login.menuary.it
 *
 * Schema del parametro `from`:
 *   "admin"                  → admin.menuary.it              (platform admin)
 *   "studio"                 → studio.menuary.it             (fatturazione B2B)
 *   "clienti"                → clienti.menuary.it            (portale clienti)
 *   "gestione.bepork"        → gestione.menuary.it/bepork    (pannello store food)
 *   "gestione-bizery.acme"   → gestione.bizery.it/acme       (pannello store bizery, cross-domain popup)
 *   "gestione-custom.bepork" -> gestione.tenant.example      (pannello store sul dominio tenant)
 *   "gestione-demo.bepork"   → demo.menuary.it/bepork/gestione
 *   "app.ios"                → deep link iOS app (futuro)
 *   "app.android"            → deep link Android app (futuro)
 */

import { findTenantById } from "@/lib/tenant-registry";

export type LoginFrom =
  | "admin"
  | "admin-pynkstudio"
  | "studio"
  | "clienti"
  | `gestione.${string}`
  | `gestione-bizery.${string}`
  | `gestione-custom.${string}`
  | `gestione-demo.${string}`
  | `app.${string}`;

const LOGIN_BASE =
  process.env.NODE_ENV === "production"
    ? "https://login.menuary.it"
    : "http://login.menuary.localhost:3000";

/** Costruisce l'URL per il login centralizzato */
export function buildLoginUrl(options: {
  from: LoginFrom;
  next?: string;
  popup?: boolean;
  /** Origine del chiamante (window.location.origin) — usato dal popup per il postMessage sicuro */
  origin?: string;
}): string {
  const url = new URL(LOGIN_BASE);
  url.searchParams.set("from", options.from);
  if (options.next) url.searchParams.set("next", options.next);
  if (options.popup) url.searchParams.set("popup", "1");
  if (options.origin) url.searchParams.set("origin", options.origin);
  return url.toString();
}

export function buildPasskeysUrl(options: {
  from: LoginFrom;
  next?: string;
}): string {
  const url = new URL("/passkeys", LOGIN_BASE);
  url.searchParams.set("from", options.from);
  if (options.next) url.searchParams.set("next", options.next);
  return url.toString();
}

const LOGIN_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://login.menuary.it"
    : "http://login.menuary.localhost:3000";

/**
 * URL di conferma per inviti e link email.
 * Usa /confirm (client-side) che gestisce tutti i formati:
 * hash fragment (implicit), token_hash (OTP diretto), code (PKCE).
 */
export function buildAuthCallbackUrl(from: LoginFrom): string {
  return `${LOGIN_BASE_URL}/confirm?from=${encodeURIComponent(from)}`;
}

/**
 * URL di conferma per recovery (resetPasswordForEmail).
 * Aggiunge mode=recovery così la pagina sa redirigere a set-password.
 */
export function buildRecoveryCallbackUrl(from: LoginFrom): string {
  return `${LOGIN_BASE_URL}/confirm?from=${encodeURIComponent(from)}&mode=recovery`;
}

/**
 * Valida che `url` sia una destinazione sicura post-login.
 * Accetta: HTTPS su domini Menuary/PynkStudio, o path locale (/…).
 * Previene open redirect su pagine di conferma e redirect intermedi.
 */
const SAFE_DESTINATION_RE =
  /^https:\/\/[a-z0-9-]+\.(menuary\.it|pynkstudio\.it|pynkstudio\.com|pynkstudio\.eu)(\/.*)?$/;

export function isSafeDestination(url: string | null | undefined): url is string {
  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  return SAFE_DESTINATION_RE.test(url);
}

/** Valida e normalizza il param `from` — previene open redirect */
export function parseFrom(raw: string | null | undefined): LoginFrom | null {
  if (!raw) return null;
  const allowed: LoginFrom[] = ["admin", "admin-pynkstudio", "studio", "clienti"];
  if ((allowed as string[]).includes(raw)) return raw as LoginFrom;
  if (/^gestione\.[a-z0-9-]+$/.test(raw)) return raw as LoginFrom;
  if (/^gestione-bizery\.[a-z0-9-]+$/.test(raw)) return raw as LoginFrom;
  if (/^gestione-custom\.[a-z0-9-]+$/.test(raw)) return raw as LoginFrom;
  if (/^gestione-demo\.[a-z0-9-]+$/.test(raw)) return raw as LoginFrom;
  if (/^app\.(ios|android)$/.test(raw)) return raw as LoginFrom;
  return null;
}

/** Valida il param `next` — solo path locali, no open redirect */
export function parseNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return null;
}

/** Estrae il tenant slug da `from=gestione.bepork` → "bepork" o da `from=gestione-bizery.acme` → "acme" */
export function tenantSlugFromFrom(from: LoginFrom | null): string | null {
  if (!from) return null;
  if (from.startsWith("gestione-bizery.")) return from.slice("gestione-bizery.".length) || null;
  if (from.startsWith("gestione-custom.")) return from.slice("gestione-custom.".length) || null;
  if (from.startsWith("gestione-demo.")) return from.slice("gestione-demo.".length) || null;
  if (from.startsWith("gestione.")) return from.split(".")[1] ?? null;
  return null;
}

function firstPublicTenantDomain(tenantId: string): string | null {
  const tenant = findTenantById(tenantId);
  const domains = tenant?.domains ?? [];
  return (
    domains.find((domain) => !domain.startsWith("www.") && !domain.includes("localhost") && domain !== "127.0.0.1") ??
    domains.find((domain) => !domain.startsWith("www.")) ??
    domains[0] ??
    null
  );
}

export function buildTenantManagementUrl(tenantId: string, next: string | null = null): string | null {
  const domain = firstPublicTenantDomain(tenantId);
  if (!domain) return null;
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const port = process.env.NODE_ENV === "production" ? "" : ":3000";
  return `${protocol}://gestione.${domain}${port}${next ?? ""}`;
}

export function buildTenantDemoManagementUrl(tenantId: string, next: string | null = null): string {
  const tenant = findTenantById(tenantId);
  const isServices = tenant?.vertical === "services";
  const isCreative = tenant?.vertical === "creative";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = process.env.NODE_ENV === "production"
    ? isCreative ? "demo.weuseorpheo.com" : isServices ? "demo.bizery.it" : "demo.menuary.it"
    : isCreative ? "demo.weuseorpheo.localhost" : isServices ? "demo.bizery.localhost" : "demo.menuary.localhost";
  const port = process.env.NODE_ENV === "production" ? "" : ":3000";
  return `${protocol}://${host}${port}/${tenantId}/gestione${next ?? ""}`;
}

/** Risolve l'URL di destinazione post-login */
export function resolveDestination(options: {
  from: LoginFrom | null;
  next: string | null;
  isSiteadmin: boolean;
  tenantId: string | null;
}): string {
  const { from, next, isSiteadmin, tenantId } = options;

  if (from === "admin" && isSiteadmin) return `https://admin.menuary.it${next ?? ""}`;
  if (from === "admin-pynkstudio" && isSiteadmin) return `https://admin.pynkstudio.it${next ?? ""}`;
  if (from === "studio") {
    if (isSiteadmin) return "https://admin.menuary.it";
    if (tenantId)    return `https://gestione.menuary.it/${tenantId}/fatturazione${next ?? ""}`;
  }
  if (from === "clienti") return `https://clienti.menuary.it${next ?? ""}`;
  if (from?.startsWith("gestione.")) {
    const slug = tenantSlugFromFrom(from);
    if (slug && (isSiteadmin || tenantId === slug))
      return `https://gestione.menuary.it/${slug}${next ?? ""}`;
  }
  if (from?.startsWith("gestione-bizery.")) {
    const slug = tenantSlugFromFrom(from);
    if (slug && (isSiteadmin || tenantId === slug))
      return `https://gestione.bizery.it/${slug}${next ?? ""}`;
  }
  if (from?.startsWith("gestione-custom.")) {
    const slug = tenantSlugFromFrom(from);
    if (slug && (isSiteadmin || tenantId === slug)) {
      const destination = buildTenantManagementUrl(slug, next);
      if (destination) return destination;
    }
  }
  if (from?.startsWith("gestione-demo.")) {
    const slug = tenantSlugFromFrom(from);
    if (slug && (isSiteadmin || tenantId === slug))
      return buildTenantDemoManagementUrl(slug, next);
  }

  // Fallback per ruolo
  if (isSiteadmin) return "https://admin.menuary.it";
  if (tenantId)    return `https://gestione.menuary.it/${tenantId}`;
  return "https://clienti.menuary.it";
}
