import { NextResponse } from "next/server";
import { isPynkstudioRequest } from "@/components/tenants/pynkstudio/resolve-tenant";
import { getAgenda, pynkGuestCookieName } from "@/lib/agenda-runtime";

export const dynamic = "force-dynamic";

// Porta d'ingresso del link inviato per email. Il token non deve restare
// nell'URL della pagina: con il consenso, GA4/Meta/OpenAI registrano l'URL
// completo. Lo spostiamo in un cookie httpOnly e reindirizziamo all'URL pulito.
export async function GET(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const url = new URL(request.url);
  if (!isPynkstudioRequest(request.headers.get("x-preview-tenant-id"), request.headers.get("host"))) {
    return new NextResponse("Not found", { status: 404 });
  }
  const token = url.searchParams.get("t") ?? "";
  const target = new URL(`/it/videocall/${encodeURIComponent(bookingId)}`, url);
  const response = NextResponse.redirect(target, 303);
  response.headers.set("Referrer-Policy", "no-referrer");
  if (token && getAgenda().verifyManageToken(bookingId, token)) {
    response.cookies.set(pynkGuestCookieName(bookingId), token, {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}
