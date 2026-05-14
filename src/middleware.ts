import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPlatformModeFromHost } from "@/lib/platform";

/** Portale clienti B2C — path pubblici */
const CLIENTS_PATHS = new Set([
  "/", "/login", "/registrati", "/recupera-password",
  "/profilo", "/consensi", "/ristoranti", "/ordini", "/impostazioni",
]);
const CLIENTS_PRIVATE_PATHS = new Set([
  "/profilo", "/consensi", "/ristoranti", "/ordini", "/impostazioni",
]);

/** Portale fatturazione B2B */
const STUDIO_PATHS = new Set(["/", "/fatturazione", "/pagamenti", "/recesso"]);

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

function resolveSessionCookieDomain(host: string | null): string | undefined {
  if (!host) return undefined;
  const h = host.split(":")[0].toLowerCase();
  // Sottodomini Menuary: cookie condiviso su .menuary.it
  if (h === "menuary.it" || h.endsWith(".menuary.it")) return ".menuary.it";
  // Domini custom (bepork.it, ecc.): nessun domain override
  return undefined;
}

async function getSessionUser(
  request: NextRequest,
  response: NextResponse,
  cookieDomain?: string,
) {
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
      const user = await getSessionUser(request, response, cookieDomain);
      if (!user) {
        return loginRedirect(request, "admin", pathname.replace(/^\/admin/, "") || "/");
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

  // ── Studio (studio.menuary.it) ────────────────────────────────────────────
  if (mode === "studio") {
    if (!STUDIO_PATHS.has(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
