import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPlatformModeFromHost } from "@/lib/platform";

/** Percorsi accessibili nel portale clienti (B2C) */
const CLIENTS_PATHS = new Set([
  "/",
  "/login",
  "/registrati",
  "/recupera-password",
  "/profilo",
  "/consensi",
  "/ristoranti",
  "/ordini",
]);

/** Percorsi del portale clienti che richiedono sessione autenticata */
const CLIENTS_PRIVATE_PATHS = new Set(["/profilo", "/consensi", "/ristoranti", "/ordini"]);

/** Portale fatturazione / abbonamenti B2B per i locali */
const STUDIO_PATHS = new Set(["/", "/fatturazione", "/pagamenti", "/recesso"]);

/** Percorsi admin accessibili senza sessione */
const ADMIN_PUBLIC_PATHS = new Set(["/admin/login", "/admin/set-password"]);

function allowStaticAssets(pathname: string) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return true;
  return false;
}

async function getSessionUser(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const mode = getPlatformModeFromHost(host);
  const { pathname } = request.nextUrl;

  if (allowStaticAssets(pathname)) return NextResponse.next();

  if (mode === "platform-admin") {
    const effectivePath = pathname.startsWith("/admin")
      ? pathname
      : "/admin" + (pathname === "/" ? "" : pathname);

    const isPublic = ADMIN_PUBLIC_PATHS.has(effectivePath);

    if (!isPublic) {
      // Costruisce la risposta finale (rewrite se il path non parte già con /admin)
      let response: NextResponse;
      if (!pathname.startsWith("/admin")) {
        const rewritten = request.nextUrl.clone();
        rewritten.pathname = effectivePath;
        response = NextResponse.rewrite(rewritten);
      } else {
        response = NextResponse.next({ request });
      }

      const user = await getSessionUser(request, response);
      if (!user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        return NextResponse.redirect(loginUrl);
      }

      return response;
    }

    // Percorso pubblico (login, set-password) — rewrite se necessario
    if (!pathname.startsWith("/admin")) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = effectivePath;
      return NextResponse.rewrite(rewritten);
    }
    return NextResponse.next();
  }

  if (mode === "clients") {
    if (!CLIENTS_PATHS.has(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (CLIENTS_PRIVATE_PATHS.has(pathname)) {
      const response = NextResponse.next({ request });
      const user = await getSessionUser(request, response);
      if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return response;
    }

    return NextResponse.next();
  }

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
