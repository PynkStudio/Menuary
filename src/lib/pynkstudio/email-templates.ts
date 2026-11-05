/**
 * Mittente delle email automatiche PynkStudio (conferme, promemoria, beta program).
 * mail.pynkstudio.eu è verificato su Resend senza tracciamento di aperture e clic, che
 * su pynkstudio.eu è attivo e manda in spam link d'accesso e conferme. Le risposte
 * tornano alla casella principale.
 */
export const PYNK_TRANSACTIONAL_FROM = "PYNK STUDIO <amministrazione@mail.pynkstudio.eu>";
export const PYNK_REPLY_TO = "amministrazione@pynkstudio.eu";

const PYNK = "#d93378";
const PYNK_LIGHT = "#fdf0f6";
const TEXT = "#17111f";
const MUTED = "#6b5e75";
const BORDER = "#e8d8e4";
const WHITE = "#ffffff";

function escapeHtml(v: string) {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shell(body: string, lang: "it" | "en" = "it"): string {
  const en = lang === "en";
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PYNK STUDIO</title>
</head>
<body style="margin:0;padding:0;background:#f5eef2;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5eef2;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:${PYNK};border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;color:rgba(255,255,255,0.7);text-transform:uppercase;">PYNK STUDIO</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.6);font-weight:300;">${en ? "Strategy · Communication · Organization" : "Strategia · Comunicazione · Organizzazione"}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:${WHITE};padding:36px 40px 28px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
          ${body}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#faf4f8;border:1px solid ${BORDER};border-top:none;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;">
            ${en ? "Any questions? Reply to this email or write to us at" : "Hai domande? Rispondi a questa email oppure scrivici a"}
            <a href="mailto:amministrazione@pynkstudio.eu" style="color:${PYNK};text-decoration:none;">amministrazione@pynkstudio.eu</a>
          </p>
          <p style="margin:10px 0 0;font-size:11px;color:#b09ab0;">
            PYNK STUDIO · <a href="https://pynkstudio.eu" style="color:#b09ab0;">pynkstudio.eu</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 16px 8px 0;font-size:13px;color:${MUTED};white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:${TEXT};font-weight:500;">${value}</td>
  </tr>`;
}

export type BookingEmailData = {
  name: string;
  slotLabel: string;
  topic: string;
  phone: string;
  /** Link personale alla videocall; assente = call telefonica. */
  joinUrl?: string | null;
  /** Link «Salva sul calendario»: Google, Outlook e .ics (Apple e altri). */
  calendar?: { google: string; outlook: string; ics: string } | null;
};

function calendarLinks(c: NonNullable<BookingEmailData["calendar"]>): string {
  const link = (href: string, label: string) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:8px 14px;border:1px solid ${BORDER};border-radius:999px;font-size:13px;font-weight:600;color:${TEXT};text-decoration:none;">${label}</a>`;
  return `<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${TEXT};">📆 Salva sul calendario</p>
    <p style="margin:0 0 24px;">${link(c.google, "Google Calendar")}${link(c.outlook, "Outlook")}${link(c.ics, "Apple / altro calendario")}</p>`;
}

function joinButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr><td style="background:${PYNK};border-radius:8px;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${WHITE};text-decoration:none;">${label}</a>
      </td></tr>
    </table>`;
}

export function bookingConfirmHtml(d: BookingEmailData): string {
  const n = escapeHtml(d.name);
  const slot = escapeHtml(d.slotLabel);
  const topic = escapeHtml(d.topic);
  const phone = escapeHtml(d.phone);

  return shell(`
    <p style="margin:0 0 4px;font-size:26px;font-weight:700;color:${TEXT};line-height:1.2;">La tua call è confermata ✅</p>
    <p style="margin:12px 0 28px;font-size:15px;color:${MUTED};line-height:1.6;">
      Ciao <strong style="color:${TEXT};">${n}</strong>, abbiamo registrato la tua prenotazione.
      ${d.joinUrl
        ? "Ci vediamo in videocall all'orario indicato qui sotto: basta il browser, non serve installare nulla."
        : "Ti chiamiamo noi all'orario indicato qui sotto."}
    </p>

    <!-- Detail card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${PYNK_LIGHT};border:1px solid ${BORDER};border-radius:10px;padding:20px 24px;margin-bottom:28px;">
      <tr><td>
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${detailRow("📅 Quando", `${slot} <span style="color:${MUTED};font-weight:400;font-size:12px;">(ora italiana)</span>`)}
          ${detailRow("⏱ Durata", "20 minuti")}
          ${detailRow("📌 Argomento", topic)}
          ${d.joinUrl ? detailRow("🎥 Dove", "Videocall PYNK STUDIO") : detailRow("📞 Telefono", phone)}
        </table>
      </td></tr>
    </table>

    ${d.joinUrl ? joinButton(d.joinUrl, "Entra nella videocall") : ""}
    ${d.joinUrl ? `<p style="margin:0 0 20px;font-size:13px;color:${MUTED};line-height:1.6;">Il link è personale e si attiva 10 minuti prima dell'inizio. Tienilo: te lo rimandiamo anche nel promemoria.</p>` : ""}
    ${d.calendar ? calendarLinks(d.calendar) : ""}

    <p style="margin:0;font-size:14px;color:${MUTED};line-height:1.7;">
      Se hai bisogno di spostare o annullare l'appuntamento, rispondi a questa email
      almeno <strong style="color:${TEXT};">1 ora prima</strong> dell'orario previsto.
    </p>
    <p style="margin:24px 0 0;font-size:15px;color:${TEXT};">
      A presto 👋<br/>
      <span style="color:${PYNK};font-weight:600;">Il team PYNK STUDIO</span>
    </p>
  `);
}

export function bookingReminderHtml(d: BookingEmailData): string {
  const n = escapeHtml(d.name);
  const slot = escapeHtml(d.slotLabel);
  const topic = escapeHtml(d.topic);
  const phone = escapeHtml(d.phone);

  return shell(`
    <p style="margin:0 0 4px;font-size:26px;font-weight:700;color:${TEXT};line-height:1.2;">La call inizia tra ~20 minuti ⏰</p>
    <p style="margin:12px 0 28px;font-size:15px;color:${MUTED};line-height:1.6;">
      Ciao <strong style="color:${TEXT};">${n}</strong>, ti scriviamo per ricordarti
      che la tua call con PYNK STUDIO sta per iniziare.
    </p>

    <!-- Detail card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${PYNK_LIGHT};border:1px solid ${BORDER};border-radius:10px;padding:20px 24px;margin-bottom:28px;">
      <tr><td>
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${detailRow("📅 Orario", `${slot} <span style="color:${MUTED};font-weight:400;font-size:12px;">(ora italiana)</span>`)}
          ${detailRow("📌 Argomento", topic)}
          ${d.joinUrl ? detailRow("🎥 Dove", "Videocall PYNK STUDIO") : detailRow("📞 Telefono", phone)}
        </table>
      </td></tr>
    </table>

    ${d.joinUrl ? joinButton(d.joinUrl, "Entra nella videocall") : ""}
    ${d.calendar ? calendarLinks(d.calendar) : ""}
    <p style="margin:0;font-size:14px;color:${MUTED};line-height:1.7;">
      ${d.joinUrl
        ? "Apri il link da computer o telefono e consenti l'accesso a microfono e videocamera."
        : "Tieniti pronto — siamo noi a chiamarti al numero indicato."}
    </p>
    <p style="margin:24px 0 0;font-size:15px;color:${TEXT};">
      A tra poco! 📞<br/>
      <span style="color:${PYNK};font-weight:600;">Il team PYNK STUDIO</span>
    </p>
  `);
}

// ─── Beta manager ───────────────────────────────────────────────

type BetaEmailLang = "it" | "en";

function betaFooterNote(unsubscribeUrl: string | undefined, lang: BetaEmailLang): string {
  if (!unsubscribeUrl) return "";
  const [lead, link] =
    lang === "en"
      ? ["You're receiving this email because you signed up for PYNK STUDIO betas.", "I don't want any more alerts about new betas"]
      : ["Ricevi questa email perché sei iscritto alle beta di PYNK STUDIO.", "Non voglio più avvisi sulle nuove beta"];
  return `<p style="margin:28px 0 0;font-size:12px;color:${MUTED};line-height:1.6;">
        ${lead}
        <a href="${escapeHtml(unsubscribeUrl)}" style="color:${MUTED};">${link}</a>.
      </p>`;
}

const ACCESS_COPY = {
  it: {
    titleNew: "Benvenuto tra i beta tester 🧪",
    title: "Il tuo accesso alle beta",
    hi: "Ciao",
    bodyNew: "conferma la tua email per completare l'iscrizione e ricevere gli avvisi quando escono nuove beta per i tuoi dispositivi.",
    body: "ecco il link per entrare nella tua area beta. Funziona su qualsiasi dispositivo.",
    ctaNew: "Conferma ed entra",
    cta: "Entra nell'area beta",
    note: "Il link è personale: non inoltrarlo. Se non hai richiesto tu questa email puoi ignorarla.",
  },
  en: {
    titleNew: "Welcome to the beta testers 🧪",
    title: "Your beta access",
    hi: "Hi",
    bodyNew: "confirm your email to complete your sign-up and get alerts when new betas come out for your devices.",
    body: "here's the link to your beta area. It works on any device.",
    ctaNew: "Confirm and log in",
    cta: "Open your beta area",
    note: "This link is personal: please don't forward it. If you didn't request this email, you can ignore it.",
  },
} as const;

export function betaAccessHtml(d: { firstName: string; accessUrl: string; isNew: boolean; lang?: BetaEmailLang }): string {
  const lang = d.lang ?? "it";
  const c = ACCESS_COPY[lang];
  return shell(`
    <p style="margin:0 0 4px;font-size:26px;font-weight:700;color:${TEXT};line-height:1.2;">
      ${d.isNew ? c.titleNew : c.title}
    </p>
    <p style="margin:12px 0 28px;font-size:15px;color:${MUTED};line-height:1.6;">
      ${c.hi} <strong style="color:${TEXT};">${escapeHtml(d.firstName)}</strong>,
      ${d.isNew ? c.bodyNew : c.body}
    </p>
    ${joinButton(d.accessUrl, d.isNew ? c.ctaNew : c.cta)}
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.7;">
      ${c.note}
    </p>
  `, lang);
}

export type BetaEmailChannel = { deviceLabel: string; methodLabel: string };

export function betaNewHtml(d: {
  firstName: string;
  betaName: string;
  tagline: string | null;
  kindLabel: string;
  version: string | null;
  channels: BetaEmailChannel[];
  areaUrl: string;
  unsubscribeUrl: string;
  lang?: BetaEmailLang;
}): string {
  const lang = d.lang ?? "it";
  const en = lang === "en";
  const rows = d.channels
    .map((c) => detailRow(escapeHtml(c.deviceLabel), escapeHtml(c.methodLabel)))
    .join("");
  return shell(`
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${PYNK};">
      ${escapeHtml(d.kindLabel)}${d.version ? ` · v${escapeHtml(d.version)}` : ""}
    </p>
    <p style="margin:0 0 4px;font-size:26px;font-weight:700;color:${TEXT};line-height:1.2;">${escapeHtml(d.betaName)} ${en ? "is in beta" : "è in beta"}</p>
    <p style="margin:12px 0 24px;font-size:15px;color:${MUTED};line-height:1.6;">
      ${en ? "Hi" : "Ciao"} <strong style="color:${TEXT};">${escapeHtml(d.firstName)}</strong>,
      ${d.tagline ? `${escapeHtml(d.tagline)} — ` : ""}${en ? "there's a new beta available for your devices." : "c'è una nuova beta disponibile per i tuoi dispositivi."}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${PYNK_LIGHT};border:1px solid ${BORDER};border-radius:10px;padding:20px 24px;margin-bottom:28px;">
      <tr><td><table role="presentation" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
    </table>
    ${joinButton(d.areaUrl, en ? "See how to join" : "Scopri come unirti")}
    ${betaFooterNote(d.unsubscribeUrl, lang)}
  `, lang);
}

export function betaApprovedHtml(d: {
  firstName: string;
  betaName: string;
  deviceLabel: string;
  url: string | null;
  installUrl?: string | null;
  areaUrl: string;
  lang?: BetaEmailLang;
}): string {
  const lang = d.lang ?? "it";
  const en = lang === "en";
  const join = en ? "Join the beta" : "Unisciti alla beta";
  const install = en ? "Install the app" : "Installa l'app";
  return shell(`
    <p style="margin:0 0 4px;font-size:26px;font-weight:700;color:${TEXT};line-height:1.2;">${en ? "You're in ✅" : "Sei dentro ✅"}</p>
    <p style="margin:12px 0 24px;font-size:15px;color:${MUTED};line-height:1.6;">
      ${en ? "Hi" : "Ciao"} <strong style="color:${TEXT};">${escapeHtml(d.firstName)}</strong>, ${en ? "we've approved your request for" : "abbiamo approvato la tua richiesta per"}
      <strong style="color:${TEXT};">${escapeHtml(d.betaName)}</strong> ${en ? "on" : "su"} ${escapeHtml(d.deviceLabel)}.
      ${en ? "You'll find the full instructions in your beta area." : "Trovi le istruzioni complete nella tua area beta."}
    </p>
    ${d.url ? joinButton(d.url, d.installUrl ? `1 · ${join}` : join) : ""}
    ${d.installUrl ? `<p style="margin:0 0 24px;font-size:14px;color:${MUTED};">${en ? "Then install the app from here:" : "Poi installa l'app da qui:"} <a href="${escapeHtml(d.installUrl)}" style="color:${PYNK};font-weight:600;">2 · ${install}</a></p>` : ""}
    <p style="margin:0;font-size:14px;"><a href="${escapeHtml(d.areaUrl)}" style="color:${PYNK};font-weight:600;">${en ? "Open your beta area" : "Apri l'area beta"}</a></p>
  `, lang);
}
