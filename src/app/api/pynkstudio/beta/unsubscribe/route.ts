import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isBetaToken } from "@/lib/pynkstudio/beta";

export const dynamic = "force-dynamic";

async function disableAlerts(token: string | null) {
  const svc = createSupabaseServiceClient();
  if (!svc || !isBetaToken(token)) return;
  await svc
    .from("pynkstudio_beta_testers")
    .update({ notify_enabled: false, updated_at: new Date().toISOString() })
    .eq("access_token", token);
}

/** Link "non voglio più avvisi" delle email: spegne le notifiche senza chiedere il login. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  await disableAlerts(url.searchParams.get("t"));
  return NextResponse.redirect(new URL("/beta?avvisi=off", url.origin));
}

/** Disiscrizione in un clic dal client di posta (header List-Unsubscribe-Post): niente redirect. */
export async function POST(request: Request) {
  await disableAlerts(new URL(request.url).searchParams.get("t"));
  return new NextResponse(null, { status: 200 });
}
