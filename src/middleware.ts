import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  canAccessAdminPath,
  getDefaultAdminPath,
  isSiteadminRole,
  type SiteadminRole,
} from "@/lib/admin-permissions";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHost, type PlatformMode } from "@/lib/platform";
import { findTenantById } from "@/lib/tenant-registry";
import {
  resolveLocationSlugFromHost,
  resolveTenantFromHost,
  resolveTenantFromManagementHost,
  resolveTenantFromPreviewSlug,
} from "@/lib/tenant-runtime";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import {
  SUPPORTED_LOCALES,
  LOCALE_HEADER,
  LOCALE_COOKIE,
  isAppLocale,
  detectLocaleFromAcceptLanguage,
  type AppLocale,
} from "@/i18n/locales";
import {
  DEFAULT_MARKET,
  MARKET_COOKIE,
  MARKET_HEADER,
  localeForMarket,
  marketForLocale,
  normalizeMarketCode,
} from "@/lib/markets";

const LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

function extractLocaleFromPath(pathname: string): { locale: AppLocale | null; rest: string } {
  const match = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (match && LOCALE_SET.has(match[1])) {
    return { locale: match[1] as AppLocale, rest: match[2] ?? "/" };
  }
  return { locale: null, rest: pathname };
}

function detectGeoMarketFromRequest(request: NextRequest) {
  return (
    normalizeMarketCode(request.headers.get("x-vercel-ip-country")) ??
    normalizeMarketCode(request.headers.get("cf-ipcountry")) ??
    normalizeMarketCode(request.headers.get("x-country-code"))
  );
}

function detectLocaleFromRequest(request: NextRequest): AppLocale {
  const manualMarket =
    normalizeMarketCode(request.nextUrl.searchParams.get("market")) ??
    normalizeMarketCode(request.nextUrl.searchParams.get("country")) ??
    normalizeMarketCode(request.cookies.get(MARKET_COOKIE)?.value) ??
    detectGeoMarketFromRequest(request);
  if (manualMarket) return localeForMarket(manualMarket);
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isAppLocale(cookie)) return cookie;
  return detectLocaleFromAcceptLanguage(request.headers.get("accept-language"));
}

function detectMarketFromRequest(request: NextRequest, locale: AppLocale) {
  return (
    normalizeMarketCode(request.nextUrl.searchParams.get("market")) ??
    normalizeMarketCode(request.nextUrl.searchParams.get("country")) ??
    normalizeMarketCode(request.cookies.get(MARKET_COOKIE)?.value) ??
    detectGeoMarketFromRequest(request) ??
    marketForLocale(locale) ??
    DEFAULT_MARKET
  );
}

function localeRedirect(request: NextRequest, locale: AppLocale, rest: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${rest === "/" ? "" : rest}`;
  const res = NextResponse.redirect(url, 302);
  res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  res.cookies.set(MARKET_COOKIE, detectMarketFromRequest(request, locale), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

function rewriteWithLocale(
  request: NextRequest,
  targetPath: string,
  locale: AppLocale,
  mode: PlatformMode,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = targetPath;
  const market = detectMarketFromRequest(request, locale);
  const res = NextResponse.rewrite(url);
  res.headers.set(LOCALE_HEADER, locale);
  res.headers.set(MARKET_HEADER, market);
  res.headers.set(PLATFORM_MODE_HEADER, mode);
  res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  res.cookies.set(MARKET_COOKIE, market, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}

/** Portale clienti B2C — path pubblici */
const CLIENTS_PATHS = new Set([
  "/", "/login", "/registrati", "/recupera-password",
  "/profilo", "/consensi", "/ristoranti", "/ordini", "/impostazioni",
]);
const CLIENTS_PRIVATE_PATHS = new Set([
  "/profilo", "/consensi", "/ristoranti", "/ordini", "/impostazioni",
]);

/** Admin — path accessibili senza sessione */
const ADMIN_PUBLIC = new Set(["/admin/login", "/admin/set-password"]);

const LOGIN_BASE = "https://login.menuary.it";

function allowStaticAssets(pathname: string) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return true;
  return false;
}

async function getSessionUser(
  request: NextRequest,
  response: NextResponse,
  cookieDomain?: string,
) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, {
                ...options,
                ...(cookieDomain !== undefined ? { domain: cookieDomain } : {}),
              }),
            );
          },
        },
      },
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

async function getSessionUserAndSiteadminRole(
  request: NextRequest,
  response: NextResponse,
  cookieDomain?: string,
): Promise<{ user: Awaited<ReturnType<typeof getSessionUser>>; role: SiteadminRole | null }> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, {
                ...options,
                ...(cookieDomain !== undefined ? { domain: cookieDomain } : {}),
              }),
            );
          },
        },
      },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, role: null };
    const { data: siteadmin } = await supabase
      .from("siteadmin")
      .select("role")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .maybeSingle();
    const role = isSiteadminRole(siteadmin?.role) ? siteadmin.role : null;
    return { user, role };
  } catch {
    return { user: null, role: null };
  }
}

/** Redirect a login.menuary.it con from + next */
function loginRedirect(
  request: NextRequest,
  from: string,
  next?: string,
): NextResponse {
  const url = new URL(LOGIN_BASE);
  url.searchParams.set("from", from);
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const mode = getPlatformModeFromHost(host);
  const { pathname } = request.nextUrl;
  const cookieDomain = resolveSessionCookieDomain(host);

  if (allowStaticAssets(pathname)) return NextResponse.next();

  // ── Login portal (login.menuary.it) ──────────────────────────────────────
  if (mode === "login") {
    if (!pathname.startsWith("/login-portal") && !pathname.startsWith("/api")) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = "/login-portal" + (pathname === "/" ? "" : pathname);
      return NextResponse.rewrite(rewritten);
    }
    return NextResponse.next();
  }

  // ── Gestione portal (gestione.menuary.it/[slug]) ──────────────────────────
  if (mode === "gestione") {
    // Estrae lo slug: /bepork/turni → slug="bepork", rest="/turni"
    const match = pathname.match(/^\/([a-z0-9-]+)(\/.*)?$/);
    const slug = match?.[1];
    const rest = match?.[2] ?? "";

    const isPublic =
      !slug ||
      pathname === "/" ||
      rest === "/login" ||
      rest === "/set-password";

    if (!isPublic) {
      let response: NextResponse;
      if (!pathname.startsWith("/gestione")) {
        const rewritten = request.nextUrl.clone();
        rewritten.pathname = "/gestione" + pathname;
        response = NextResponse.rewrite(rewritten);
      } else {
        response = NextResponse.next({ request });
      }
      const user = await getSessionUser(request, response, cookieDomain);
      if (!user) {
        return loginRedirect(
          request,
          `gestione.${slug ?? ""}`,
          rest || "/",
        );
      }
      return response;
    }

    if (!pathname.startsWith("/gestione")) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = "/gestione" + (pathname === "/" ? "" : pathname);
      return NextResponse.rewrite(rewritten);
    }
    return NextResponse.next();
  }

  // ── Platform admin (admin.menuary.it) ─────────────────────────────────────
  if (mode === "platform-admin") {
    const effectivePath = pathname.startsWith("/admin")
      ? pathname
      : "/admin" + (pathname === "/" ? "" : pathname);

    if (!ADMIN_PUBLIC.has(effectivePath)) {
      let response: NextResponse;
      if (!pathname.startsWith("/admin")) {
        const rewritten = request.nextUrl.clone();
        rewritten.pathname = effectivePath;
        response = NextResponse.rewrite(rewritten);
      } else {
        response = NextResponse.next({ request });
      }
      const { user, role } = await getSessionUserAndSiteadminRole(request, response, cookieDomain);
      if (!user) {
        const next = pathname.replace(/^\/admin/, "") || "/";
        const fallback = new URL("/admin/login", request.url);
        fallback.searchParams.set("next", next);
        return NextResponse.redirect(fallback);
      }
      if (!role) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      if ((effectivePath.replace(/\/+$/, "") || "/admin") === "/admin") {
        return NextResponse.redirect(new URL(getDefaultAdminPath(role), request.url));
      }
      if (!canAccessAdminPath(role, effectivePath)) {
        return NextResponse.redirect(new URL(getDefaultAdminPath(role), request.url));
      }
      return response;
    }

    if (!pathname.startsWith("/admin")) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = effectivePath;
      return NextResponse.rewrite(rewritten);
    }
    return NextResponse.next();
  }

  // ── Portale clienti (clienti.menuary.it) ─────────────────────────────────
  if (mode === "clients") {
    if (!CLIENTS_PATHS.has(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (CLIENTS_PRIVATE_PATHS.has(pathname)) {
      const response = NextResponse.next({ request });
      const user = await getSessionUser(request, response, cookieDomain);
      if (!user) return loginRedirect(request, "clienti", pathname);
      return response;
    }
    return NextResponse.next();
  }

  // ── Gestione Bizery (gestione.bizery.it/[slug]) ──────────────────────────
  // Auth gestita dal layout via popup (cross-domain: no redirect+cookie possibile).
  if (mode === "gestione-bizery") {
    if (!pathname.startsWith("/gestione")) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = "/gestione" + (pathname === "/" ? "" : pathname);
      return NextResponse.rewrite(rewritten);
    }
    return NextResponse.next();
  }

  // ── Gestione tenant su dominio cliente (gestione.[dominio].it) ───────────
  // Mantiene intatti i legacy gestione.menuary.it/[slug] e gestione.bizery.it/[slug],
  // ma per i domini tenant monta lo stesso gestionale senza slug pubblico.
  if (mode === "gestione-custom") {
    const tenant = resolveTenantFromManagementHost(host);
    if (!tenant) return NextResponse.next();
    if (!pathname.startsWith(`/gestione/${tenant.id}`)) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = `/gestione/${tenant.id}` + (pathname === "/" ? "" : pathname);
      return NextResponse.rewrite(rewritten);
    }
    return NextResponse.next();
  }

  // ── Demo gestione (demo.menuary.it/[tenant]/gestione) ────────────────────
  if (mode === "preview" || mode === "preview-bizery") {
    const match = pathname.match(/^\/([a-z0-9-]+)\/gestione(\/.*)?$/);
    if (match) {
      const tenant = findTenantById(match[1]) ?? resolveTenantFromPreviewSlug(match[1], host);
      const rest = match[2] ?? "";
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = `/gestione/${tenant.id}${rest}`;
      return NextResponse.rewrite(rewritten);
    }
    // Demo kiosk: demo.menuary.it/[slug]/k/[code] o anche solo /k/[code] sul demo.
    const kioskMatch = pathname.match(/^\/(?:[a-z0-9-]+\/)?k\/([A-Z0-9]+)$/i);
    if (kioskMatch) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = `/k/${kioskMatch[1].toUpperCase()}`;
      return NextResponse.rewrite(rewritten);
    }
  }

  // ── Marketing Menuary (menuary.it) ────────────────────────────────────────
  if (mode === "marketing") {
    const { locale, rest } = extractLocaleFromPath(pathname);
    if (locale) {
      return rewriteWithLocale(request, rest, locale, mode);
    }
    const detected = detectLocaleFromRequest(request);
    return localeRedirect(request, detected, pathname);
  }

  // ── Marketing Bizery (bizery.it) ─────────────────────────────────────────
  if (mode === "marketing-bizery") {
    const { locale, rest } = extractLocaleFromPath(pathname);
    if (locale) {
      const bizeryPath = "/bizery" + (rest === "/" ? "" : rest);
      return rewriteWithLocale(request, bizeryPath, locale, mode);
    }
    const detected = detectLocaleFromRequest(request);
    return localeRedirect(request, detected, pathname);
  }

  // ── Studio (deprecato) → reindirizza tutto su gestione.menuary.it ──────
  if (mode === "studio") {
    // Mappa i vecchi path studio sulle nuove sezioni di gestione
    const sectionMap: Record<string, string> = {
      "/": "/fatturazione",
      "/fatturazione": "/fatturazione",
      "/pagamenti": "/pagamenti",
      "/recesso": "/recesso",
    };
    const section = sectionMap[pathname] ?? "/fatturazione";

    // Risolve il tenant dell'utente per redirigere al suo gestione
    const response = NextResponse.next({ request });
    const user = await getSessionUser(request, response, cookieDomain);
    if (!user) {
      return loginRedirect(request, "studio", section);
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() { /* read-only */ },
        },
      },
    );

    const { data: row } = await supabase
      .from("tenantadmin")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .maybeSingle();

    if (!row?.tenant_id) {
      // prova employee
      const { data: empRow } = await supabase
        .from("employee")
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .maybeSingle();
      const tid = empRow?.tenant_id;
      if (!tid) return NextResponse.redirect(new URL("https://login.menuary.it?from=studio"));
      return NextResponse.redirect(new URL(`https://gestione.menuary.it/${tid}${section}`));
    }
    return NextResponse.redirect(
      new URL(`https://gestione.menuary.it/${row.tenant_id}${section}`),
    );
  }

  // ── Tenant site (dominio custom o sottodominio tenant) ───────────────────
  // Rileva se il host è un sottodominio di un dominio del tenant
  // (es. milano.bepork.it) e propaga lo slug come header x-location-slug
  // in modo che layout e pagine possano usarlo senza un'ulteriore query.
  // Funziona sia in mode "tenant" che in qualsiasi altra mode per i domini
  // custom con location subdomain.
  const tenant = resolveTenantFromHost(host);
  const locationSlug = resolveLocationSlugFromHost(host, tenant.domains);
  if (locationSlug) {
    const response = NextResponse.next({ request });
    response.headers.set("x-location-slug", locationSlug);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
