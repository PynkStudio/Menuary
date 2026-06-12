/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  dispatchCampaign,
  enqueueNewsletterTrigger,
  getNewsletterDashboard,
  sanitizeNewsletterHtml,
} from "@/lib/newsletter/server";
import { getTenantById } from "@/lib/data/tenant";

type LooseClient = { from(table: string): any };

async function context(tenantId: string) {
  const auth = await authorizeGestione(tenantId);
  if (!auth.ok || (!auth.isDemo && !auth.isAdmin)) {
    return { error: NextResponse.json({ error: "Non autorizzato." }, { status: 403 }) };
  }
  const tenant = await getTenantById(tenantId);
  if (!tenant?.features.fanbaseCommunity) {
    return { error: NextResponse.json({ error: "Modulo newsletter non attivo." }, { status: 403 }) };
  }
  const raw = createSupabaseServiceClient();
  if (!raw) return { error: NextResponse.json({ error: "Database non disponibile." }, { status: 503 }) };
  return { auth, db: raw as unknown as LooseClient };
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function email(value: unknown) {
  const normalized = text(value, 320).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : "";
}

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId")?.trim() ?? "";
  const ctx = await context(tenantId);
  if ("error" in ctx) return ctx.error;
  try {
    return NextResponse.json(await getNewsletterDashboard(tenantId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Errore database." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = text(body?.tenantId, 120);
  const action = text(body?.action, 60);
  const ctx = await context(tenantId);
  if ("error" in ctx) return ctx.error;
  const now = new Date().toISOString();

  try {
    if (action === "save-subscriber") {
      const subscriberEmail = email(body?.email);
      if (!subscriberEmail) return NextResponse.json({ error: "Email non valida." }, { status: 400 });
      const status = ["active", "unsubscribed", "bounced", "complained"].includes(String(body?.status))
        ? body?.status
        : "active";
      const { error } = await ctx.db.from("tenant_newsletter_subscribers").upsert({
        tenant_id: tenantId,
        email: subscriberEmail,
        name: text(body?.name, 160) || null,
        locale: text(body?.locale, 12) || "it",
        source: text(body?.source, 80) || "gestione",
        status,
        tags: Array.isArray(body?.tags) ? body.tags.map((tag) => text(tag, 50)).filter(Boolean).slice(0, 30) : [],
        unsubscribed_at: status === "unsubscribed" ? now : null,
        updated_at: now,
      }, { onConflict: "tenant_id,email" });
      if (error) throw new Error(error.message);
    } else if (action === "delete-subscriber") {
      const { error } = await ctx.db
        .from("tenant_newsletter_subscribers")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", text(body?.id, 80));
      if (error) throw new Error(error.message);
    } else if (action === "save-message") {
      const kind = body?.kind === "automation" ? "automation" : "campaign";
      const status = kind === "automation"
        ? (body?.status === "active" ? "active" : "paused")
        : (body?.status === "scheduled" ? "scheduled" : "draft");
      const row = {
        id: text(body?.id, 80) || crypto.randomUUID(),
        tenant_id: tenantId,
        kind,
        name: text(body?.name, 160),
        status,
        trigger_key: kind === "automation" ? text(body?.triggerKey, 80) || "subscriber_joined" : null,
        delay_minutes: Math.max(0, Math.min(525600, Number(body?.delayMinutes) || 0)),
        subject: text(body?.subject, 240),
        preheader: text(body?.preheader, 300) || null,
        body_html: sanitizeNewsletterHtml(text(body?.bodyHtml, 100000)),
        from_name: text(body?.fromName, 120) || null,
        reply_to: email(body?.replyTo) || null,
        scheduled_at: status === "scheduled" && body?.scheduledAt
          ? new Date(String(body.scheduledAt)).toISOString()
          : null,
        updated_at: now,
        created_by: ctx.auth.isDemo ? null : ctx.auth.userId,
      };
      if (!row.name || !row.subject || !row.body_html) {
        return NextResponse.json({ error: "Nome, oggetto e contenuto sono obbligatori." }, { status: 400 });
      }
      const { error } = await ctx.db.from("tenant_newsletter_messages").upsert(row);
      if (error) throw new Error(error.message);
    } else if (action === "delete-message") {
      const { error } = await ctx.db
        .from("tenant_newsletter_messages")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", text(body?.id, 80));
      if (error) throw new Error(error.message);
    } else if (action === "send-campaign") {
      const result = await dispatchCampaign(text(body?.id, 80));
      return NextResponse.json({ ok: true, result });
    } else if (action === "trigger") {
      await enqueueNewsletterTrigger({
        tenantId,
        triggerKey: text(body?.triggerKey, 80),
        subscriberId: text(body?.subscriberId, 80) || null,
        recipientEmail: email(body?.recipientEmail) || null,
        payload: body?.payload && typeof body.payload === "object"
          ? body.payload as Record<string, unknown>
          : {},
      });
    } else {
      return NextResponse.json({ error: "Azione non supportata." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Errore database." }, { status: 500 });
  }
}
