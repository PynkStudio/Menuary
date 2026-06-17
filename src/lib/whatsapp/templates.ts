/**
 * Template WhatsApp per PynkStudio — da sottoporre ad approvazione Meta via Twilio Content API.
 *
 * Come creare e sottoporre i template:
 * 1. Vai su console.twilio.com → Messaging → Content Template Builder (o via API Content)
 * 2. Crea i due template qui sotto con lingua "it" e categoria "UTILITY"
 * 3. Clicca "Submit for WhatsApp Approval" per ciascuno
 * 4. Una volta approvati, copia i SID (formato HX...) nelle env:
 *    TWILIO_WA_CONFIRM_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *    TWILIO_WA_REMINDER_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *
 * ─── TEMPLATE 1 — Conferma prenotazione ─────────────────────────────────────
 * Friendly name : pynkstudio_booking_confirm
 * Categoria     : UTILITY
 * Lingua        : it
 * Tipo contenuto: twilio/text
 *
 * Corpo del messaggio:
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ Ciao {{1}}! ✅ La tua call con PYNK STUDIO è confermata.                 │
 * │                                                                          │
 * │ 📅 Quando: {{2}} (ora italiana)                                          │
 * │ ⏱ Durata: 20 minuti                                                     │
 * │ 📌 Argomento: {{3}}                                                      │
 * │                                                                          │
 * │ Ti chiameremo noi al numero registrato. Se hai bisogno di spostare       │
 * │ l'appuntamento, rispondi pure a questo messaggio.                        │
 * │                                                                          │
 * │ A presto! 👋                                                             │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Variabili:
 *   {{1}} = nome cliente        (es. "Maria")
 *   {{2}} = data e ora slot     (es. "lunedì 16 giugno alle 10:20")
 *   {{3}} = argomento della call (es. "Organizzazione interna PMI")
 *
 * ─── TEMPLATE 2 — Promemoria 20 minuti prima ────────────────────────────────
 * Friendly name : pynkstudio_call_reminder
 * Categoria     : UTILITY
 * Lingua        : it
 * Tipo contenuto: twilio/text
 *
 * Corpo del messaggio:
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ Ciao {{1}}! ⏰ La tua call con PYNK STUDIO inizia tra circa 20 minuti.   │
 * │                                                                          │
 * │ 📅 Orario: {{2}} (ora italiana)                                          │
 * │ 📌 Argomento: {{3}}                                                      │
 * │                                                                          │
 * │ Ti chiamiamo noi — tieniti pronto! 📞                                   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Variabili:
 *   {{1}} = nome cliente        (es. "Maria")
 *   {{2}} = data e ora slot     (es. "lunedì 16 giugno alle 10:20")
 *   {{3}} = argomento della call (es. "Organizzazione interna PMI")
 *
 * ─── Variabili d'ambiente necessarie ────────────────────────────────────────
 * TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * TWILIO_WHATSAPP_FROM=whatsapp:+39xxxxxxxxxx   ← numero WhatsApp Business approvato
 * TWILIO_WA_CONFIRM_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   ← dopo approvazione
 * TWILIO_WA_REMINDER_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ← dopo approvazione
 */

export type { WaTemplate } from "./send";
