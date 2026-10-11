import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendWebPush } from "@/lib/push/send";
import { getBetaTester } from "@/lib/pynkstudio/beta";
import { betaDeviceLabel, betaMethodInfo, cleanBetaChannels } from "@/lib/pynkstudio/beta-shared";

export const dynamic = "force-dynamic";

/** Richiesta d'accesso per i canali su invito (TestFlight via email, Google Play test chiuso). */
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

  const { data: beta } = await svc.from("pynkstudio_betas").select("*").eq("id", betaId).maybeSingle();
  if (!beta || beta.status !== "open") return NextResponse.json({ error: "beta_not_open" }, { status: 409 });
  const channel = cleanBetaChannels(beta.channels).find((c) => c.device === device);
  if (!channel || !tester.devices.includes(device)) return NextResponse.json({ error: "device_not_supported" }, { status: 400 });

  const method = betaMethodInfo(channel.method);
  if (!method.needsApproval) return NextResponse.json({ error: "no_approval_needed" }, { status: 400 });
  const accountEmail =
    method.account === "apple" ? tester.apple_id_email ?? tester.email
    : method.account === "google" ? tester.google_account_email ?? tester.email
    : tester.email;

  const { data, error } = await svc
    .from("pynkstudio_beta_requests")
    .upsert(
      { beta_id: beta.id, tester_id: tester.id, device, method: channel.method, account_email: accountEmail },
      { onConflict: "beta_id,tester_id,device", ignoreDuplicates: true },
    )
    .select("id, beta_id, device, status, created_at")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  if (data) {
    try {
      await sendWebPush("pynkstudio", {
        title: `Richiesta beta: ${beta.name}`,
        body: `${tester.first_name} ${tester.last_name} · ${betaDeviceLabel(device)} · ${accountEmail}`,
        url: "/admin-pynkstudio/beta",
        tag: `beta-request-${data.id}`,
      });
    } catch (e) {
      console.warn("[beta] push admin fallita:", e);
    }
  }
  const { data: current } = await svc
    .from("pynkstudio_beta_requests")
    .select("id, beta_id, device, status, created_at")
    .eq("beta_id", beta.id)
    .eq("tester_id", tester.id)
    .eq("device", device)
    .single();
  return NextResponse.json({ request: current });
}
