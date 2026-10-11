import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isBetaToken, setBetaCookie } from "@/lib/pynkstudio/beta";
import { isPynkstudioRequest } from "@/components/tenants/pynkstudio/resolve-tenant";

export const dynamic = "force-dynamic";

/** Link magico delle email: conferma l'indirizzo, apre la sessione tester e porta all'area beta. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = new URL(request.url);
  if (!isPynkstudioRequest(request.headers.get("x-preview-tenant-id"), request.headers.get("host"))) {
    return new NextResponse("Not found", { status: 404 });
  }
  const svc = createSupabaseServiceClient();
  if (!svc || !isBetaToken(token)) return NextResponse.redirect(new URL("/beta?link=scaduto", url.origin));

  const { data: tester } = await svc.from("pynkstudio_beta_testers").select("id, email_verified_at").eq("access_token", token).maybeSingle();
  if (!tester) return NextResponse.redirect(new URL("/beta?link=scaduto", url.origin));

  const now = new Date().toISOString();
  await svc
    .from("pynkstudio_beta_testers")
    .update({ email_verified_at: tester.email_verified_at ?? now, last_seen_at: now })
    .eq("id", tester.id);

  const res = NextResponse.redirect(new URL("/beta", url.origin));
  setBetaCookie(res, token);
  return res;
}
