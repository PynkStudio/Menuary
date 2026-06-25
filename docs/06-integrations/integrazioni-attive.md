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
| **Documenso** | Firma contratti | `webhooks/documenso`, `DOCUMENSO_*` (cloud + self-hosted, per-vertical) |
| **Resend** | Email transazionali | `email/send`, `webhooks/email/inbound`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` |
| **Web Push (VAPID)** | Notifiche push | `src/lib/push/`, `push/subscribe`, `push/vapid-public-key`, `WEB_PUSH_PRIVATE_KEY`, `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` |
| **OpenAI** | Funzioni IA (menu, WhatsApp lead) | `ai/*`, `OPENAI_API_KEY`, `OPENAI_*_MODEL` |
| **OpenWA** | Worker WhatsApp | `scripts/openwa/`, script `whatsapp:worker`, `Dockerfile.openwa` |
| **QZ Tray** | Stampa comande USB (ponte locale) | dipendenza `qz-tray`, `src/lib/printing/`, `api/gestione/printers`, servizio locale sul PC cassa (`wss://localhost`) |
| **SUNMI Cloud Printer** | Stampa comande cloud (server-side) | `src/lib/printing/sunmi-cloud.ts`, callback `api/printing/sunmi/pull`, `SUNMI_CLOUD_APP_ID`, `SUNMI_CLOUD_APP_KEY`, `SUNMI_CLOUD_API_BASE`, `SUNMI_CLOUD_PUSH_PATH` |
| **MapLibre** | Mappe | dipendenza `maplibre-gl`, `tenant/[tenantId]/map` |
| **Vercel Analytics** | Analytics | dipendenza `@vercel/analytics` |

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

Alternativa a QZ per il modulo `printStations` (`tenant_printers.connection = 'sunmi_cloud'`, SN in `device_sn`). La stampante si collega da sola a internet/cloud SUNMI: **nessun PC, nessuna pagina aperta**. Flusso:

1. All'accettazione di un ordine (sito/WhatsApp/Retell) il server chiama `dispatchComandaForOrder` (`src/lib/printing/dispatch.ts`), che fa un **push firmato (MD5)** alla stampante per SN (`src/lib/printing/sunmi-cloud.ts`).
2. Per privacy SUNMI non trasporta il contenuto: la stampante si ricollega al **callback pubblico** `POST/GET /api/printing/sunmi/pull` e scarica la comanda in **ESC/POS**.
3. Dedup via `orders.comanda_printed_at` (prenotato al push, rollback se il push fallisce).

- Env (per-piattaforma, una sola SUNMI partner app): `SUNMI_CLOUD_APP_ID`, `SUNMI_CLOUD_APP_KEY`, `SUNMI_CLOUD_API_BASE`, `SUNMI_CLOUD_PUSH_PATH`.
- **Stato:** implementazione "a secco" — **non testata**. ⚠️ Da verificare con account partner SUNMI e doc autenticata: URL/parametri esatti del push, composizione precisa del `sign`, e formato della risposta del pull (ESC/POS raw vs JSON/base64). Tutti i punti incerti sono marcati `TODO(verify)` nel codice.
- **Costo/licenza da confermare:** la stampa **silenziosa** in produzione (senza popup di conferma) richiede un certificato di firma QZ commerciale. In dev/unsigned QZ chiede conferma all'utente una volta per origine (`setCertificatePromise`/`setSignaturePromise` oggi non firmati). Nessuna env server dedicata: il ponte è interamente lato browser↔localhost.

## Da confermare

- Quali integrazioni sono effettivamente in produzione vs in setup/sandbox.
- Mappatura integrazione → tenant abilitati.
- Provider Documenso attivo (cloud vs self-hosted) per ciascun verticale: la selezione è guidata da `DOCUMENSO_*_PROVIDER`/URL multipli.

## Collegamenti

- [[endpoint-ia]]
- [[cron-e-processi]]
