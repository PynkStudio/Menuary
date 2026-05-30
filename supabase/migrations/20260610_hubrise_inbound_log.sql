-- Dead-letter / audit log per webhook HubRise: cattura eventi che non siamo riusciti
-- a processare (signature invalida, location_id non mappato, errori interni).

create table if not exists public.hubrise_inbound_log (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  event text null,                          -- "order/create", "order/update", "customer/update", ecc.
  hubrise_location_id text null,
  resource_id text null,
  status text not null check (status in (
    'signature_invalid',
    'unmatched_location',
    'inactive_link',
    'processing_error'
  )),
  reason text null,
  payload jsonb null,
  signature text null,
  resolved boolean not null default false,
  resolved_at timestamptz null
);

create index if not exists hubrise_inbound_log_unresolved_idx
  on public.hubrise_inbound_log(received_at desc)
  where resolved = false;

create index if not exists hubrise_inbound_log_location_idx
  on public.hubrise_inbound_log(hubrise_location_id, received_at desc)
  where hubrise_location_id is not null;

comment on table public.hubrise_inbound_log is
  'Eventi webhook HubRise non processabili. Aiuta debug post go-live; le righe risolte possono essere archiviate.';
