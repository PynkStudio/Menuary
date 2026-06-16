import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { getTenantContent } from "@/lib/tenant-content";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/sender";
import { sendWebPush } from "@/lib/push/send";
import { isValidSlot, slotEnd, formatSlotLabel } from "@/lib/pynkstudio/booking";

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type Body = {
  name?: string;
  email?: string;
  phone?: string;
  topic?: string;
  startUtc?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const tenant = findTenantById(tenantId);
  if (!tenant) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const topic = (body.topic ?? "").trim();
  const startUtc = new Date(body.startUtc ?? "");

  if (!name || !email || !phone || !topic) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!isValidSlot(startUtc)) {
    return NextResponse.json({ error: "invalid_slot" }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  const endUtc = slotEnd(startUtc);
  const { data: inserted, error } = await svc
    .from("consultation_bookings")
    .insert({
      tenant_id: tenantId,
      name,
      email,
      phone,
      topic,
      starts_at: startUtc.toISOString(),
      ends_at: endUtc.toISOString(),
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = violazione unique index → slot già occupato.
    if (error.code === "23505") {
      return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const slotLabel = formatSlotLabel(startUtc);

  // Email di conferma al cliente (best-effort: non blocca la prenotazione).
  try {
    const tenantEmail = getTenantContent(tenantId).contact.email?.trim();
    await sendEmail({
      tenantId,
      to: email,
      replyTo: tenantEmail,
      subject: `Call confermata — ${slotLabel}`,
      html: `
        <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;color:#17111f;line-height:1.6">
          <h1 style="font-size:22px;margin:0 0 12px">La tua call è confermata ✅</h1>
          <p>Ciao ${escapeHtml(name)}, abbiamo prenotato la tua call di consulenza.</p>
          <table style="margin:16px 0;border-collapse:collapse">
            <tr><td style="padding:4px 12px 4px 0;color:#6b6472">Quando</td><td style="font-weight:600">${escapeHtml(slotLabel)} (Italia)</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b6472">Durata</td><td>20 minuti</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b6472">Argomento</td><td>${escapeHtml(topic)}</td></tr>
          </table>
          <p style="color:#6b6472;font-size:14px">Ti chiameremo al numero ${escapeHtml(phone)}. Se devi spostare l'orario, rispondi a questa email.</p>
          <p style="margin-top:18px">A presto,<br/>Il team PYNK STUDIO</p>
        </div>
      `,
    });
  } catch (e) {
    console.warn("[bookings] email conferma fallita:", e);
  }

  // Push all'admin (best-effort).
  try {
    await sendWebPush(tenantId, {
      title: "Nuova call prenotata",
      body: `${name} — ${topic} · ${slotLabel}`,
      url: "/admin-pynkstudio/agenda",
      tag: `booking-${inserted.id}`,
    });
  } catch (e) {
    console.warn("[bookings] push admin fallita:", e);
  }

  return NextResponse.json({ ok: true, id: inserted.id, slotLabel });
}
