import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getBetaTester } from "@/lib/pynkstudio/beta";
import { BETA_WEB_DEVICE, betaMethodInfo, cleanBetaChannels } from "@/lib/pynkstudio/beta-shared";

export const dynamic = "force-dynamic";

/**
 * Registra che il tester ha aperto i link per unirsi a una beta senza approvazione.
 * Vale come partecipazione (richiesta già approvata): abilita i feedback e la conta in admin.
 */
export async function POST(request: Request) {
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const tester = await getBetaTester(svc);
  if (!tester) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let betaId = "";
  let device = "";
  try {
    const body = (await request.json()) as { betaId?: unknown; device?: unknown };
    betaId = typeof body.betaId === "string" ? body.betaId : "";
    device = typeof body.device === "string" ? body.device : "";
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { data: beta } = await svc.from("pynkstudio_betas").select("id, status, channels").eq("id", betaId).maybeSingle();
  if (!beta || beta.status !== "open") return NextResponse.json({ error: "beta_not_open" }, { status: 409 });
  const channel = cleanBetaChannels(beta.channels).find((c) => c.device === device);
  if (!channel || (device !== BETA_WEB_DEVICE && !tester.devices.includes(device))) {
    return NextResponse.json({ error: "device_not_supported" }, { status: 400 });
  }
  const method = betaMethodInfo(channel.method);
  if (method.needsApproval) return NextResponse.json({ error: "approval_required" }, { status: 400 });

  const accountEmail =
    method.account === "apple" ? tester.apple_id_email ?? tester.email
    : method.account === "google" ? tester.google_account_email ?? tester.email
    : tester.email;
  const { error } = await svc
    .from("pynkstudio_beta_requests")
    .upsert(
      { beta_id: beta.id, tester_id: tester.id, device, method: channel.method, account_email: accountEmail, status: "approved" },
      { onConflict: "beta_id,tester_id,device", ignoreDuplicates: true },
    );
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
