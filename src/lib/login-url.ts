/**
 * Utilità per costruire e interpretare gli URL di login.menuary.it
 *
 * Schema del parametro `from`:
 *   "admin"                  → admin.menuary.it              (platform admin)
 *   "studio"                 → studio.menuary.it             (fatturazione B2B)
 *   "clienti"                → clienti.menuary.it            (portale clienti)
 *   "gestione.bepork"        → gestione.menuary.it/bepork    (pannello store food)
 *   "gestione-bizery.acme"   → gestione.bizery.it/acme       (pannello store bizery, cross-domain popup)
 *   "app.ios"                → deep link iOS app (futuro)
 *   "app.android"            → deep link Android app (futuro)
 */

export type LoginFrom =
  | "admin"
  | "studio"
  | "clienti"
  | `gestione.${string}`
  | `gestione-bizery.${string}`
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

/** Valida e normalizza il param `from` — previene open redirect */
export function parseFrom(raw: string | null | undefined): LoginFrom | null {
  if (!raw) return null;
  const allowed: LoginFrom[] = ["admin", "studio", "clienti"];
  if ((allowed as string[]).includes(raw)) return raw as LoginFrom;
  if (/^gestione\.[a-z0-9-]+$/.test(raw)) return raw as LoginFrom;
  if (/^gestione-bizery\.[a-z0-9-]+$/.test(raw)) return raw as LoginFrom;
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
  if (from.startsWith("gestione.")) return from.split(".")[1] ?? null;
  return null;
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

  // Fallback per ruolo
  if (isSiteadmin) return "https://admin.menuary.it";
  if (tenantId)    return `https://gestione.menuary.it/${tenantId}`;
  return "https://clienti.menuary.it";
}
