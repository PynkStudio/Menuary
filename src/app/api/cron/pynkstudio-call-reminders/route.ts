import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getTenantContent } from "@/lib/tenant-content";
import { sendEmail } from "@/lib/email/sender";
import { sendWebPush } from "@/lib/push/send";
import { formatSlotLabel } from "@/lib/pynkstudio/booking";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TENANT_ID = "pynkstudio";
const REMINDER_LEAD_MINUTES = 20;

// Vercel/pg_cron chiamano con Authorization: Bearer {CRON_SECRET}.
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Promemoria ~20 min prima della call: push all'admin + email al cliente.
// Idempotente: marca reminder_sent_at così non reinvia ai giri successivi.
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  const now = Date.now();
  const windowEnd = new Date(now + REMINDER_LEAD_MINUTES * 60000).toISOString();
  const nowISO = new Date(now).toISOString();

  const { data: due, error } = await svc
    .from("consultation_bookings")
    .select("id, name, email, phone, topic, starts_at")
    .eq("tenant_id", TENANT_ID)
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gt("starts_at", nowISO)
    .lte("starts_at", windowEnd);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!due?.length) return NextResponse.json({ ok: true, reminded: 0 });

  const tenantEmail = getTenantContent(TENANT_ID).contact.email?.trim();
  let reminded = 0;

  for (const b of due) {
    const startUtc = new Date(b.starts_at);
    const slotLabel = formatSlotLabel(startUtc);

    try {
      await sendWebPush(TENANT_ID, {
        title: "Call tra ~20 minuti",
        body: `${b.name} — ${b.topic} · ${slotLabel}`,
        url: "/admin-pynkstudio/agenda",
        tag: `reminder-${b.id}`,
      });
    } catch (e) {
      console.warn("[call-reminders] push fallita:", e);
    }

    try {
      await sendEmail({
        tenantId: TENANT_ID,
        to: b.email,
        replyTo: tenantEmail,
        subject: "Promemoria: la tua call è tra ~20 minuti",
        html: `
          <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#17111f;line-height:1.6">
            <h1 style="font-size:22px;margin:0 0 12px">La tua call sta per iniziare ⏰</h1>
            <p>Ciao ${escapeHtml(b.name)}, ti aspettiamo tra circa 20 minuti.</p>
            <p style="margin:14px 0"><strong>${escapeHtml(slotLabel)}</strong> (Italia) · 20 minuti</p>
            <p style="color:#6b6472;font-size:14px">Argomento: ${escapeHtml(b.topic)}. Ti chiameremo al ${escapeHtml(b.phone)}.</p>
          </div>
        `,
      });
    } catch (e) {
      console.warn("[call-reminders] email fallita:", e);
    }

    await svc
      .from("consultation_bookings")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", b.id);
    reminded++;
  }

  return NextResponse.json({ ok: true, reminded });
}
