/**
 * Utilità per costruire e interpretare gli URL di login.menuary.it
 *
 * Schema del parametro `from`:
 *   "admin"           → admin.menuary.it          (platform admin)
 *   "studio"          → studio.menuary.it          (fatturazione B2B)
 *   "clienti"         → clienti.menuary.it         (portale clienti)
 *   "gestione.bepork" → gestione.menuary.it/bepork (pannello store)
 *   "app.ios"         → deep link iOS app (futuro)
 *   "app.android"     → deep link Android app (futuro)
 */

export type LoginFrom =
  | "admin"
  | "studio"
  | "clienti"
  | `gestione.${string}`
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

/** Costruisce il redirect_to da passare a supabase.auth.admin.inviteUserByEmail */
export function buildAuthCallbackUrl(from: LoginFrom): string {
  const base =
    process.env.NODE_ENV === "production"
      ? "https://login.menuary.it"
      : "http://login.menuary.localhost:3000";
  return `${base}/api/auth/callback?from=${encodeURIComponent(from)}`;
}

/** Valida e normalizza il param `from` — previene open redirect */
export function parseFrom(raw: string | null | undefined): LoginFrom | null {
  if (!raw) return null;
  const allowed: LoginFrom[] = ["admin", "studio", "clienti"];
  if ((allowed as string[]).includes(raw)) return raw as LoginFrom;
  if (/^gestione\.[a-z0-9-]+$/.test(raw)) return raw as LoginFrom;
  if (/^app\.(ios|android)$/.test(raw)) return raw as LoginFrom;
  return null;
}

/** Valida il param `next` — solo path locali, no open redirect */
export function parseNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return null;
}

/** Estrae il tenant slug da `from=gestione.bepork` → "bepork" */
export function tenantSlugFromFrom(from: LoginFrom | null): string | null {
  if (!from?.startsWith("gestione.")) return null;
  return from.split(".")[1] ?? null;
}

/** Risolve l'URL di destinazione post-login in base a `from` e al ruolo */
export function resolveDestination(options: {
  from: LoginFrom | null;
  next: string | null;
  role: string | null;
  tenantId: string | null;
}): string {
  const { from, next, role, tenantId } = options;
  const isPlatformAdmin = role === "platform_admin" || role === "tenant_admin";
  const isStoreStaff = !isPlatformAdmin && !!tenantId;

  // Prova a onorare 'from' se l'utente ha accesso
  if (from === "admin" && isPlatformAdmin) {
    return `https://admin.menuary.it${next ?? ""}`;
  }
  if (from === "studio" && (isPlatformAdmin || isStoreStaff)) {
    return `https://studio.menuary.it${next ?? ""}`;
  }
  if (from === "clienti") {
    return `https://clienti.menuary.it${next ?? ""}`;
  }
  if (from?.startsWith("gestione.")) {
    const slug = tenantSlugFromFrom(from);
    const canAccess =
      isPlatformAdmin || (isStoreStaff && tenantId === slug);
    if (slug && canAccess) {
      return `https://gestione.menuary.it/${slug}${next ?? ""}`;
    }
  }

  // Fallback per ruolo
  if (!role && !tenantId) return "https://clienti.menuary.it";
  if (isPlatformAdmin) return "https://admin.menuary.it";
  if (isStoreStaff) return `https://gestione.menuary.it/${tenantId}`;
  return "https://clienti.menuary.it";
}
