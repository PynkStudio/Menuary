-- Correzione di 20260902_mailapp_webhook_idempotency.
--
-- Gli indici unici parziali (`where ... is not null`) non vengono riconosciuti
-- da `on conflict (col)` senza predicato, che è ciò che genera PostgREST con
-- `upsert({ onConflict })`: ogni insert falliva con 42P10 e il webhook inbound
-- rispondeva 500 dal 2026-09-02, quindi nessuna mail arrivava in inbox.
--
-- Un indice unico pieno ha la stessa semantica (i NULL restano distinti) ed è
-- utilizzabile come arbitro dell'on conflict.
--
-- Applicata su manuary.it il 2026-10-03 via MCP apply_migration.

create unique index if not exists inbound_emails_resend_email_id_key
  on public.inbound_emails (resend_email_id);
drop index if exists public.inbound_emails_resend_email_id_uidx;

create unique index if not exists email_tracking_events_provider_event_id_key
  on public.email_tracking_events (provider_event_id);
drop index if exists public.email_tracking_events_provider_event_uidx;
