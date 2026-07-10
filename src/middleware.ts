import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  canAccessAdminPath,
  getDefaultAdminPath,
  hasAdminPermission,
  isSiteadminRole,
  type SiteadminRole,
} from "@/lib/admin-permissions";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHost, type PlatformMode } from "@/lib/platform";
import { findTenantById, findTenantByPreviewSlug } from "@/lib/tenant-registry";
import {
  resolveLocationSlugFromHost,
  resolveTenantFromHost,
  resolveTenantFromManagementHost,
  resolveTenantFromPrefixedHost,
  resolveTenantFromPreviewSlug,
} from "@/lib/tenant-runtime";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import {
  SUPPORTED_LOCALES,
  LOCALE_HEADER,
  LOCALE_COOKIE,
  DEFAULT_LOCALE,
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
import {
  detectTenantLocaleFromAcceptLanguage,
  getTenantLocaleConfig,
  matchTenantLocale,
  tenantLocaleCookieName,
  type TenantLocaleConfig,
} from "@/lib/tenant-locales";
import {
  MARKETING_ROUTE_KEYS,
  localizedSlug,
  resolveLocalizedSegment,
  type MarketingRouteKey,
} from "@/lib/marketing-slugs";
import { isRouteModuleAllowed } from "@/lib/tenant-route-modules";

const LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);
const TENANT_LOCALE_REWRITE_HEADER = "x-tenant-locale-rewrite";

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

const CRAWLER_UA =
  /bot|crawl|spider|slurp|mediapartners|google-inspectiontool|lighthouse|facebookexternalhit|facebot|whatsapp|telegrambot|twitterbot|linkedinbot|pinterest|applebot|yandex|baidu|duckduck|petalbot|embedly|quora|outbrain/i;

function isCrawler(request: NextRequest): boolean {
  return CRAWLER_UA.test(request.headers.get("user-agent") ?? "");
}

/**
 * Segmenti extra serviti sui siti marketing oltre alle route marketing vere e
 * proprie: sono URL raggiunti da link esterni già in circolazione (redirect
 * Stripe, setup link inviati via email, footer legale, biglietti da visita).
 */
const MENUARY_MARKETING_PASSTHROUGH = new Set([
  "payment",
  "configurazione",
  "pagamenti",
  "privacy",
  "cookie",
  "team",
]);
const BIZERY_MARKETING_PASSTHROUGH = new Set(["payment", "privacy", "cookie", "team"]);
const ORPHEO_MARKETING_PASSTHROUGH = new Set(["payment", "privacy", "cookie"]);

/**
 * 404 servito direttamente dal middleware. Il root layout renderizza le pagine
 * dentro <Suspense>, quindi un notFound() lanciato da una pagina arriva al
 * client con status 200 (soft-404): sui siti marketing i path fuori allowlist
 * (route dei tenant, junk dei crawler) devono invece rispondere 404 reale.
 */
function marketingNotFoundResponse(mode: PlatformMode): NextResponse {
  const brand =
    mode === "marketing-bizery" ? "Bizery" : mode === "marketing-orpheo" ? "Orpheo" : "Menuary";
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Pagina non trovata · ${brand}</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F5F0EA;color:#111;font-family:system-ui,-apple-system,sans-serif;text-align:center}
main{padding:40px 20px}
p.brand{font-size:12px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(0,0,0,.4);margin:0}
h1{font-size:44px;letter-spacing:-.02em;margin:16px 0 0}
p.desc{max-width:420px;color:rgba(0,0,0,.6);margin:20px auto 0}
a{display:inline-block;margin-top:32px;background:#000;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:9999px;padding:12px 24px}
</style>
</head>
<body><main>
<p class="brand">${brand}</p>
<h1>Pagina non trovata</h1>
<p class="desc">La pagina che cerchi non esiste, è stata spostata o non è più accessibile.</p>
<a href="/">Torna alla home</a>
</main></body>
</html>`;
  return new NextResponse(html, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

/**
 * Routing lingua dei siti marketing. Il path nudo (es. /chi-siamo) è la lingua
 * di default (it) e DEVE restare 200 per i crawler: è l'URL canonico/x-default.
 * Gli umani non-italiani vengono rediretti alla loro lingua; i crawler no, così
 * il canonical non punta mai a un redirect. /it/* è un duplicato del path nudo e
 * viene consolidato con un 301.
 */
function handleMarketingLocale(
  request: NextRequest,
  mode: PlatformMode,
  mapPath: (publicPath: string) => string,
  passthrough: ReadonlySet<string>,
): NextResponse {
  const { pathname } = request.nextUrl;
  const { locale, rest } = extractLocaleFromPath(pathname);

  // /it/* è un duplicato del path nudo (default = it): consolida con 301.
  if (locale === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = rest;
    return NextResponse.redirect(url, 301);
  }

  if (locale) {
    const seg = rest.replace(/^\//, "").split("/").filter(Boolean)[0] ?? "";
    if (seg === "") {
      return rewriteWithLocale(request, mapPath("/"), locale, mode);
    }
    // Slug localizzato valido (es. /de/ueber-uns) → route interna italiana.
    const key = resolveLocalizedSegment(locale, seg);
    if (key) {
      return rewriteWithLocale(request, mapPath(`/${key}`), locale, mode);
    }
    // Vecchio slug italiano sotto lingua estera (es. /de/chi-siamo) → 301 allo slug localizzato.
    if ((MARKETING_ROUTE_KEYS as readonly string[]).includes(seg)) {
      const localized = localizedSlug(seg as MarketingRouteKey, locale);
      if (localized && localized !== seg) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/${localized}`;
        return NextResponse.redirect(url, 301);
      }
    }
    if (passthrough.has(seg)) {
      return rewriteWithLocale(request, mapPath(rest), locale, mode);
    }
    return marketingNotFoundResponse(mode);
  }

  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  if (seg && !(MARKETING_ROUTE_KEYS as readonly string[]).includes(seg) && !passthrough.has(seg)) {
    return marketingNotFoundResponse(mode);
  }

  const detected = isCrawler(request) ? DEFAULT_LOCALE : detectLocaleFromRequest(request);
  if (detected === DEFAULT_LOCALE) {
    return rewriteWithLocale(request, mapPath(pathname), DEFAULT_LOCALE, mode);
  }
  return localeRedirect(request, detected, pathname);
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

/** Path interni di piattaforma che non devono essere accessibili dai siti marketing. */
function isInternalPlatformPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/gestione") ||
    pathname.startsWith("/k/") ||
    pathname === "/cucina" ||
    pathname.startsWith("/cucina/") ||
    pathname.startsWith("/admin-pynkstudio")
  );
}

function allowStaticAssets(pathname: string) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return true;
  return false;
}

type DisabledDemoAccess = {
  vertical: "food" | "services" | "creative";
  officialUrl: string | null;
};

type DemoControlRow = {
  tenant_id: string;
  vertical: string;
  enabled: boolean;
};

type DemoTenantRow = {
  enabled: boolean;
  status: string;
};

type DemoLeadRow = {
  official_domain: string | null;
  official_domain_active: boolean;
};

async function fetchDemoRuntimeRows<T>(
  table: string,
  params: Record<string, string>,
): Promise<T[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    const url = new URL(`/rest/v1/${table}`, supabaseUrl);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json() as T[];
  } catch {
    return null;
  }
}

function officialUrlFromDomain(domain: string | null | undefined): string | null {
  if (!domain) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(domain) ? domain : `https://${domain}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

async function getDisabledDemoAccess(
  previewSlug: string,
  mode: PlatformMode,
): Promise<DisabledDemoAccess | null> {
  const controls = await fetchDemoRuntimeRows<DemoControlRow>("tenant_demo_controls", {
    select: "tenant_id,vertical,enabled",
    preview_slug: `eq.${previewSlug}`,
    limit: "1",
  });
  // In caso di errore DB le sole demo falliscono chiuse: un link disattivato
  // non deve tornare pubblico per un problema transitorio di lettura.
  if (!controls) {
    return {
      vertical: mode === "preview-orpheo" ? "creative" : mode === "preview-bizery" ? "services" : "food",
      officialUrl: null,
    };
  }
  const control = controls?.[0];
  if (!control || control.enabled) return null;

  const [tenants, leads] = await Promise.all([
    fetchDemoRuntimeRows<DemoTenantRow>("tenants", {
      select: "enabled,status",
      id: `eq.${control.tenant_id}`,
      limit: "1",
    }),
    fetchDemoRuntimeRows<DemoLeadRow>("platform_leads", {
      select: "official_domain,official_domain_active",
      tenant_id: `eq.${control.tenant_id}`,
      official_domain_active: "eq.true",
      limit: "1",
    }),
  ]);
  const tenant = tenants?.[0];
  const lead = leads?.[0];
  const officialUrl =
    tenant?.enabled && tenant.status === "active" && lead?.official_domain_active
      ? officialUrlFromDomain(lead.official_domain)
      : null;

  return {
    vertical:
      control.vertical === "creative"
        ? "creative"
        : control.vertical === "services"
          ? "services"
          : "food",
    officialUrl,
  };
}

function getDemoPreviewSlug(mode: PlatformMode, pathname: string): string | null {
  if (mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo") return null;
  const slug = pathname.split("/").filter(Boolean)[0];
  return slug && slug !== "demo-offline" && slug !== "k" ? slug : null;
}

function disabledDemoResponse(
  request: NextRequest,
  previewSlug: string,
  access: DisabledDemoAccess,
): NextResponse {
  if (access.officialUrl) {
    const redirect = new URL(access.officialUrl);
    const publicPath = request.nextUrl.pathname.slice(`/${previewSlug}`.length) || "/";
    redirect.pathname =
      publicPath.startsWith("/gestione") || publicPath.startsWith("/k/")
        ? "/"
        : publicPath;
    redirect.search = request.nextUrl.search;
    return NextResponse.redirect(redirect, 307);
  }

  const rewritten = request.nextUrl.clone();
  rewritten.pathname = "/demo-offline";
  rewritten.search = "";
  rewritten.searchParams.set("vertical", access.vertical);
  const response = NextResponse.rewrite(rewritten);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function detectTenantLocaleFromRequest(
  request: NextRequest,
  tenantId: string,
  config: TenantLocaleConfig,
) {
  return (
    matchTenantLocale(request.cookies.get(tenantLocaleCookieName(tenantId))?.value, config.locales) ??
    detectTenantLocaleFromAcceptLanguage(request.headers.get("accept-language"), config)
  );
}

function tenantLocaleRedirect(
  request: NextRequest,
  tenantId: string,
  locale: string,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const response = NextResponse.redirect(url, 302);
  response.cookies.set(tenantLocaleCookieName(tenantId), locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

function tenantLocaleRewrite(
  request: NextRequest,
  tenantId: string,
  locale: string,
  pathname: string,
  mode: PlatformMode,
  previewTenantId?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  requestHeaders.set(PLATFORM_MODE_HEADER, mode);
  requestHeaders.set("x-tenant-public-path", request.nextUrl.pathname);
  requestHeaders.set(TENANT_LOCALE_REWRITE_HEADER, "1");
  if (previewTenantId) {
    requestHeaders.set("x-preview-tenant-id", previewTenantId);
  }
  const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  response.cookies.set(tenantLocaleCookieName(tenantId), locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

const PREVIEW_GLOBAL_TENANT_ROUTES = new Set([
  "assistant-menu",
  "chi-siamo",
  "contatti",
  "cookie",
  "cucina",
  "galleria",
  "ordina",
  "prenota",
  "preferiti",
  "privacy",
  "staff",
  "tavolo",
  // Route del sito PynkStudio (servite dai segmenti globali dell'app dir).
  "servizi",
  "settori",
  "lavori",
  "consulenza",
  "contattaci",
  "unsubscribe",
  "checkup-operativo",
  "per-le-aziende",
  "metodo",
  "ad",
  "ai-governance",
  "soluzioni",
  "ai-act",
  "blog",
]);

function handlePreviewTenantLocale(
  request: NextRequest,
  mode: PlatformMode,
  previewSlug: string,
  tenantId: string,
  config: TenantLocaleConfig,
) {
  const { pathname } = request.nextUrl;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== previewSlug || parts[1] === "gestione" || parts[1] === "k") return null;
  if (request.headers.get(TENANT_LOCALE_REWRITE_HEADER) === "1") return null;
  const routeLocale = matchTenantLocale(parts[1], config.locales);
  if (!routeLocale) {
    const locale = detectTenantLocaleFromRequest(request, tenantId, config);
    const rest = parts.slice(1).join("/");
    return tenantLocaleRedirect(
      request,
      tenantId,
      locale,
      `/${previewSlug}/${locale}${rest ? `/${rest}` : ""}`,
    );
  }
  const rest = parts.slice(2).join("/");
  const rewrittenPathname =
    rest && PREVIEW_GLOBAL_TENANT_ROUTES.has(rest.split("/")[0])
      ? `/${rest}`
      : `/${previewSlug}${rest ? `/${rest}` : ""}`;
  return tenantLocaleRewrite(
    request,
    tenantId,
    routeLocale,
    rewrittenPathname,
    mode,
    tenantId,
  );
}

function handleCustomTenantLocale(
  request: NextRequest,
  mode: PlatformMode,
  tenantId: string,
  config: TenantLocaleConfig,
) {
  const { pathname } = request.nextUrl;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "gestione" || parts[0] === "k") return null;
  const routeLocale = matchTenantLocale(parts[0], config.locales);
  if (!routeLocale) {
    const locale = detectTenantLocaleFromRequest(request, tenantId, config);
    return tenantLocaleRedirect(
      request,
      tenantId,
      locale,
      `/${locale}${pathname === "/" ? "" : pathname}`,
    );
  }
  const rest = parts.slice(1).join("/");
  return tenantLocaleRewrite(request, tenantId, routeLocale, rest ? `/${rest}` : "/", mode);
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

/**
 * Segmento URL del "modulo" richiesto per una route preview (/[previewSlug]/…),
 * saltando l'eventuale prefisso di lingua del tenant.
 */
function moduleSegmentAfterPreviewSlug(pathname: string, locales?: readonly string[]): string {
  const parts = pathname.split("/").filter(Boolean).slice(1);
  if (locales && parts[0] && (locales as string[]).includes(parts[0])) return parts[1] ?? "";
  return parts[0] ?? "";
}

/**
 * Segmento URL del "modulo" richiesto su dominio custom del tenant, saltando
 * l'eventuale prefisso di lingua del tenant.
 */
function moduleSegmentForTenantHost(pathname: string, locales?: readonly string[]): string {
  const parts = pathname.split("/").filter(Boolean);
  if (locales && parts[0] && (locales as string[]).includes(parts[0])) return parts[1] ?? "";
  return parts[0] ?? "";
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
  const pathPreviewSlug = pathname.split("/").filter(Boolean)[0];
  const pathPreviewTenant = pathPreviewSlug ? findTenantByPreviewSlug(pathPreviewSlug) : undefined;

  if (allowStaticAssets(pathname)) return NextResponse.next();

  const demoPreviewSlug = getDemoPreviewSlug(mode, pathname);
  if (demoPreviewSlug) {
    const disabledDemo = await getDisabledDemoAccess(demoPreviewSlug, mode);
    if (disabledDemo) return disabledDemoResponse(request, demoPreviewSlug, disabledDemo);
  }

  if (pathPreviewTenant) {
    const localeConfig = getTenantLocaleConfig(pathPreviewTenant.id);
    if (
      (mode === "preview" || mode === "preview-bizery" || mode === "preview-orpheo") &&
      !isRouteModuleAllowed(
        moduleSegmentAfterPreviewSlug(pathname, localeConfig?.locales),
        pathPreviewTenant.features,
      )
    ) {
      return NextResponse.redirect(new URL(`/${pathPreviewTenant.previewSlug}`, request.url));
    }
    if (localeConfig) {
      const localizedPreview = handlePreviewTenantLocale(
        request,
        mode,
        pathPreviewTenant.previewSlug!,
        pathPreviewTenant.id,
        localeConfig,
      );
      if (localizedPreview) return localizedPreview;
    }
  }

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

  // ── Admin PynkStudio (admin.pynkstudio.it) ────────────────────────────────
  if (mode === "admin-pynkstudio") {
    const effectivePath = pathname.startsWith("/admin-pynkstudio")
      ? pathname
      : "/admin-pynkstudio" + (pathname === "/" ? "" : pathname);

    const PUBLIC_PYNK = new Set(["/admin-pynkstudio/login", "/admin-pynkstudio/set-password"]);
    if (!PUBLIC_PYNK.has(effectivePath)) {
      let response: NextResponse;
      if (!pathname.startsWith("/admin-pynkstudio")) {
        const rewritten = request.nextUrl.clone();
        rewritten.pathname = effectivePath;
        response = NextResponse.rewrite(rewritten);
      } else {
        response = NextResponse.next({ request });
      }
      const { user, role } = await getSessionUserAndSiteadminRole(request, response, cookieDomain);
      if (!user) {
        const next = pathname.replace(/^\/admin-pynkstudio/, "") || "/";
        const fallback = new URL("/admin-pynkstudio/login", request.url);
        fallback.searchParams.set("next", next);
        return NextResponse.redirect(fallback);
      }
      if (!role) {
        return NextResponse.redirect(new URL("/admin-pynkstudio/login", request.url));
      }
      if ((effectivePath.replace(/\/+$/, "") || "/admin-pynkstudio") === "/admin-pynkstudio") {
        return NextResponse.redirect(new URL("/admin-pynkstudio/inbox", request.url));
      }
      return response;
    }

    if (!pathname.startsWith("/admin-pynkstudio")) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = effectivePath;
      return NextResponse.rewrite(rewritten);
    }
    return NextResponse.next();
  }

  // ── Pagamenti PynkStudio (pagamenti.pynkstudio.it) ────────────────────────
  if (mode === "pagamenti-pynkstudio") {
    if (!pathname.startsWith("/pagamenti-pynkstudio")) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = "/pagamenti-pynkstudio" + (pathname === "/" ? "" : pathname);
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

  // ── Support portal (support.menuary.it) ─────────────────────────────────
  if (mode === "support") {
    const effectivePath = pathname.startsWith("/support")
      ? pathname
      : "/support" + (pathname === "/" ? "" : pathname);

    let response: NextResponse;
    if (!pathname.startsWith("/support")) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = effectivePath;
      response = NextResponse.rewrite(rewritten);
    } else {
      response = NextResponse.next({ request });
    }
    const { user, role } = await getSessionUserAndSiteadminRole(request, response, cookieDomain);
    if (!user) {
      return loginRedirect(request, "support", pathname);
    }
    if (!hasAdminPermission(role, "errors:view")) {
      return NextResponse.redirect(new URL("https://admin.menuary.it/admin", request.url));
    }
    if ((effectivePath.replace(/\/+$/, "") || "/support") === "/support") {
      return response;
    }
    return response;
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

  // ── App rider tenant (rider.[dominio]) ───────────────────────────────────
  // Nessuna sessione Supabase richiesta: auth con access_code (cookie rider-session).
  if (mode === "rider-custom") {
    const tenant = resolveTenantFromPrefixedHost(host, "rider");
    if (!tenant) return NextResponse.next();
    const rewrittenPath = `/operativo/${tenant.id}/rider${pathname === "/" ? "" : pathname}`;
    if (!pathname.startsWith(`/operativo/${tenant.id}/rider`)) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = rewrittenPath;
      const rh = new Headers(request.headers);
      rh.set("x-operational-portal", "rider");
      rh.set("x-tenant-public-path", pathname);
      return NextResponse.rewrite(rewritten, { request: { headers: rh } });
    }
    return NextResponse.next();
  }

  // ── Portali operativi tenant (ordini/cassa/kiosk/cucina.[dominio]) ───────
  if (mode === "ordini-custom" || mode === "cassa-custom" || mode === "kiosk-custom" || mode === "cucina-custom") {
    const section =
      mode === "ordini-custom"
        ? "ordini"
        : mode === "cassa-custom"
          ? "cassa"
          : mode === "kiosk-custom"
            ? "kiosk"
            : "cucina";
    const tenant = resolveTenantFromPrefixedHost(host, section);
    if (!tenant) return NextResponse.next();

    const rewrittenPath = `/operativo/${tenant.id}/${section}${pathname === "/" ? "" : pathname}`;
    if (!pathname.startsWith(`/operativo/${tenant.id}/${section}`)) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = rewrittenPath;
      const rh = new Headers(request.headers);
      rh.set("x-operational-portal", section);
      rh.set("x-tenant-public-path", pathname);

      if (section !== "kiosk") {
        const response = NextResponse.rewrite(rewritten, { request: { headers: rh } });
        const user = await getSessionUser(request, response, cookieDomain);
        if (!user) {
          return loginRedirect(request, `${section}.${tenant.id}`, pathname || "/");
        }
        return response;
      }

      return NextResponse.rewrite(rewritten, { request: { headers: rh } });
    }
    return NextResponse.next();
  }

  // ── Demo gestione (demo.menuary.it/[tenant]/gestione) ────────────────────
  if (mode === "preview" || mode === "preview-bizery" || mode === "preview-orpheo") {
    const match = pathname.match(/^\/([a-z0-9-]+)\/gestione(\/.*)?$/);
    if (match) {
      const tenant = findTenantById(match[1]) ?? resolveTenantFromPreviewSlug(match[1]);
      if (!tenant) return NextResponse.next();
      const rest = match[2] ?? "";
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = `/gestione/${tenant.id}${rest}`;
      const rh = new Headers(request.headers);
      rh.set("x-preview-tenant-id", tenant.id);
      rh.set("x-tenant-public-path", pathname);
      return NextResponse.rewrite(rewritten, { request: { headers: rh } });
    }
    // Demo portali operativi: demo.menuary.it/[slug]/ordini|cassa|kiosk.
    const operationalMatch = pathname.match(/^\/([a-z0-9-]+)\/(ordini|cassa|kiosk)(\/.*)?$/);
    if (operationalMatch) {
      const tenant = findTenantById(operationalMatch[1]) ?? resolveTenantFromPreviewSlug(operationalMatch[1]);
      if (!tenant) return NextResponse.next();
      const section = operationalMatch[2];
      const rest = operationalMatch[3] ?? "";
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = `/operativo/${tenant.id}/${section}${rest}`;
      const rh = new Headers(request.headers);
      rh.set("x-preview-tenant-id", tenant.id);
      rh.set("x-operational-portal", section);
      rh.set("x-tenant-public-path", pathname);
      return NextResponse.rewrite(rewritten, { request: { headers: rh } });
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
    if (pathname === "/app" || pathname.startsWith("/app/")) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(PLATFORM_MODE_HEADER, "app");
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    if (isInternalPlatformPath(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Short-link di piattaforma: non soggetto a locale redirect.
    // Senza questo bypass i browser non-italiani verrebbero rediretti su /en/c/<token> → 404.
    if (pathname.startsWith("/c/")) return NextResponse.next();
    return handleMarketingLocale(request, mode, (p) => p, MENUARY_MARKETING_PASSTHROUGH);
  }

  // ── App download (app.menuary.it) ─────────────────────────────────────────
  if (mode === "app") {
    return NextResponse.next();
  }

  // ── Marketing Bizery (bizery.it) ─────────────────────────────────────────
  if (mode === "marketing-bizery") {
    if (isInternalPlatformPath(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return handleMarketingLocale(
      request,
      mode,
      (p) => "/bizery" + (p === "/" ? "" : p),
      BIZERY_MARKETING_PASSTHROUGH,
    );
  }

  // ── Marketing Orpheo (weuseorpheo.com) ───────────────────────────────────
  if (mode === "marketing-orpheo") {
    if (isInternalPlatformPath(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return handleMarketingLocale(
      request,
      mode,
      (p) => "/orpheo" + (p === "/" ? "" : p),
      ORPHEO_MARKETING_PASSTHROUGH,
    );
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
  // (es. sede.example.it) e propaga lo slug come header x-location-slug
  // in modo che layout e pagine possano usarlo senza un'ulteriore query.
  // Funziona sia in mode "tenant" che in qualsiasi altra mode per i domini
  // custom con location subdomain.
  const tenant = resolveTenantFromHost(host);
  if (!tenant) {
    const requestHeaders = new Headers(request.headers);
    if (pathPreviewTenant) {
      requestHeaders.set("x-preview-tenant-id", pathPreviewTenant.id);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  const tenantLocaleConfig = getTenantLocaleConfig(tenant.id);
  if (
    mode === "tenant" &&
    !isRouteModuleAllowed(moduleSegmentForTenantHost(pathname, tenantLocaleConfig?.locales), tenant.features)
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (mode === "tenant" && tenantLocaleConfig) {
    const localizedTenant = handleCustomTenantLocale(request, mode, tenant.id, tenantLocaleConfig);
    if (localizedTenant) return localizedTenant;
  }
  const locationSlug = resolveLocationSlugFromHost(host, tenant.domains);
  const requestHeaders = new Headers(request.headers);
  if (pathPreviewTenant) {
    requestHeaders.set("x-preview-tenant-id", pathPreviewTenant.id);
  }
  if (locationSlug) {
    requestHeaders.set("x-location-slug", locationSlug);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-location-slug", locationSlug);
    return response;
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
