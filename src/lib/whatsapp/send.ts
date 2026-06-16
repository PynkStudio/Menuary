import twilio from "twilio";

export type WaTemplate = "booking_confirm" | "call_reminder";

// SID dei template Twilio Content API, valorizzati dopo l'approvazione Meta.
const TEMPLATE_SIDS: Record<WaTemplate, string | undefined> = {
  booking_confirm: process.env.TWILIO_WA_CONFIRM_SID,
  call_reminder: process.env.TWILIO_WA_REMINDER_SID,
};

// Normalizza il numero IT verso E.164: aggiunge +39 se manca il prefisso.
function toE164It(phone: string): string {
  const digits = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0039")) return `+${digits.slice(2)}`;
  return `+39${digits}`;
}

/**
 * Invia un messaggio WhatsApp tramite Twilio Content API.
 * No-op silenzioso se le variabili d'ambiente non sono configurate
 * o se il template SID non è ancora stato ottenuto (in attesa di approvazione Meta).
 *
 * @param phone   Numero del destinatario (formato libero IT o E.164).
 * @param template  Chiave del template (da TEMPLATE_SIDS).
 * @param variables  Valori per i placeholder {{1}}, {{2}}, … del template.
 * @returns true se il messaggio è stato inviato, false se saltato.
 */
export async function sendWhatsApp(
  phone: string,
  template: WaTemplate,
  variables: Record<string, string>,
): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const contentSid = TEMPLATE_SIDS[template];

  if (!accountSid || !authToken || !from || !contentSid) {
    if (!contentSid) {
      console.warn(`[whatsapp] template SID non configurato per "${template}" — messaggio saltato`);
    } else {
      console.warn("[whatsapp] credenziali Twilio mancanti — messaggio saltato");
    }
    return false;
  }

  const to = `whatsapp:${toE164It(phone)}`;
  const client = twilio(accountSid, authToken);

  await client.messages.create({
    from,
    to,
    contentSid,
    contentVariables: JSON.stringify(variables),
  });

  return true;
}
