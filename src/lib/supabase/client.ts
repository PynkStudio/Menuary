import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";

export function createSupabaseBrowserClient(opts?: { autoRefreshToken?: boolean }) {
  // Il cookie di sessione va scritto sullo STESSO scope di dominio usato da
  // middleware e route handler (.menuary.it / .pynkstudio.*). Senza questo,
  // signInWithPassword scriverebbe un cookie host-only (es. login.menuary.it)
  // con lo stesso nome del cookie domain-scoped: i due, una volta "chunked",
  // si fondono in JSON invalido → sessione persa e login bloccato su
  // "Accesso in corso…". Su domini custom tenant / localhost resta host-only.
  const domain =
    typeof window !== "undefined"
      ? resolveSessionCookieDomain(window.location.hostname)
      : undefined;

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        ...(opts ?? {}),
        experimental: { passkey: true },
      },
      ...(domain ? { cookieOptions: { domain } } : {}),
    },
  );
}

/**
 * Cancella i cookie di sessione Supabase (`sb-*-auth-token` e relativi chunk)
 * su tutti gli scope plausibili: host-only e dominio condiviso (.menuary.it /
 * .pynkstudio.*). Serve a bonificare i browser che hanno ancora il vecchio
 * cookie host-only duplicato — origine della disconnessione e del blocco su
 * "Accesso in corso…". Va chiamata prima di un nuovo login.
 */
export function purgeSupabaseAuthCookies() {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  const shared = resolveSessionCookieDomain(host);
  const domains = [undefined, host, `.${host}`, shared].filter(
    (d, i, arr) => arr.indexOf(d) === i,
  );
  const names = document.cookie
    .split("; ")
    .map((c) => c.split("=")[0])
    .filter((n) => n.startsWith("sb-") && n.includes("-auth-token"));
  for (const name of names) {
    for (const domain of domains) {
      document.cookie =
        `${name}=; path=/; max-age=0; samesite=lax` +
        (domain ? `; domain=${domain}` : "");
    }
  }
}
