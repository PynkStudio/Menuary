import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendWebPush } from "@/lib/push/send";
import { betaOrigin, sendBetaAccessEmail, setBetaCookie } from "@/lib/pynkstudio/beta";
import { cleanBetaDevices, isValidEmail } from "@/lib/pynkstudio/beta-shared";

export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  // Honeypot: i bot compilano anche il campo nascosto.
  if (str(body.website, 200)) return NextResponse.json({ status: "created" });

  const firstName = str(body.firstName, 80);
  const lastName = str(body.lastName, 80);
  const email = str(body.email, 200).toLowerCase();
  const phone = str(body.phone, 40);
  const devices = cleanBetaDevices(body.devices);
  const appleId = str(body.appleIdEmail, 200).toLowerCase();
  const google = str(body.googleAccountEmail, 200).toLowerCase();

  if (!firstName || !lastName || !phone || !isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  if (phone.replace(/\D/g, "").length < 6) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  if (devices.length === 0) return NextResponse.json({ error: "no_devices" }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: "consent_required" }, { status: 400 });
  if ((appleId && !isValidEmail(appleId)) || (google && !isValidEmail(google))) {
    return NextResponse.json({ error: "invalid_account_email" }, { status: 400 });
  }

  const origin = betaOrigin(request);
  const { data: existing } = await svc.from("pynkstudio_beta_testers").select("*").eq("email", email).maybeSingle();
  if (existing) {
    // Non sovrascriviamo un profilo da un form anonimo: il proprietario riceve il suo link.
    await sendBetaAccessEmail(existing, origin, false);
    return NextResponse.json({ status: "exists" });
  }

  const { data: tester, error } = await svc
    .from("pynkstudio_beta_testers")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      devices,
      apple_id_email: appleId || null,
      google_account_email: google || null,
      notify_enabled: body.notify !== false,
      last_seen_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error?.code === "23505") return NextResponse.json({ status: "exists" });
  if (error || !tester) return NextResponse.json({ error: "db_error" }, { status: 500 });

  await sendBetaAccessEmail(tester, origin, true);
  try {
    await sendWebPush("pynkstudio", {
      title: "Nuovo beta tester",
      body: `${firstName} ${lastName} — ${devices.length} dispositivi`,
      url: "/admin-pynkstudio/beta",
      tag: `beta-tester-${tester.id}`,
    });
  } catch (e) {
    console.warn("[beta] push admin fallita:", e);
  }

  const res = NextResponse.json({ status: "created" });
  setBetaCookie(res, tester.access_token);
  return res;
}
