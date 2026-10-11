import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { clearBetaCookie, getBetaTester, toPublicBeta, type BetaTesterRow } from "@/lib/pynkstudio/beta";
import {
  BETA_CATEGORIES,
  BETA_KINDS,
  BETA_LANGUAGES,
  cleanBetaChannels,
  cleanBetaDevices,
  cleanFromList,
  isValidEmail,
} from "@/lib/pynkstudio/beta-shared";

export const dynamic = "force-dynamic";

function publicTester(t: BetaTesterRow) {
  const { access_token: _token, ...rest } = t;
  return rest;
}

/** Beta aperte (con i link solo per chi ha un profilo) + profilo e richieste del tester. */
export async function GET() {
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  const tester = await getBetaTester(svc);
  const [{ data: betas }, requests] = await Promise.all([
    svc
      .from("pynkstudio_betas")
      .select("*")
      .in("status", ["open", "full"])
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(200),
    tester
      ? svc.from("pynkstudio_beta_requests").select("id, beta_id, device, status, created_at").eq("tester_id", tester.id)
      : Promise.resolve({ data: [] }),
  ]);

  const approved = new Set((requests.data ?? []).filter((r) => r.status === "approved").map((r) => `${r.beta_id}:${r.device}`));
  const list = (betas ?? []).map((b) => {
    const pub = toPublicBeta(b, !!tester);
    if (!tester) return pub;
    // I link dei canali su approvazione si sbloccano solo per le richieste approvate.
    const raw = cleanBetaChannels(b.channels);
    return {
      ...pub,
      channels: pub.channels.map((c, i) => (approved.has(`${b.id}:${c.device}`) ? raw[i] : c)),
    };
  });

  if (tester) {
    await svc.from("pynkstudio_beta_testers").update({ last_seen_at: new Date().toISOString() }).eq("id", tester.id);
  }
  return NextResponse.json({
    tester: tester ? publicTester(tester) : null,
    betas: list,
    requests: requests.data ?? [],
  });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

export async function PATCH(request: Request) {
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

  const patch: Record<string, unknown> = {};
  const firstName = str(body.firstName, 80);
  const lastName = str(body.lastName, 80);
  const phone = str(body.phone, 40);
  if (firstName !== undefined) {
    if (!firstName) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    patch.first_name = firstName;
  }
  if (lastName !== undefined) {
    if (!lastName) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    patch.last_name = lastName;
  }
  if (phone !== undefined) {
    if (phone.replace(/\D/g, "").length < 6) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    patch.phone = phone;
  }
  for (const [key, col] of [["appleIdEmail", "apple_id_email"], ["googleAccountEmail", "google_account_email"]] as const) {
    const v = str(body[key], 200);
    if (v === undefined) continue;
    if (v && !isValidEmail(v)) return NextResponse.json({ error: "invalid_account_email" }, { status: 400 });
    patch[col] = v ? v.toLowerCase() : null;
  }
  if (body.devices !== undefined) {
    const devices = cleanBetaDevices(body.devices);
    if (devices.length === 0) return NextResponse.json({ error: "no_devices" }, { status: 400 });
    patch.devices = devices;
  }
  if (typeof body.notifyEnabled === "boolean") patch.notify_enabled = body.notifyEnabled;
  if (body.notifyCategories !== undefined) patch.notify_categories = cleanFromList(body.notifyCategories, BETA_CATEGORIES);
  if (body.notifyLanguages !== undefined) patch.notify_languages = cleanFromList(body.notifyLanguages, BETA_LANGUAGES);
  if (body.notifyKinds !== undefined) patch.notify_kinds = cleanFromList(body.notifyKinds, BETA_KINDS);

  const { data, error } = await svc
    .from("pynkstudio_beta_testers")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", tester.id)
    .select("*")
    .single();
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ tester: publicTester(data) });
}

/** Cancellazione del profilo (diritto all'oblio): richieste e log notifiche vanno in cascata. */
export async function DELETE() {
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const tester = await getBetaTester(svc);
  if (!tester) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { error } = await svc.from("pynkstudio_beta_testers").delete().eq("id", tester.id);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  const res = NextResponse.json({ ok: true });
  clearBetaCookie(res);
  return res;
}
