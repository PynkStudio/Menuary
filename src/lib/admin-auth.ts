// Auth admin gestita da Supabase via middleware.
// Questo file è mantenuto per compatibilità con eventuali import esistenti.
// Il vecchio sistema password + localStorage non è più in uso per admin.menuary.it.

export const ADMIN_SESSION_KEY = "menuary-admin-session";
export const ADMIN_TOKEN_HEADER = "x-menuary-admin";

/** @deprecated Non più usato — auth gestita da Supabase */
export function readAdminSession(): boolean {
  return false;
}

/** @deprecated Non più usato — auth gestita da Supabase */
export function setAdminSession(): void {}

/** @deprecated Non più usato — auth gestita da Supabase */
export function clearAdminSession(): void {}

/** @deprecated Non più usato — auth gestita da Supabase */
export function getAdminPassword(): string {
  return "";
}

/** Dopo login: solo path interni admin/cucina (no open redirect). */
export function getSafeAdminPostLoginPath(raw: string | null): string {
  const fallback = "/admin";
  if (!raw) return fallback;
  let path: string;
  try {
    path = decodeURIComponent(raw.trim());
  } catch {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.startsWith("/admin/login") || path.startsWith("/admin/set-password")) return fallback;
  if (path === "/cucina" || path.startsWith("/cucina/")) return path;
  if (path.startsWith("/admin")) return path;
  return fallback;
}
