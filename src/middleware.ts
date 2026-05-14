import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPlatformModeFromHost } from "@/lib/platform";

/** Portale consumatori B2C */
const CLIENTS_PATHS = new Set(["/", "/login", "/profilo", "/consensi", "/ristoranti", "/ordini"]);

/** Portale fatturazione / abbonamenti B2B per i locali */
const STUDIO_PATHS = new Set(["/", "/fatturazione", "/pagamenti", "/recesso"]);

function allowStaticAssets(pathname: string) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  const mode = getPlatformModeFromHost(host);
  const { pathname } = request.nextUrl;

  if (allowStaticAssets(pathname)) {
    return NextResponse.next();
  }

  if (mode === "platform-admin") {
    // admin.menuary.it/* → /admin/*
    if (!pathname.startsWith("/admin")) {
      const rewritten = request.nextUrl.clone();
      rewritten.pathname = "/admin" + (pathname === "/" ? "" : pathname);
      return NextResponse.rewrite(rewritten);
    }
    return NextResponse.next();
  }

  if (mode === "clients") {
    if (CLIENTS_PATHS.has(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (mode === "studio") {
    if (STUDIO_PATHS.has(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
