-- Coda generica di messaggi outbound (WhatsApp / SMS) gestita da un worker.
-- Usata sia per inviare link checkout/payment sia per "invia menu via WA"
-- proposto da Retell quando il cliente chiama solo per informazioni.
--
-- Il worker (TBD) preleva righe con status='queued', tenta il canale primario,
-- in caso di errore fa fallback su `fallback_channel` se valorizzato.

create table if not exists public.outbound_text_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  -- Tipo logico: aiuta il worker a scegliere template / formattazione.
  kind text not null check (kind in ('payment_link', 'order_summary', 'menu_link', 'custom')),
  -- Canale primario tentato.
  channel text not null check (channel in ('whatsapp', 'sms')),
  -- Canale fallback (null = nessuno).
  fallback_channel text check (fallback_channel in ('whatsapp', 'sms')),
  recipient_phone text not null,
  body text not null,
  -- Origine della richiesta: retell, whatsapp_inbound, admin_manual, system.
  source text not null default 'system',
  -- Riferimento opzionale all'ordine.
  order_id uuid references public.orders(id) on delete set null,
  status text not null default 'queued'
    check (status in ('queued', 'sending', 'sent', 'failed_primary', 'sent_fallback', 'failed')),
  attempts jsonb not null default '[]'::jsonb,
  last_error text,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outbound_text_messages_queue_idx
  on public.outbound_text_messages(status, scheduled_at)
  where status in ('queued', 'failed_primary');

create index if not exists outbound_text_messages_tenant_idx
  on public.outbound_text_messages(tenant_id, created_at desc);

create index if not exists outbound_text_messages_order_idx
  on public.outbound_text_messages(order_id)
  where order_id is not null;

alter table public.outbound_text_messages enable row level security;

create or replace function public.outbound_text_messages_touch()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end$$;

drop trigger if exists trg_outbound_text_messages_touch on public.outbound_text_messages;
create trigger trg_outbound_text_messages_touch
  before update on public.outbound_text_messages
  for each row execute function public.outbound_text_messages_touch();

comment on table public.outbound_text_messages is
  'Coda outbound generica per messaggi WA/SMS (pagamenti, riepiloghi, link menu). Gestita da worker dedicato con primary → fallback.';
