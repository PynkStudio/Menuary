import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { betaOrigin, sendBetaAccessEmail } from "@/lib/pynkstudio/beta";
import { isValidEmail } from "@/lib/pynkstudio/beta-shared";

export const dynamic = "force-dynamic";

/** Invia il link d'accesso. Risponde sempre ok: non rivela quali email sono iscritte. */
export async function POST(request: Request) {
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!isValidEmail(email)) return NextResponse.json({ error: "invalid_email" }, { status: 400 });

  const { data: tester } = await svc.from("pynkstudio_beta_testers").select("*").eq("email", email).maybeSingle();
  if (tester) await sendBetaAccessEmail(tester, betaOrigin(request), false);
  return NextResponse.json({ ok: true });
}
