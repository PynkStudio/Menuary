import { NextRequest, NextResponse } from "next/server";
import { CLIENTS_PUBLIC_ORIGIN } from "@/lib/clients-config";

function sameOriginReturnTo(
  raw: string | null,
  origin: string,
  fallback: string,
): string {
  if (!raw) return fallback;
  try {
    const u = new URL(raw);
    return u.origin === origin ? u.toString() : fallback;
  } catch {
    if (raw.startsWith("/") && !raw.startsWith("//")) {
      return `${origin}${raw}`;
    }
    return fallback;
  }
}

/**
 * Avvio login centralizzato: redirect al portale clienti con URL di ritorno sul tenant.
 */
export function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fallback = `${origin}/menu`;
  const fromQuery = req.nextUrl.searchParams.get("return_to");
  const fromReferer = req.headers.get("referer");
  const returnTo = sameOriginReturnTo(fromQuery ?? fromReferer, origin, fallback);

  const dest = new URL("/login", CLIENTS_PUBLIC_ORIGIN);
  dest.searchParams.set("return_to", returnTo);

  return NextResponse.redirect(dest);
}
