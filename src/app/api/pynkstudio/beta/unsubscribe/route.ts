import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isBetaToken } from "@/lib/pynkstudio/beta";

export const dynamic = "force-dynamic";

/** Link "non voglio più avvisi" delle email: spegne le notifiche senza chiedere il login. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  const svc = createSupabaseServiceClient();
  if (svc && isBetaToken(token)) {
    await svc
      .from("pynkstudio_beta_testers")
      .update({ notify_enabled: false, updated_at: new Date().toISOString() })
      .eq("access_token", token);
  }
  return NextResponse.redirect(new URL("/beta?avvisi=off", url.origin));
}
