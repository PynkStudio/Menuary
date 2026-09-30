import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/sender";
import { sendWebPush } from "@/lib/push/send";
import { sendWhatsApp } from "@/lib/whatsapp/send";
import { bookingReminderHtml } from "@/lib/pynkstudio/email-templates";
import { getAgenda, PYNK_AGENDA_SCOPE, pynkSlotLabel } from "@/lib/agenda-runtime";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const REMINDER_LEAD_MINUTES = 20;
const PYNK_FROM = "PYNK STUDIO <amministrazione@pynkstudio.eu>";

// pg_cron chiama con Authorization: Bearer {CRON_SECRET}.
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Promemoria ~20 min prima della call: push all'admin + email/WhatsApp al cliente.
// claimDueReminders marca e restituisce le call nella stessa UPDATE: i giri
// sovrapposti del cron non inviano due volte.
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const agenda = getAgenda();
  const due = await agenda.claimDueReminders({ leadMinutes: REMINDER_LEAD_MINUTES, scope: PYNK_AGENDA_SCOPE });

  for (const b of due) {
    const slotLabel = pynkSlotLabel(b);
    const topic = b.topic ?? "";
    const joinUrl = b.location === "video" ? agenda.guestUrlFor(b) : null;

    try {
      await sendWebPush(PYNK_AGENDA_SCOPE, {
        title: joinUrl ? "Videocall tra ~20 minuti" : "Call tra ~20 minuti",
        body: `${b.name} — ${topic} · ${slotLabel}`,
        url: joinUrl ? `/admin-pynkstudio/agenda/call/${b.id}` : "/admin-pynkstudio/agenda",
        tag: `reminder-${b.id}`,
      });
    } catch (e) {
      console.warn("[call-reminders] push fallita:", e);
    }

    if (b.phone) {
      try {
        await sendWhatsApp(b.phone, "call_reminder", { "1": b.name, "2": slotLabel, "3": topic });
      } catch (e) {
        console.warn("[call-reminders] whatsapp fallita:", e);
      }
    }

    try {
      await sendEmail({
        to: b.email,
        fromOverride: PYNK_FROM,
        replyTo: "amministrazione@pynkstudio.eu",
        subject: joinUrl
          ? "La tua videocall con PYNK STUDIO inizia tra ~20 minuti"
          : "La tua call con PYNK STUDIO inizia tra ~20 minuti",
        html: bookingReminderHtml({ name: b.name, slotLabel, topic, phone: b.phone ?? "", joinUrl }),
      });
    } catch (e) {
      console.warn("[call-reminders] email fallita:", e);
    }
  }

  return NextResponse.json({ ok: true, reminded: due.length });
}
