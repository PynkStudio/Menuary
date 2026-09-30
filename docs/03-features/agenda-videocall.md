# Feature: Agenda e videocall (`@pynkstudio/agendaapp`)

- **Stato:** in produzione dal 2026-09-30 in modalità telefonica (migration applicata, segreto impostato, deploy fatto); videocall in attesa del server LiveKit (bacheca in § 7)
- **Pacchetto:** repo pubblica [PynkStudio/pynkstudio-agendaapp](https://github.com/PynkStudio/pynkstudio-agendaapp) (locale: `../pynkstudio-agendaapp`), tag `v0.1.0`, installato come tarball del tag. Documentazione del pacchetto: vault Obsidian nella sua `docs/`
- **Montaggio nel sito:** `src/lib/agenda-runtime.ts`
- **Data:** 2026-09-30
- **Decisione:** [[adr-0013-agenda-videocall-pacchetto-livekit]]

> Separo ciò che è **dedotto dal codice** da ciò che è **da verificare**. Tutto ciò che dipende dal server LiveKit è "Da verificare" finché il server non esiste.

---

## 0. Istruzioni per l'IA che lavora su questo progetto

Stesse regole della bacheca di [[blog-editoriale]] § 0: prima di toccare agenda o videocall leggi la bacheca (§ 7) e riparti dal primo lavoro non completato; stati ⬜ / 🟡 / 🔵 / ✅; `tsc`+`lint`+test portano a 🔵, non a ✅; ✅ solo con prova sul campo; aggiorna la bacheca nello stesso intervento del codice.

Due repo coinvolte:

- **Il pacchetto** (`../pynkstudio-agendaapp`): leggi il suo `AGENTS.md`. Niente valori PynkStudio nel pacchetto. `dist/` è committato; ogni release è un tag `vX.Y.Z`.
- **Questo sito**: consuma il pacchetto come dipendenza tarball, come `@pynkstudio/mailapp`. Hook, copy, stili e CRM restano qui.

---

## 1. Perché

Chi prenota una call dalle pagine PynkStudio (`/prenota-call`, landing «IA in azienda», CTA da consulenza/AI governance/soluzioni) finiva in una call telefonica gestita da codice scritto dentro questo sito (`src/lib/pynkstudio/booking.ts`, orari Roma e lun-ven cablati). Serve:

1. fare la call in **videocall**, su un sistema nostro (LiveKit self-hosted), senza Zoom/Meet;
2. **riusare** agenda e videocall in altri progetti, quindi fuori da questo repo, come la posta (`mailapp`).

---

## 2. Cosa fa il pacchetto (dedotto dal codice)

| Entrypoint | Contenuto |
|---|---|
| `/core` | tipi, fusi orari con ora legale (solo `Intl`), generazione slot da finestre settimanali |
| `/server` | `createAgendaServer`: disponibilità, prenotazione, annullo, esiti, blocchi, promemoria, token video, webhook |
| `/http` | handler `Request → Response` (availability, book, videoToken, guestCancel, hostList, hostUpdate, livekitWebhook) |
| `/video/server` | token d'accesso LiveKit e verifica webhook su `node:crypto` |
| `/video/react` | `AgendaVideoCall`: prova dispositivi + conferenza (`@livekit/components-react`) |
| `/react` | `useAgendaBooking` (hook headless), `AgendaBookingWidget` (UI neutra) |
| `/migrations/0001_agenda_schema.sql` | `agenda_bookings`, `agenda_blocks`, `agenda_video_events` |

Garanzie:

- **Doppia prenotazione impossibile** anche in concorrenza: vincolo di esclusione Postgres su `(scope, calendar, [starts_at, blocked_until))` (estensione `btree_gist`).
- **Link ospite** = HMAC di `AGENDA_SIGNING_SECRET` + id prenotazione, non salvato: il promemoria rigenera lo stesso link. Cambiare il segreto invalida tutti i link già inviati. L'URL lo costruisce la config `guestUrl`; il pacchetto lo passa a `onBookingCreated` e lo ricostruisce con `guestUrlFor`. **Il pacchetto non spedisce email: metterlo nella conferma è compito del sito** (regola scritta nel pacchetto, `docs/03-features/link-ospite-ed-email.md`).
- **Stanza video**: l'ospite entra da 10 min prima dell'inizio a 30 min dopo la fine; lo staff (siteadmin) quando vuole prima della chiusura, con `roomAdmin`.
- **Webhook LiveKit** idempotente (id evento); `room_finished` segna la call «conclusa» se qualcuno è entrato.

---

## 3. Come è montato in questo sito (dedotto dal codice)

| Cosa | Dove |
|---|---|
| Runtime, tipo evento `call-20` (20 min, lun-ven 10-18 Europe/Rome, 14 giorni), hook CRM/email/WhatsApp/push | `src/lib/agenda-runtime.ts` |
| Disponibilità e prenotazione (URL invariati) | `src/app/api/tenant/[tenantId]/bookings/route.ts`, `.../availability/route.ts` |
| Token video, annullo ospite | `.../bookings/video-token/route.ts`, `.../bookings/cancel/route.ts` |
| Agenda admin (lista, annulla, conclusa, non presentato) | `src/app/api/admin/pynkstudio/bookings/route.ts`, `src/components/admin-pynkstudio/pynk-agenda.tsx` |
| Webhook LiveKit | `src/app/api/agenda/livekit-webhook/route.ts` |
| Promemoria 20 min prima | `src/app/api/cron/pynkstudio-call-reminders/route.ts` (stesso pg_cron di prima) |
| Link email `/it/videocall/[id]/accedi?t=…`: verifica il token, lo salva nel cookie httpOnly `agenda_guest_<id>` e reindirizza (303) all'URL pulito, così GA4/Meta/OpenAI non registrano la credenziale | `src/app/videocall/[bookingId]/accedi/route.ts` |
| Pagina ospite `/it/videocall/[id]` (noindex): legge il token dal cookie | `src/app/videocall/[bookingId]/page.tsx`, `src/components/tenants/pynkstudio/pages/videocall.tsx` |
| Stanza lato staff | `src/app/admin-pynkstudio/agenda/call/[bookingId]/page.tsx`, `src/components/admin-pynkstudio/pynk-agenda-call.tsx` |
| Flusso di prenotazione | `prenota-call.tsx` e `IaCallPicker` in `ia-in-azienda.tsx` usano `useAgendaBooking`; giorni calcolati dal server in ora di Roma |
| Email con bottone «Entra nella videocall» (conferma via hook con `guestUrl`, promemoria con `guestUrlFor`) | `src/lib/pynkstudio/email-templates.ts`, `src/lib/agenda-runtime.ts`, cron promemoria |
| Stili (UI LiveKit vestita con i token PynkStudio) | `src/styles/tenants/pynkstudio.css` (`.pynk-videocall-*`, `.pynk-admin-call-*`, `.pynk-agenda-modal-*`) |
| Migration + copia dati da `consultation_bookings` (stessi id) + FK CRM ripuntata | `supabase/migrations/20261001_agendaapp_schema.sql` |

**Fallback telefonico**: finché `LIVEKIT_URL`/`LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` non sono impostate, `call-20` ha `location: "phone"` e tutto si comporta come prima (niente link video nelle email). Appena impostate, le **nuove** prenotazioni diventano videocall; quelle già prese restano telefoniche.

`src/lib/pynkstudio/booking.ts` non è più usato dalle rotte: resta finché la migrazione non è verificata, poi va rimosso (voce D3).

---

## 4. Variabili d'ambiente (solo nomi)

| Variabile | Obbligatoria | Note |
|---|---|---|
| `AGENDA_SIGNING_SECRET` | **sì**, senza le rotte di prenotazione rispondono 500 | ≥ 16 caratteri, casuale. Non cambiarla dopo il lancio |
| `LIVEKIT_URL` | per la videocall | `wss://<dominio del server LiveKit>` |
| `LIVEKIT_API_KEY` | per la videocall | generata da `deploy/livekit/bootstrap.sh` |
| `LIVEKIT_API_SECRET` | per la videocall | idem |

---

## 5. Server LiveKit

`../pynkstudio-agendaapp/deploy/livekit/`: compose (LiveKit + Caddy per il TLS) e `bootstrap.sh` che genera chiavi e `livekit.yaml` con il webhook verso `https://pynkstudio.eu/api/agenda/livekit-webhook`.

- Serve un host con **IP pubblico** e UDP aperto (80/443/7881 TCP, 3478 UDP, 50000-60000 UDP). Il tunnel Cloudflare usato per Documenso **non** porta il media WebRTC.
- Dominio proposto: `video.pynkstudio.eu` — **da confermare**.
- TURN/TLS su 443 non è configurato: reti aziendali molto chiuse potrebbero non collegarsi. **Da verificare** al collaudo.

---

## 6. Rischi noti

- I template WhatsApp `booking_confirm` / `call_reminder` sono approvati su Twilio con testo fisso: se dicono «ti chiameremo», per le videocall il messaggio è fuorviante. **Da verificare** il testo; eventualmente nuovi template con il link.
- Il promemoria marca la prenotazione **prima** di inviare: un invio fallito non viene ritentato (come prima, best-effort).

---

## 6b. Audit di produzione (2026-09-30)

Verificato:

- `next build` di produzione riuscito (su copia del working tree), tutte le route agenda compilate; `tsc` e lint puliti.
- Migration eseguita **in una transazione annullata** sul DB di produzione: crea le 3 tabelle, installa `btree_gist`, copia le 3 prenotazioni esistenti, il vincolo rifiuta due prenotazioni sovrapposte (23P01), FK CRM ripuntata con i 2 riferimenti validi. Dopo il test il DB è risultato invariato.
- Server locale di produzione con segreto di prova: giorni prenotabili corretti, altro tenant → 404, agenda admin / token staff senza sessione → 401, webhook con LiveKit spento → 503, link `/accedi` con token valido → cookie + redirect pulito, token errato → nessun cookie, token mai presente nell'HTML.
- Nessun CSP / Permissions-Policy che blocchi camera, microfono o `wss://`.

Trovato e corretto: con il consenso, i tracker inviavano l'URL completo della pagina videocall col token → introdotta la route `/accedi` a cookie.

Stato verso la produzione (bloccanti in ordine):

1. **D1 migration** prima del deploy: senza tabelle la prenotazione risponde 500.
2. **D2 `AGENDA_SIGNING_SECRET`** su Vercel (assente al 2026-09-30): senza, `/prenota-call` non mostra giorni, il cron promemoria va in errore ogni minuto, `/videocall` dà 500.
3. Deploy del sito.

Non bloccanti:

- LiveKit (V1) non attivo: le call restano telefoniche, flusso identico a prima.
- WhatsApp: `TWILIO_WA_CONFIRM_SID`, `TWILIO_WA_REMINDER_SID` e `TWILIO_AUTH_TOKEN` non sono su Vercel, quindi oggi nessun WhatsApp di call parte (già così prima di questo lavoro).
- Endpoint pubblico di prenotazione senza rate limiting né captcha (già così prima): una raffica di prenotazioni false potrebbe riempire l'agenda.
- Un URL `/videocall/<id>?t=` scritto a mano viene reindirizzato lato client (meta refresh): i tracker potrebbero vederlo. I link inviati passano sempre da `/accedi`.

## 7. Bacheca

| # | Lavoro | Stato | Note |
|---|---|---|---|
| P1 | Pacchetto: core slot/fusi, server, handler HTTP | 🔵 in test | 19 test vitest verdi, build + import Node ESM ok. Mai eseguito contro Postgres reale |
| P2 | Pacchetto: token e webhook LiveKit | 🔵 in test | Testati con firme generate in test; mai contro un server LiveKit reale |
| P3 | Pacchetto: `AgendaVideoCall`, `useAgendaBooking`, widget neutro | 🔵 in test | Typecheck ok; mai renderizzati in browser |
| P4 | Pubblicare repo GitHub `PynkStudio/pynkstudio-agendaapp`, tag `v0.1.0` | ✅ completata | 2026-09-30: repo pubblica creata, tag `v0.1.0`, tarball scaricabile; `package.json` punta al tarball e `tsc` del sito passa con il pacchetto installato da GitHub |
| P5 | Documentazione Obsidian del pacchetto, README, nessun riferimento a progetti | ✅ completata | `docs/` del pacchetto (START-HERE, architettura, modello dati, feature, 4 ADR, integrazioni, processi, backlog), `AGENTS.md`, `CHANGELOG.md`; scansione testo senza riferimenti a PynkStudio/Menuary oltre al nome del pacchetto |
| S1 | Runtime e rotte nel sito | 🔵 in test | 2026-09-30, in produzione: giorni e slot reali da `/api/tenant/pynkstudio/bookings/availability`, agenda admin 401 senza sessione, `/accedi` → 303 all'URL pulito, webhook 503 (LiveKit spento). Manca una prenotazione vera end-to-end |
| S6 | Cron promemoria raggiungibile | ✅ completata | Bug preesistente: pg_cron chiama in POST, la route esponeva solo GET → 405 a ogni giro, promemoria mai inviati. Aggiunto `POST`; dal 2026-09-30 15:44 UTC risponde 200 `{"ok":true,"reminded":0}` (verificato in `net._http_response`) |
| S2 | Pagine videocall ospite e staff, stili | 🔵 in test | Da aprire in browser con LiveKit attivo |
| S3 | `prenota-call` e landing IA sul nuovo hook | 🔵 in test | Da provare una prenotazione reale |
| S4 | Email con link videocall, pagina grazie | 🔵 in test | 2026-09-30: verificato generando l'HTML dal flusso reale (createBooking → hook → `bookingConfirmHtml`): bottone e link presenti, stesso link nel promemoria, token valido. Manca un'email vera ricevuta (serve LiveKit attivo: senza env la call è telefonica e il link non viene messo) |
| D1 | Migration `20261001_agendaapp_schema.sql` applicata | ✅ completata | 2026-09-30 via MCP `apply_migration` (nome `agendaapp_schema`). Verificato sul DB: 3 tabelle con RLS, `btree_gist`, vincolo `agenda_bookings_no_overlap`, 3 righe copiate da `consultation_bookings`, FK `pynkstudio_crm_last_booking_id_fkey` → `agenda_bookings` |
| D2 | `AGENDA_SIGNING_SECRET` su Vercel | 🔵 in test | 2026-09-30: impostata su **Production** (sensitive, generata casuale, valore non salvato altrove). **Preview mancante**: la CLI non la accetta per tutti i branch in modo non interattivo; da aggiungere a mano (`vercel env add AGENDA_SIGNING_SECRET preview`). Senza, nelle preview prenotazione e videocall rispondono 500. Da confermare col deploy di produzione |
| D3 | Rimuovere `src/lib/pynkstudio/booking.ts` e la tabella `consultation_bookings` | ⬜ da iniziare | Solo dopo D1 verificata in produzione |
| V1 | Server LiveKit su VPS + DNS + env `LIVEKIT_*` | ⬜ da iniziare | Scelta dell'host e del dominio: utente |
| V2 | Collaudo end-to-end: prenota → email → entra ospite + staff → webhook → «conclusa» | ⬜ da iniziare | Dopo V1 |
| V3 | Template WhatsApp coerenti con la videocall | ⬜ da iniziare | Vedi § 6 |
| F1 | Link «annulla» per l'ospite nella pagina videocall/email | ⬜ da iniziare | L'endpoint `.../bookings/cancel` esiste già |
| F2 | Gestione blocchi (ferie) dall'agenda admin | ⬜ da iniziare | API nel pacchetto: `addBlock`/`listBlocks`/`removeBlock` |
| F3 | Rate limiting / anti-bot sull'endpoint di prenotazione | ⬜ da iniziare | Vedi § 6b |
| S5 | Token ospite fuori dall'URL tracciato (`/accedi` + cookie) | 🔵 in test | Provato su build di produzione locale; da riprovare in produzione con un link vero |
