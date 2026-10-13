import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendWebPush } from "@/lib/push/send";
import { getBetaTester } from "@/lib/pynkstudio/beta";
import { BETA_FEEDBACK_KINDS, betaDeviceLabel, betaFeedbackKindLabel } from "@/lib/pynkstudio/beta-shared";

export const dynamic = "force-dynamic";

const MAX_MESSAGE = 5000;

/** Feedback su una beta a cui il tester partecipa (richiesta approvata o link aperti). */
export async function POST(request: Request) {
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const tester = await getBetaTester(svc);
  if (!tester) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const betaId = typeof body.betaId === "string" ? body.betaId : "";
  const device = typeof body.device === "string" ? body.device : "";
  const kind = typeof body.kind === "string" ? body.kind : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE) : "";
  const appVersion = typeof body.appVersion === "string" ? body.appVersion.trim().slice(0, 40) : "";

  if (!BETA_FEEDBACK_KINDS.some((k) => k.id === kind)) return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  if (message.length < 3) return NextResponse.json({ error: "message_required" }, { status: 400 });

  const { data: joined } = await svc
    .from("pynkstudio_beta_requests")
    .select("device")
    .eq("beta_id", betaId)
    .eq("tester_id", tester.id)
    .eq("status", "approved");
  const devices = (joined ?? []).map((r) => r.device);
  if (devices.length === 0) return NextResponse.json({ error: "not_joined" }, { status: 403 });
  if (!devices.includes(device)) return NextResponse.json({ error: "invalid_device" }, { status: 400 });

  const { data: beta } = await svc.from("pynkstudio_betas").select("name, version").eq("id", betaId).maybeSingle();
  if (!beta) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data, error } = await svc
    .from("pynkstudio_beta_feedback")
    .insert({
      beta_id: betaId,
      tester_id: tester.id,
      device,
      kind,
      message,
      app_version: appVersion || beta.version,
    })
    .select("id, beta_id, device, kind, message, app_version, status, created_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });

  try {
    await sendWebPush("pynkstudio", {
      title: `${betaFeedbackKindLabel(kind)} · ${beta.name}`,
      body: `${tester.first_name} ${tester.last_name} (${betaDeviceLabel(device)}): ${message.slice(0, 120)}`,
      url: "/admin-pynkstudio/beta",
      tag: `beta-feedback-${data.id}`,
    });
  } catch (e) {
    console.warn("[beta] push admin fallita:", e);
  }
  return NextResponse.json({ feedback: data }, { status: 201 });
}
