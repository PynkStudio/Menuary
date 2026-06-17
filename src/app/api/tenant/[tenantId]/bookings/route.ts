import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/sender";
import { sendWebPush } from "@/lib/push/send";
import { sendWhatsApp } from "@/lib/whatsapp/send";
import { isValidSlot, slotEnd, formatSlotLabel } from "@/lib/pynkstudio/booking";
import { bookingConfirmHtml } from "@/lib/pynkstudio/email-templates";

export const dynamic = "force-dynamic";

const PYNK_FROM = "PYNK STUDIO <amministrazione@pynkstudio.it>";

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

  // Upsert CRM: crea il contatto se nuovo, aggiorna l'ultima call se già presente (best-effort).
  if (tenantId === "pynkstudio") {
    try {
      const { data: existing } = await svc
        .from("pynkstudio_crm")
        .select("id, bookings_count")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        await svc
          .from("pynkstudio_crm")
          .update({
            name,
            phone,
            last_booking_id: inserted.id,
            last_booking_at: startUtc.toISOString(),
            bookings_count: existing.bookings_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await svc.from("pynkstudio_crm").insert({
          name,
          email,
          phone,
          source: "booking",
          last_booking_id: inserted.id,
          last_booking_at: startUtc.toISOString(),
          bookings_count: 1,
        });
      }
    } catch (e) {
      console.warn("[bookings] crm upsert fallito:", e);
    }
  }

  // Email di conferma al cliente (best-effort: non blocca la prenotazione).
  try {
    await sendEmail({
      to: email,
      fromOverride: PYNK_FROM,
      replyTo: "amministrazione@pynkstudio.it",
      subject: `Call confermata — ${slotLabel}`,
      html: bookingConfirmHtml({ name, slotLabel, topic, phone }),
    });
  } catch (e) {
    console.warn("[bookings] email conferma fallita:", e);
  }

  // WhatsApp di conferma al cliente (best-effort).
  try {
    await sendWhatsApp(phone, "booking_confirm", {
      "1": name,
      "2": slotLabel,
      "3": topic,
    });
  } catch (e) {
    console.warn("[bookings] whatsapp conferma fallita:", e);
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
