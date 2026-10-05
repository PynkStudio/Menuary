# Integrazioni attive

> Fonte: route in `src/app/api/`, cartelle in `src/lib/`, nomi `process.env.*` referenziati nel codice. **Dedotto dal codice.** I valori reali delle env non sono e non devono essere riportati qui.

Per documentare in dettaglio una singola integrazione usa [[integration-template]].

## Elenco integrazioni rilevate

| Servizio | Tipo | Evidenza nel codice (route / lib / env) |
|---|---|---|
| **Supabase** | Database / Auth / RLS | `src/lib/supabase/`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Twilio** | WhatsApp / SMS | `src/lib/twilio/`, `webhooks/twilio/whatsapp`, `TWILIO_*` (incl. content SID template `TWILIO_WA_*`) |
| **Retell** | Assistente telefonica IA | `src/lib/retell/`, `api/retell/inbound`, `webhooks/retell`, `RETELL_API_KEY`, `RETELL_WEBHOOK_SECRET` |
| **Stripe** | Pagamenti + Connect | `payments/stripe/*`, `webhooks/stripe`, `admin/integrations/stripe`, `STRIPE_*_WEBHOOK_SECRET` |
| **Bunq** | Pagamenti (payment request) | `payments/bunq/request`, `payments/bunq/webhook`, `BUNQ_API_TOKEN`, `BUNQ_SANDBOX`, … |
| **HubRise** | Sincronizzazione POS | `integrations/hubrise/*`, `webhooks/hubrise`, `HUBRISE_OAUTH_*`, `HUBRISE_WEBHOOK_SECRET` |
| **Google Business Profile** | Recensioni, sedi, orari, reserve | `gestione/google/*`, `google-reserve/[tenantId]`, `auth/google-business/callback`, `GOOGLE_MY_BUSINESS_*` |
| **Google Places** | Dati luoghi | `GOOGLE_PLACES_API_KEY` |
| **Google Search Console (Site Verification)** | Verifica dominio custom di un contratto (check "Attiva SEO"), a livello di piattaforma (non per tenant) | `src/lib/google/platform-oauth.ts`, `src/lib/google/site-verification.ts`, `auth/google-platform/callback`, `admin/google-connection/*`, `GOOGLE_PLATFORM_CLIENT_ID`, `GOOGLE_PLATFORM_CLIENT_SECRET`, `GOOGLE_PLATFORM_REDIRECT_URI`. Dettagli in [[openseo-search-console]] |
| **OpenSEO** | Metriche SEO (keyword, rank tracking, audit) | Pianificato, non ancora deployato — istanza self-hosted separata da questa repo (`github.com/every-app/open-seo`). Dettagli e stato in [[openseo-search-console]] |
| **Google Ads** | Gestione campagne/budget per tenant | Pianificato, nessun codice ancora — mancano token sviluppatore e account MCC (da richiedere). Dettagli, prerequisiti e ownership in [[openseo-search-console]] e [[adr-0008-ownership-proprieta-seo-ads]] |
| **Documenso** | Firma contratti | `webhooks/documenso`, `DOCUMENSO_*` (cloud + self-hosted, per-vertical) |
| **Resend** | Email transazionali | `email/send`, `webhooks/email/inbound`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` |
| **@pynkstudio/mailapp** | Pacchetto posta (UI + query + rotte Next) | dipendenza tarball GitHub `PynkStudio/pynkstudio-mailapp`, `src/lib/mailapp-runtime.ts`, `src/lib/mailapp-brands.ts`. Nessuna env propria: usa quelle di Resend |
| **@pynkstudio/agendaapp** | Pacchetto agenda + videocall (slot, prenotazioni, promemoria, stanze LiveKit) | dipendenza tarball GitHub `PynkStudio/pynkstudio-agendaapp` (tag `v0.4.0`, vedi [[agenda-videocall]]), `src/lib/agenda-runtime.ts`, `AGENDA_SIGNING_SECRET` |
| **Calendari esterni** (via agendaapp) | Occupati dello staff per l'agenda (lettura) e inserimento delle call assegnate nel calendario scelto (Google, Outlook/Microsoft 365, Apple iCloud CalDAV); link ICS solo lettura | `AGENDA_CREDENTIALS_KEY` (impostata), `AGENDA_GOOGLE_CLIENT_ID/SECRET`, `AGENDA_MICROSOFT_CLIENT_ID/SECRET` (da creare); callback `https://admin.pynkstudio.eu/api/agenda/calendar/callback/{google,microsoft}`. Vedi [[agenda-videocall]] § 3b |
| **LiveKit** (Cloud) | Server videocall (SFU WebRTC) — progetto LiveKit Cloud; il deploy self-hosted del pacchetto resta come alternativa | `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`; webhook `api/agenda/livekit-webhook`; deploy in `deploy/livekit/` del pacchetto. Attivo in produzione dal 2026-09-30; senza env le call tornano telefoniche. Webhook da configurare nel progetto LiveKit su `https://pynkstudio.eu/api/agenda/livekit-webhook`. Vedi [[adr-0013-agenda-videocall-pacchetto-livekit]] |
| **Web Push (VAPID)** | Notifiche push | `src/lib/push/`, `push/subscribe`, `push/vapid-public-key`, `WEB_PUSH_PRIVATE_KEY`, `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` |
| **OpenAI** | Funzioni IA (menu, WhatsApp lead) | `ai/*`, `OPENAI_API_KEY`, `OPENAI_*_MODEL` |
| **OpenWA** | Worker WhatsApp | `scripts/openwa/`, script `whatsapp:worker`, `Dockerfile.openwa` |
| **QZ Tray** | Stampa comande USB (ponte locale) | dipendenza `qz-tray`, `src/lib/printing/`, `api/gestione/printers`, servizio locale sul PC cassa (`wss://localhost`) |
| **SUNMI Cloud Printer** | Stampa comande cloud (server-side, API V2 push diretto) | `src/lib/printing/sunmi-cloud.ts`, `src/lib/printing/dispatch.ts`, `SUNMI_CLOUD_APP_ID`, `SUNMI_CLOUD_APP_KEY`, `SUNMI_CLOUD_API_BASE`, `SUNMI_CLOUD_SHOP_ID` |
| **MapLibre** | Mappe | dipendenza `maplibre-gl`, `tenant/[tenantId]/map` |
| **Vercel Analytics** | Analytics senza cookie + eventi `conversion_*` | dipendenza `@vercel/analytics`; eventi inviati da `trackConversion()` in `src/lib/tracking/client.ts` |
| **Google Analytics 4 / Google Ads / Meta Pixel / OpenAI Ads** | Misurazione visite e conversioni delle campagne, **solo dopo consenso** | Modulo tracking (`src/lib/tracking/`, `src/components/modules/tracking/`). Siti marketing: env `TRACKING_<BRAND>_GA4_ID`, `TRACKING_<BRAND>_GOOGLE_ADS_ID`, `TRACKING_<BRAND>_GOOGLE_ADS_<CONVERSIONE>_LABEL` (conversione = `LEAD`, `BOOKING`, `ORDER`, `CONTACT`), `TRACKING_<BRAND>_META_PIXEL_ID`, `TRACKING_<BRAND>_OPENAI_PIXEL_ID` (Measurement Pixel `oaiq` degli annunci ChatGPT, script `https://bzrcdn.openai.com/sdk/oaiq.min.js`) con `<BRAND>` = `MENUARY`, `BIZERY`, `ORPHEO`. Tenant: campo `tracking` in `tenant-registry.ts`. Dettagli in [[adr-0011-tracciamento-condiviso-con-consenso]] |
| **Slabbby** | Wishlist cross-negozio (widget di terze parti) | `src/components/core/slabbby-script-gate.tsx`, `src/components/modules/shop/slabbby-wishlist-btn.tsx`, feature flag `slabbby`. Nessuna env: lo script è pubblico (`https://slabbby.com/widget.js`). Dettagli e limiti in [[moduli-piattaforma]] |
| **PerX** (bridge platform-admin) | Portale `admin.pynkstudio.eu/perx` verso il backend FastAPI di PerX (repo separata) | `src/lib/perx/client.ts`, `admin-pynkstudio/perx/*`, `PERX_ADMIN_API_URL`, `PERX_ADMIN_API_KEY` (server-only, mai `NEXT_PUBLIC_`). Dettagli in `docs/perx-integration.md` |

## Canali WhatsApp

Da `TENANT_CUSTOMER_SERVICE_WHATSAPP.md`: modulo WhatsApp basato su Twilio. Endpoint supporto tenant: `POST /api/webhooks/whatsapp/tenant-support` (secret `TENANT_SUPPORT_WHATSAPP_SECRET`, fallback `WHATSAPP_WEB_BRIDGE_SECRET`). Esistono inoltre `webhooks/whatsapp`, `webhooks/whatsapp/session-status`, `whatsapp/inbound`.

## Stripe in ambiente demo

Da memoria di progetto e codice: su host `demo.*` Stripe va usato **sempre in sandbox** (`shouldUseStripeSandbox()`), mai dedotto direttamente da `isDemoHostname`. **Da verificare** la posizione esatta dell'helper nel codice prima di farvi affidamento.

## QZ Tray — stampa comande

Modulo `printStations` ("Stampanti e reparti"). Il ponte verso la stampante è **QZ Tray**, un servizio gratuito installato sul **PC cassa** (Windows/Mac/Linux) che espone le stampanti dell'OS — incluse quelle **USB già installate via driver** — su un WebSocket locale (`wss://localhost:8181`). La web app (pannello gestione / display cucina) vi si connette dal browser e invia la comanda in **ESC/POS raw**.

- Codice ponte client: `src/lib/printing/qz-client.ts` (import dinamico, solo client).
- Comanda ESC/POS: `src/lib/printing/escpos.ts`, `src/lib/printing/comanda.ts`.
- Config per tenant/sede: tabella `tenant_printers`, API `src/app/api/gestione/printers/route.ts`, loader `src/lib/printing/config.ts`.
- UI: `src/components/gestione/printers-panel.tsx` dentro la pagina **Cassa** della gestione.
- **Stato (QZ/USB):** config + connessione + stampa di prova **e stampa automatica** delle comande. La postazione di stampa è il watcher in `src/components/gestione/comanda-auto-print-watcher.tsx`, montato nella pagina **Operativo → Ordini** (`src/app/operativo/[tenantSlug]/ordini/page.tsx`); legge la coda `GET /api/gestione/printers/queue` (ordini accettati non ancora stampati, dedup via `orders.comanda_printed_at`) ed è agnostica dal canale. Routing multi-stampante per reparto: TODO.

## SUNMI Cloud Printer — stampa comande server-side

Alternativa a QZ per il modulo `printStations` (`tenant_printers.connection = 'sunmi_cloud'`, SN in `device_sn`). La stampante si collega da sola a internet/cloud SUNMI: **nessun PC, nessuna pagina aperta**. Usa l'API **SUNMI Cloud Printer V2**, modalità **"Cloud to Cloud" / push diretto** (il contenuto passa da SUNMI, che lo inoltra alla stampante — nessun endpoint di callback lato nostro). Flusso:

1. All'accettazione di un ordine (sito/WhatsApp/Retell) il server chiama `dispatchComandaForOrder` (`src/lib/printing/dispatch.ts`): carica ordine+righe, costruisce l'ESC/POS (`buildComandaEscPos`) e chiama `pushPrintContent` (`src/lib/printing/sunmi-cloud.ts`).
2. `pushPrintContent` invia `POST https://openapi.sunmi.com/v2/printer/open/open/device/pushContent` con il contenuto ESC/POS convertito in **esadecimale (UTF-8)** nel campo `content`; body JSON `{ trade_no, sn, order_type, content, count }`.
3. Auth via **header HTTP**: `Sunmi-Appid`, `Sunmi-Timestamp` (unix 10 cifre), `Sunmi-Nonce` (6 cifre), `Sunmi-Sign = HMAC-SHA256(jsonBody + appid + timestamp + nonce, appkey)` (hex), `Source: openapi`. Successo = risposta `{ code: 1, msg: "success" }`.
4. **Bind**: prima della stampa il SN va associato al nostro channel con `POST /v2/printer/open/open/device/bindShop` `{ sn, shop_id }` (`bindPrinterToShop`). `shop_id` è un intero scelto da noi: unico shop di piattaforma `SUNMI_CLOUD_SHOP_ID` (default `1`), il routing tenant→SN resta in `tenant_printers`. Il bind parte dal pulsante «Collega e stampa prova» (`POST /api/gestione/printers/sunmi-test`, che controlla anche `onlineStatus` e invia un ticket di test) e in automatico nel dispatch se il push risponde `10071704`.
5. **Gate demo** (`isComandaPrintBlockedForHost` in `dispatch.ts`): su host demo la stampa (cloud, QZ, SUNMI POS) avviene solo se il tenant ha **«Backend live»** attivo (`tenant_demo_controls.backend_live`). Con backend spento `/api/orders` crea l'ordine con `comanda_printed_at` già valorizzato, così nessun canale lo stampa (neanche cron/webhook Stripe, che non conoscono l'host); `/api/orders/[id]/confirm` salta il dispatch e il pulsante di prova risponde `demo_backend_off`. Host non demo e canali WhatsApp/Retell: stampa sempre.
6. `trade_no` = id ordine (UUID) senza trattini = 32 hex; funge da chiave dedup lato SUNMI. Dedup nostro via `orders.comanda_printed_at` (prenotato al push, rollback se il push fallisce).

- Env (per-piattaforma, una sola SUNMI partner app): `SUNMI_CLOUD_APP_ID`, `SUNMI_CLOUD_APP_KEY`, `SUNMI_CLOUD_API_BASE` (default `https://openapi.sunmi.com`), `SUNMI_CLOUD_SHOP_ID` (opzionale, default `1`).
- Portale SUNMI: capability **"Cloud Printed"** collegata all'app cloud. In modalità push diretto **non serve** compilare *Order Request Address* né *Device status callback address*; **IP Whitelist vuoto** (IP di uscita Vercel dinamici).
- **Stato:** allineato alla doc autenticata Cloud Printer V2 ([§3 API integration development](https://docs.sunmi.com/en-US/cdixeghjk491/xffdeghjk524)). Primo device reale: Kimos (NT311 80mm, sede Milano Santa Giulia), registrato il 2026-10-03. ⚠️ Stampa reale **da verificare** col pulsante di prova dopo il deploy: da confermare col primo push che la stampante sia bound al channel/shop (errore `10071704 "not belong to this channel"`) e la resa del template ESC/POS su carta 80mm.
- Modalità alternativa non implementata: **"Device to Cloud" / callback** (doc [§4](https://docs.sunmi.com/en-US/cdixeghjk491/xfffeghjk535)) — la stampante scarica da endpoint partner `printTicket/getPrintTicketOrderId|getPrintTicketInfo|updatePrintTicketStatus`, firma **MD5** `MD5(keyvalue + app_key)`, con l'URL base in *Order Request Address*. Da valutare solo se serve non far transitare i dati da SUNMI.
- **Costo/licenza da confermare:** la stampa **silenziosa** in produzione (senza popup di conferma) richiede un certificato di firma QZ commerciale. In dev/unsigned QZ chiede conferma all'utente una volta per origine (`setCertificatePromise`/`setSignaturePromise` oggi non firmati). Nessuna env server dedicata: il ponte è interamente lato browser↔localhost.

## @pynkstudio/mailapp — brand nell'app, non nel pacchetto

Il pacchetto della posta è una dipendenza esterna, installata da un **tag** del repo `PynkStudio/pynkstudio-mailapp` (vedi `package.json`). Il tag va allineato al codice: se una pagina usa un'API introdotta da una versione più recente di quella pinnata, il build passa in locale (dove il pacchetto può essere installato a mano) e **fallisce su Vercel**, che installa quello che dice `package.json`.

Dalla **0.5.0** il pacchetto non conosce nessun brand. L'elenco delle identità di posta vive qui:

- `src/lib/mailapp-brands.ts` — `MAIL_BRANDS` (id, label, domini, indirizzi, tema), più fallback, casella condivisa e ruoli. **È l'unico posto da toccare per aggiungere un brand**: non serve più una migrazione per allargare il vincolo su `brand`.
  - **PynkStudio invia solo da `pynkstudio.eu`** (dal 2026-10-05): è l'unico dominio PynkStudio verificato su Resend, un mittente `@pynkstudio.it` viene rifiutato con `403 validation_error`. `fromAddress` è `hello@pynkstudio.eu` e `website` (che dà anche il dominio delle firme automatiche) è `pynkstudio.eu`; `.it` e `.com` restano in `domains` solo per riconoscere la posta in arrivo.
- `src/lib/mailapp-runtime.ts` — `configureMailappRuntime({ brands, … })`: passa i brand al runtime server e delega all'app la risoluzione del mittente, l'invio e i template di marketing (dalla 0.5.0 il pacchetto non li contiene più).
- Le pagine passano `brands={MAIL_BRANDS}` a `<MailApp>`: `admin-pynkstudio/mailapp`, `admin/inbox`, `gestione/[tenantSlug]/mail`.
- `src/instrumentation.ts` — importa `mailapp-runtime` all'avvio di ogni istanza Node. Le server action del pacchetto (aggiorna, assegna, collega lead, archivia…) possono arrivare su un'istanza fredda prima che la pagina sia valutata: senza questa registrazione fallivano con `runtime is not configured` (errore ricorrente su `/admin-pynkstudio/mailapp` fino al 2026-10-05). L'import nelle pagine e nelle rotte resta.
- **0.5.1** (2026-10-05) — i popover Assegna/Lead del dettaglio mail sono in portal su `<body>` con posizione fixed (`FloatingPanel`), quindi non vengono più tagliati dal pannello di dettaglio. È pinnata al **commit** `20b978c` (`archive/<sha>.tar.gz`) e non al tag: il push del tag `v0.5.1` dalla sessione è stato bloccato. **Da fare:** creare il tag `v0.5.1` su quel commit e riportare `package.json` all'URL `refs/tags/v0.5.1`.
- **CSS del pacchetto.** I componenti di mailapp sono scritti in classi Tailwind ma il pacchetto non porta CSS: `tailwind.config.ts` scansiona `node_modules/@pynkstudio/*/dist/**/*.js`. Senza, le classi presenti solo nel pacchetto non venivano generate (77 al 2026-10-05: posizione dei popover Assegna/Lead, altezza massima e sfondo delle modali di scrittura, bordi e padding della toolbar), da cui popover tagliati e modali più alte dello schermo.

**Schema database.** Il pacchetto porta le proprie migration in `migrations/`, ma descrivono anche il *mailbox runtime* (`profiles`, `user_roles`, `admin_email_aliases`, ricerca full-text), un percorso che questo progetto **non usa**: qui si passa dalle rotte Next e dall'identità `siteadmin`. Applicate su manuary.it il 2026-09-02, ricopiate in `supabase/migrations/`:

- `20260902_mailapp_brand_free_text.sql` — il CHECK su `brand` diventa `length(brand) > 0`.
- `20260902_mailapp_webhook_idempotency.sql` — `inbound_emails.resend_email_id` e `email_tracking_events.provider_event_id` con indici unici parziali. Servono al webhook 0.5.0, che fa `upsert(onConflict)` su quelle chiavi: senza, ogni ritentativo di Svix duplicava mail e notifica push.
- `20261003120000_mailapp_webhook_idempotency_full_index.sql` — sostituisce i due indici parziali con indici unici pieni. `on conflict (col)` senza predicato non riconosce un indice parziale (errore 42P10): dal 2026-09-02 al 2026-10-03 il webhook inbound rispondeva 500 e nessuna mail ricevuta veniva salvata. Le mail di quel periodo restano su Resend: vanno recuperate con un replay del webhook o rileggendole dall'API `/emails/receiving`.

**Non applicate** (e non applicabili così come sono, perché lo schema qui è diverso): `20260903_mailbox_runtime_schema.sql` e `20260905_mail_fulltext_search.sql` del pacchetto. Riguardano il mailbox runtime: la prima ridefinisce `push_subscriptions` con una forma incompatibile con quella di questo progetto e dipende da `profiles`/`user_roles`, la seconda genera una colonna su `sent_emails.text_body`, che qui non esiste. **Da verificare** se e quando serviranno: oggi nessun codice in uso le richiede.

## Web Push (VAPID) — modello target riusabile

Infrastruttura unica per tutte le notifiche push del portale (tenant e admin piattaforma). Punto d'ingresso: `sendWebPushTo(target, payload)` in `src/lib/push/send.ts` (con wrapper `sendWebPush(tenantId, payload)` e `sendWebPushToSiteadmin(siteadminId, payload)` per compatibilità/leggibilità). Nessun-op sicuro se `WEB_PUSH_PRIVATE_KEY`/`NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` non sono configurate; le subscription morte (404/410) vengono rimosse dal DB a ogni invio.

- **Tabella** `push_subscriptions`: una riga per dispositivo/browser, legata a `tenant_id` (flussi tenant: agenda, ordini operativi, mail) **oppure** `siteadmin_id` (flussi admin piattaforma, es. mail assegnate). Vincolo: almeno uno dei due valorizzato. Colonne accessorie riusabili da qualsiasi feature: `device_id` (id dispositivo lato client, per targeting per-dispositivo senza account) e `page_url` (pagina da cui ci si è iscritti, fallback del click-through quando il payload non specifica `url` — utile perché i portali gestione hanno più forme di URL pubblico a seconda del dominio del tenant).
- **Registrazione** (`POST /api/push/subscribe`): body `{ scope: "tenant", tenantId } | { scope: "siteadmin" }` + `endpoint`/`keys` della subscription browser, più `deviceId`/`pageUrl` opzionali. Per `scope: "siteadmin"` l'id non è mai preso dal client: viene derivato server-side dall'utente autenticato (`siteadmin.user_id = auth.uid()`). Retrocompatibile: se `scope` è assente ma `tenantId` è presente, si assume `"tenant"` (usato da `push-enable-toggle.tsx` di PynkStudio, non toccato).
- **Rimozione** (`POST /api/push/unsubscribe`): body `{ endpoint }`, cancella la subscription del dispositivo per l'utente autenticato.
- **Hook client riusabile**: `usePushSubscription({ swPath, target })` in `src/lib/push/use-push-subscription.ts` — incapsula registrazione service worker, richiesta permesso, `PushManager.subscribe()` e chiamata alle route sopra (invia sempre anche `deviceId`/`pageUrl`). Usato da `AdminPushNotifications` (`swPath: "/admin-sw.js"`, `target: { scope: "siteadmin" }`) e da `TenantMailDeviceSettings` (`swPath: "/gestione-sw.js"`, `target: { scope: "tenant", tenantId }`).
- **Device id client**: `getDeviceId()` in `src/lib/push/device-id.ts` — uuid generato una volta e persistito in `localStorage`, riusabile da qualsiasi feature che debba riconoscere "questo dispositivo" senza un account.
- **Service worker per portale**: `public/admin-sw.js` (admin piattaforma), `public/gestione-sw.js` (pannello Gestione tenant, generico per qualsiasi notifica gestione — oggi mail), `public/menuary-sw.js` (alert operativi tenant), `public/pynk-sw.js` (agenda PynkStudio). Stesso contratto payload (`title`, `body`, `url`, `tag`).
- **Targeting filtrato riusabile**: `sendWebPushToSubscriptions(subscriptionIds, payload)` in `send.ts` invia a un elenco esplicito di id subscription — usarla quando una feature deve calcolarsi da sola i destinatari (non "tutto il tenant"/"tutto il siteadmin") invece di duplicare la logica di invio/pulizia subscription morte.
- **Per aggiungere una nuova notifica push admin**: nel punto server dove si verifica l'evento, chiamare `sendWebPushToSiteadmin(siteadminId, { title, body, url, tag })`. Esempio attivo: mail assegnata (webhook `webhooks/email/inbound` all'auto-assegnazione, `assignEmail` in `src/lib/email/inbound-queries.ts` all'assegnazione manuale) → notifica su `/admin/inbox`.
- **Filtri mail per dispositivo lato tenant (senza account)**: tabella `tenant_mail_device_filters` (`tenant_id`, `device_id`, `label`, `local_parts[]`), CRUD in `src/lib/email/mail-device-filters.ts`. Di default ogni dispositivo del tenant riceve la push per **ogni** mail (broadcast su `tenant_id`, nessun filtro configurato). Da **Impostazioni → Questo dispositivo** nel modulo mail (`TenantMailDeviceSettings`) si può assegnare al dispositivo corrente una o più local-part (es. "fatturazione"): questo genera sia il filtro sulla vista **Le mie** sia il filtro sulla push (solo mail per quelle local-part). Risoluzione destinatari: `resolveTenantMailPushTargets(tenantId, toAddresses)` in `mail-device-filters.ts`, chiamata dal webhook inbound insieme a `sendWebPushToSubscriptions`. Nessun sistema di account/profili per il tenant: è un TODO futuro (stesso modello dell'admin piattaforma, con login e assegnazione persistente).
- **Limite iOS**: su iPhone la web app deve essere aggiunta alla schermata Home (iOS 16.4+) e il permesso notifiche va concesso dall'interno della PWA; Safari "in tab" non riceve Web Push.

## Tracciamento campagne e attribuzione lead

- Nessuno script di terze parti parte senza consenso: il banner compare solo sui siti con almeno un ID configurato.
- Stato env al 2026-09-30: **da valorizzare su Vercel** per `MENUARY`. Le campagne attive sono su **OpenAI Ads** (annunci in ChatGPT): serve `TRACKING_MENUARY_OPENAI_PIXEL_ID`, creato in Ads Manager › Conversions. PynkStudio ha GA4 `tracking.ga4Id` e il pixel OpenAI Ads `tracking.openaiPixelId` nel profilo tenant (nessuna env).
- OpenAI Ads: conversioni mappate sugli eventi standard `lead_created` (lead), `appointment_scheduled` (booking), `order_created` (order, importo in centesimi), evento custom `contact`. Il click ID `oppref` viene salvato in `platform_leads.attribution`. La Conversions API server-side (`https://bzr.openai.com/v1/events`) **non è ancora integrata**.
- I lead dei siti marketing salvano la fonte in `platform_leads.attribution` (jsonb: `utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `oppref`, `referrer`, `landing_path`, `captured_at`). Colonna creata in produzione il 2026-09-29 via MCP `apply_migration` e verificata.
- `POST /api/marketing-leads` ha un limite per IP (per istanza) e per email (2 richieste in 15 minuti) e restituisce codici errore stabili (`missing_fields`, `invalid_email`, `rate_limited`, `server_error`) che i form traducono.

- Le landing `/ristoranti/*` aggiungono gli eventi `landing_view`, `landing_cta_click`, `demo_form_open`, `demo_request_sent` e salvano `source = menuary-landing:<slug>` sul lead: vedi [[landing-verticali-ristoranti]] § 4.

## Da confermare

- Quali integrazioni sono effettivamente in produzione vs in setup/sandbox.
- Mappatura integrazione → tenant abilitati.
- Provider Documenso attivo (cloud vs self-hosted) per ciascun verticale: la selezione è guidata da `DOCUMENSO_*_PROVIDER`/URL multipli.

## Collegamenti

- [[endpoint-ia]]
- [[cron-e-processi]]
