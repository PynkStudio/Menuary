/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getTenantById } from "@/lib/data/tenant";
import { enqueueNewsletterTrigger } from "@/lib/newsletter/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = typeof body?.tenantId === "string" ? body.tenantId.trim().slice(0, 120) : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 320) : "";
  if (!tenantId || body?.consent !== true || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
  }
  const tenant = await getTenantById(tenantId);
  if (!tenant?.features.fanbaseCommunity) {
    return NextResponse.json({ error: "Newsletter non disponibile." }, { status: 404 });
  }
  const raw = createSupabaseServiceClient();
  if (!raw) return NextResponse.json({ error: "Servizio non disponibile." }, { status: 503 });
  const db = raw as any;
  const now = new Date().toISOString();
  const { data: existing } = await db
    .from("tenant_newsletter_subscribers")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .maybeSingle();
  const { data, error } = await db.from("tenant_newsletter_subscribers").upsert({
    tenant_id: tenantId,
    email,
    name: typeof body?.name === "string" ? body.name.trim().slice(0, 160) || null : null,
    locale: typeof body?.locale === "string" ? body.locale.slice(0, 12) : "it",
    source: typeof body?.source === "string" ? body.source.slice(0, 80) : "web",
    status: "active",
    consent_at: now,
    unsubscribed_at: null,
    updated_at: now,
  }, { onConflict: "tenant_id,email" }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!existing || existing.status !== "active") {
    await enqueueNewsletterTrigger({ tenantId, triggerKey: "subscriber_joined", subscriberId: data.id });
  }
  return NextResponse.json({ ok: true });
}
