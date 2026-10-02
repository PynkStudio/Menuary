import "server-only";

import {
  eventIcs,
  formatSlotLabel,
  googleCalendarLink,
  outlookCalendarLink,
  type AgendaBooking,
  type AgendaEventType,
  type CalendarEventInput,
} from "@pynkstudio/agendaapp/core";
import { createAgendaHandlers } from "@pynkstudio/agendaapp/http";
import { createAgendaServer, type AgendaServer } from "@pynkstudio/agendaapp/server";

import { sendEmail } from "@/lib/email/sender";
import { sendWebPush } from "@/lib/push/send";
import { addCrmActivity, cleanAttribution, cleanList, recordCrmTouch } from "@/lib/pynkstudio/crm";
import { bookingConfirmHtml } from "@/lib/pynkstudio/email-templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendWhatsApp } from "@/lib/whatsapp/send";

/**
 * Montaggio di `@pynkstudio/agendaapp` in questo sito. Il pacchetto possiede
 * slot, prenotazioni, token e stanze LiveKit; qui restano le cose di Menuary:
 * quali tipi di evento offre ogni tenant, email/WhatsApp/push, CRM PynkStudio.
 */

export const PYNK_AGENDA_SCOPE = "pynkstudio";
export const PYNK_CALL_EVENT = "call-20";
const PYNK_SITE = "https://pynkstudio.eu";
// Il ritorno OAuth deve atterrare sul pannello admin, dove vive la pagina impostazioni.
const PYNK_ADMIN = "https://admin.pynkstudio.eu";
export const PYNK_AGENDA_SETTINGS_PATH = "/admin-pynkstudio/agenda/impostazioni";

function oauthClient(id: string | undefined, secret: string | undefined) {
  return id && secret ? { clientId: id, clientSecret: secret } : null;
}

// Senza AGENDA_CREDENTIALS_KEY i calendari esterni restano spenti: si usano
// solo posti e orari manuali.
function calendarsConfig() {
  const credentialsKey = process.env.AGENDA_CREDENTIALS_KEY;
  if (!credentialsKey) return null;
  return {
    credentialsKey,
    redirectUri: (provider: "google" | "microsoft") => `${PYNK_ADMIN}/api/agenda/calendar/callback/${provider}`,
    google: oauthClient(process.env.AGENDA_GOOGLE_CLIENT_ID, process.env.AGENDA_GOOGLE_CLIENT_SECRET),
    microsoft: oauthClient(process.env.AGENDA_MICROSOFT_CLIENT_ID, process.env.AGENDA_MICROSOFT_CLIENT_SECRET),
  };
}
const PYNK_FROM = "PYNK STUDIO <amministrazione@pynkstudio.eu>";
const PYNK_REPLY_TO = "amministrazione@pynkstudio.eu";

function livekitConfig() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  return url && apiKey && apiSecret ? { url, apiKey, apiSecret } : null;
}

// Finché LiveKit non è configurato la call resta telefonica, come prima: niente
// link di videocall che porterebbero a una stanza irraggiungibile.
function pynkEventTypes(): AgendaEventType[] {
  return [
    {
      id: PYNK_CALL_EVENT,
      title: "Call di consulenza (20 min)",
      durationMinutes: 20,
      timezone: "Europe/Rome",
      weekly: ([1, 2, 3, 4, 5] as const).map((day) => ({ day, start: "10:00", end: "18:00" })),
      lookaheadDays: 14,
      // Valori iniziali: si cambiano da admin → Agenda → Impostazioni.
      holidays: ["IT"],
      location: livekitConfig() ? "video" : "phone",
    },
  ];
}

// Il link passa da /accedi, che sposta il token in un cookie: l'URL della
// pagina della call resta senza credenziali (vedi la route).
export function pynkVideoCallUrl(bookingId: string, manageToken: string): string {
  return `${PYNK_SITE}/it/videocall/${bookingId}/accedi?t=${encodeURIComponent(manageToken)}`;
}

export function pynkGuestCookieName(bookingId: string): string {
  return `agenda_guest_${bookingId.replace(/[^a-zA-Z0-9-]/g, "")}`;
}

/** Link «Salva sul calendario» per le email: Google, Outlook e il .ics servito dal sito. */
export function pynkCalendarLinks(booking: AgendaBooking, event: CalendarEventInput, manageToken: string) {
  return {
    google: googleCalendarLink(event),
    outlook: outlookCalendarLink(event, "personal"),
    ics: `${PYNK_SITE}/api/tenant/pynkstudio/bookings/ics?${new URLSearchParams({ bookingId: booking.id, token: manageToken })}`,
  };
}

export function pynkSlotLabel(booking: Pick<AgendaBooking, "startsAt">): string {
  return formatSlotLabel(booking.startsAt, { timezone: "Europe/Rome", locale: "it-IT" });
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : typeof value === "number" ? String(value) : "";
}

async function onPynkBookingCreated(booking: AgendaBooking, guestUrl: string | null, manageToken: string, extra: Record<string, unknown>) {
  const svc = createSupabaseServiceClient();
  const slotLabel = pynkSlotLabel(booking);
  const topic = booking.topic ?? "";
  const phone = booking.phone ?? "";
  // Il link è l'unico accesso dell'ospite alla stanza: deve stare nella conferma.
  const joinUrl = booking.location === "video" ? guestUrl : null;
  const calendarEvent = await getAgenda().guestCalendarEvent(booking);

  if (svc) {
    try {
      await recordCrmTouch(svc, {
        kind: "booking",
        source: booking.source || "booking",
        name: booking.name,
        email: booking.email,
        phone,
        company: str(extra.company, 160),
        employees: str(extra.employees, 40),
        industry: str(extra.industry, 120),
        interests: cleanList(extra.interests),
        timing: str(extra.timing, 60),
        plan: str(extra.plan, 120),
        attribution: cleanAttribution(extra.attribution),
        title: `Call prenotata · ${slotLabel}`,
        body: topic,
        booking: { id: booking.id, startsAt: booking.startsAt },
      });
    } catch (e) {
      console.warn("[agenda] crm upsert fallito:", e);
    }
  }

  try {
    await sendEmail({
      to: booking.email,
      fromOverride: PYNK_FROM,
      replyTo: PYNK_REPLY_TO,
      subject: `Call confermata — ${slotLabel}`,
      html: bookingConfirmHtml({ name: booking.name, slotLabel, topic, phone, joinUrl, calendar: pynkCalendarLinks(booking, calendarEvent, manageToken) }),
      // Molti client di posta mostrano l'allegato come «Aggiungi al calendario».
      attachments: [
        { filename: "call-pynkstudio.ics", content: Buffer.from(eventIcs(calendarEvent)).toString("base64"), contentType: "text/calendar" },
      ],
    });
  } catch (e) {
    console.warn("[agenda] email conferma fallita:", e);
  }

  if (phone) {
    try {
      await sendWhatsApp(phone, "booking_confirm", { "1": booking.name, "2": slotLabel, "3": topic });
    } catch (e) {
      console.warn("[agenda] whatsapp conferma fallita:", e);
    }
  }

  try {
    await sendWebPush(PYNK_AGENDA_SCOPE, {
      title: booking.location === "video" ? "Nuova videocall prenotata" : "Nuova call prenotata",
      body: `${booking.name} — ${topic} · ${slotLabel}`,
      url: "/admin-pynkstudio/agenda",
      tag: `booking-${booking.id}`,
    });
  } catch (e) {
    console.warn("[agenda] push admin fallita:", e);
  }
}

async function onPynkBookingCancelled(booking: AgendaBooking, by: "host" | "guest" | "system") {
  const svc = createSupabaseServiceClient();
  if (!svc) return;
  try {
    const { data: contact } = await svc
      .from("pynkstudio_crm")
      .select("id, bookings_count")
      .eq("email", booking.email.trim().toLowerCase())
      .maybeSingle();
    if (!contact) return;
    await svc
      .from("pynkstudio_crm")
      .update({ bookings_count: Math.max(0, contact.bookings_count - 1), last_activity_at: new Date().toISOString() })
      .eq("id", contact.id);
    await addCrmActivity(
      svc,
      contact.id,
      "booking",
      by === "guest" ? "Call annullata dal cliente" : "Call annullata",
      booking.topic ?? "",
      by === "guest" ? "cliente" : "admin",
      { booking_id: booking.id, starts_at: booking.startsAt },
    );
  } catch (e) {
    console.warn("[agenda] crm annullamento fallito:", e);
  }
}

let server: AgendaServer | null = null;

export function getAgenda(): AgendaServer {
  if (server) return server;
  const signingSecret = process.env.AGENDA_SIGNING_SECRET;
  if (!signingSecret) throw new Error("AGENDA_SIGNING_SECRET non configurata");
  server = createAgendaServer({
    db: () => createSupabaseServiceClient(),
    eventTypes: (scope) => (scope === PYNK_AGENDA_SCOPE ? pynkEventTypes() : []),
    signingSecret,
    video: livekitConfig(),
    calendars: calendarsConfig(),
    guestUrl: (booking, token) => pynkVideoCallUrl(booking.id, token),
    // In call il cliente compare con i dati del modulo: nome e cognome, più
    // l'azienda quando il modulo la chiede (landing IA).
    // Evento nel calendario di chi riceve la call: dati del cliente e link alla stanza staff.
    hostCalendarEvent: (booking) => {
      const room = `${PYNK_ADMIN}/admin-pynkstudio/agenda/call/${booking.id}`;
      return {
        title: `Call PYNK STUDIO — ${getAgenda().guestDisplayName(booking)}`,
        description: [
          booking.topic && `Argomento: ${booking.topic}`,
          `Email: ${booking.email}`,
          booking.phone && `Telefono: ${booking.phone}`,
          booking.location === "video" ? `Entra in videocall: ${room}` : "Call telefonica: chiama tu il cliente.",
        ]
          .filter(Boolean)
          .join("\n"),
        location: booking.location === "video" ? room : (booking.phone ?? undefined),
      };
    },
    // Evento che il cliente salva nel proprio calendario.
    guestCalendarEvent: (booking) => ({
      title: "Call con PYNK STUDIO",
      description: [
        booking.topic && `Argomento: ${booking.topic}`,
        booking.location === "video"
          ? "Entra dal link personale qui sotto: si attiva 10 minuti prima dell'inizio."
          : "Ti chiamiamo noi al numero indicato nella prenotazione.",
      ]
        .filter(Boolean)
        .join("\n"),
      organizer: { name: "PYNK STUDIO", email: PYNK_REPLY_TO },
    }),
    guestDisplayName: (booking) => {
      const company = typeof booking.answers.company === "string" ? booking.answers.company.trim() : "";
      return company ? `${booking.name} · ${company}` : booking.name;
    },
    hooks: {
      onBookingCreated: ({ booking, guestUrl, manageToken, extra }) =>
        booking.scope === PYNK_AGENDA_SCOPE ? onPynkBookingCreated(booking, guestUrl, manageToken, extra) : undefined,
      onBookingCancelled: ({ booking, by }) =>
        booking.scope === PYNK_AGENDA_SCOPE ? onPynkBookingCancelled(booking, by) : undefined,
    },
  });
  return server;
}

/**
 * Siteadmin abilitato della sessione corrente, con il nome con cui entra in
 * call: nome e cognome dell'utenza, poi il nome visualizzato, poi l'email.
 */
export async function getPynkStaffIdentity(): Promise<{ identity: string; name: string } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: admin } = await supabase
    .from("siteadmin")
    .select("id, display_name, first_name, last_name, email")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  if (!admin?.id) return null;
  const fullName = [admin.first_name, admin.last_name].map((x) => x?.trim()).filter(Boolean).join(" ");
  return { identity: admin.id, name: fullName || admin.display_name?.trim() || admin.email };
}

/** Siteadmin abilitati: sono le persone che possono ricevere le call. */
async function listPynkStaff(scope: string) {
  if (scope !== PYNK_AGENDA_SCOPE) return [];
  const svc = createSupabaseServiceClient();
  if (!svc) return [];
  const { data } = await svc.from("siteadmin").select("id, first_name, last_name, display_name, email").eq("enabled", true);
  return (data ?? []).map((a) => ({
    externalId: a.id,
    name: [a.first_name, a.last_name].map((x) => x?.trim()).filter(Boolean).join(" ") || a.display_name?.trim() || a.email,
    email: a.email,
  }));
}

/** Staff PynkStudio: siteadmin abilitati. Solo lo scope pynkstudio ha un'agenda. */
async function authorizeSiteadmin(_request: Request, scope: string) {
  return scope === PYNK_AGENDA_SCOPE ? getPynkStaffIdentity() : null;
}

export const agendaHttp = createAgendaHandlers({
  agenda: getAgenda,
  requiredFields: ["phone", "topic"],
  authorizeHost: authorizeSiteadmin,
  listStaff: listPynkStaff,
});
