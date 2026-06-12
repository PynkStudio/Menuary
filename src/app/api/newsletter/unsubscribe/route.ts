/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { enqueueNewsletterTrigger } from "@/lib/newsletter/server";

function validToken(token: string) {
  return /^[0-9a-f-]{36}$/i.test(token);
}

async function unsubscribe(token: string) {
  const raw = createSupabaseServiceClient();
  if (!raw) return { error: "Servizio non disponibile.", status: 503 };
  const db = raw as any;
  const { data: subscriber } = await db
    .from("tenant_newsletter_subscribers")
    .select("*")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (!subscriber) return { error: "Link non valido o scaduto.", status: 404 };
  if (subscriber.status !== "unsubscribed") {
    const now = new Date().toISOString();
    await db.from("tenant_newsletter_subscribers").update({
      status: "unsubscribed",
      unsubscribed_at: now,
      updated_at: now,
    }).eq("id", subscriber.id);
    await db.from("tenant_newsletter_unsubscribe_feedback").insert({
      tenant_id: subscriber.tenant_id,
      subscriber_id: subscriber.id,
      email: subscriber.email,
      source: "email_link",
    });
    await enqueueNewsletterTrigger({
      tenantId: subscriber.tenant_id,
      triggerKey: "subscriber_left",
      subscriberId: subscriber.id,
    });
  }
  return { ok: true };
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!validToken(token)) return new NextResponse("Link non valido.", { status: 400 });
  return new NextResponse(
    `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Disiscrizione newsletter</title><body style="font:16px system-ui;padding:48px;max-width:640px;margin:auto"><h1>Disiscrizione newsletter</h1><p>Conferma per non ricevere più queste comunicazioni.</p><form method="post"><input type="hidden" name="token" value="${token}"><button style="padding:12px 18px" type="submit">Conferma disiscrizione</button></form></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const token = String(form?.get("token") ?? "");
  if (!validToken(token)) return new NextResponse("Link non valido.", { status: 400 });
  const result = await unsubscribe(token);
  if ("error" in result) return new NextResponse(result.error, { status: result.status });
  return new NextResponse(
    "<!doctype html><html lang=\"it\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>Disiscrizione completata</title><body style=\"font:16px system-ui;padding:48px;max-width:640px;margin:auto\"><h1>Disiscrizione completata</h1><p>Non riceverai più comunicazioni da questa newsletter.</p></body></html>",
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
