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
| **MapLibre** | Mappe | dipendenza `maplibre-gl`, `tenant/[tenantId]/map` |
| **Vercel Analytics** | Analytics | dipendenza `@vercel/analytics` |

## Canali WhatsApp

Da `TENANT_CUSTOMER_SERVICE_WHATSAPP.md`: modulo WhatsApp basato su Twilio. Endpoint supporto tenant: `POST /api/webhooks/whatsapp/tenant-support` (secret `TENANT_SUPPORT_WHATSAPP_SECRET`, fallback `WHATSAPP_WEB_BRIDGE_SECRET`). Esistono inoltre `webhooks/whatsapp`, `webhooks/whatsapp/session-status`, `whatsapp/inbound`.

## Stripe in ambiente demo

Da memoria di progetto e codice: su host `demo.*` Stripe va usato **sempre in sandbox** (`shouldUseStripeSandbox()`), mai dedotto direttamente da `isDemoHostname`. **Da verificare** la posizione esatta dell'helper nel codice prima di farvi affidamento.

## Da confermare

- Quali integrazioni sono effettivamente in produzione vs in setup/sandbox.
- Mappatura integrazione → tenant abilitati.
- Provider Documenso attivo (cloud vs self-hosted) per ciascun verticale: la selezione è guidata da `DOCUMENSO_*_PROVIDER`/URL multipli.

## Collegamenti

- [[endpoint-ia]]
- [[cron-e-processi]]
