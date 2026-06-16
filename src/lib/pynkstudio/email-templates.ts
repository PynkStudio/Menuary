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

function shell(body: string): string {
  return `<!DOCTYPE html>
<html lang="it">
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
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.6);font-weight:300;">Strategia · Comunicazione · Organizzazione</p>
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
            Hai domande? Rispondi a questa email oppure scrivici a
            <a href="mailto:amministrazione@pynkstudio.it" style="color:${PYNK};text-decoration:none;">amministrazione@pynkstudio.it</a>
          </p>
          <p style="margin:10px 0 0;font-size:11px;color:#b09ab0;">
            PYNK STUDIO · <a href="https://pynkstudio.it" style="color:#b09ab0;">pynkstudio.it</a>
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
};

export function bookingConfirmHtml(d: BookingEmailData): string {
  const n = escapeHtml(d.name);
  const slot = escapeHtml(d.slotLabel);
  const topic = escapeHtml(d.topic);
  const phone = escapeHtml(d.phone);

  return shell(`
    <p style="margin:0 0 4px;font-size:26px;font-weight:700;color:${TEXT};line-height:1.2;">La tua call è confermata ✅</p>
    <p style="margin:12px 0 28px;font-size:15px;color:${MUTED};line-height:1.6;">
      Ciao <strong style="color:${TEXT};">${n}</strong>, abbiamo registrato la tua prenotazione.
      Ti chiamiamo noi all'orario indicato qui sotto.
    </p>

    <!-- Detail card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${PYNK_LIGHT};border:1px solid ${BORDER};border-radius:10px;padding:20px 24px;margin-bottom:28px;">
      <tr><td>
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${detailRow("📅 Quando", `${slot} <span style="color:${MUTED};font-weight:400;font-size:12px;">(ora italiana)</span>`)}
          ${detailRow("⏱ Durata", "20 minuti")}
          ${detailRow("📌 Argomento", topic)}
          ${detailRow("📞 Telefono", phone)}
        </table>
      </td></tr>
    </table>

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
          ${detailRow("📞 Telefono", phone)}
        </table>
      </td></tr>
    </table>

    <p style="margin:0;font-size:14px;color:${MUTED};line-height:1.7;">
      Tieniti pronto — siamo noi a chiamarti al numero indicato.
    </p>
    <p style="margin:24px 0 0;font-size:15px;color:${TEXT};">
      A tra poco! 📞<br/>
      <span style="color:${PYNK};font-weight:600;">Il team PYNK STUDIO</span>
    </p>
  `);
}
