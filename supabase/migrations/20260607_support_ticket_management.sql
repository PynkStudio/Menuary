-- Gestione ticket supporto per admin.menuary.it.
-- Estende i ticket gia' creati dal flusso WhatsApp operativo e collega le
-- email inbound ricevute su support@menuary.it / support@bizery.it.

alter table public.support_tickets
  add column if not exists requester_email text,
  add column if not exists last_response_at timestamptz,
  add column if not exists resolved_at timestamptz;

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound', 'internal')),
  channel text not null default 'admin'
    check (channel in ('email', 'whatsapp', 'admin')),
  from_address text,
  to_addresses text[] not null default '{}',
  body text not null default '',
  html_body text,
  sent_by_siteadmin_id uuid references public.siteadmin(id) on delete set null,
  provider_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages(ticket_id, created_at);

create index if not exists support_tickets_requester_email_idx
  on public.support_tickets(lower(requester_email))
  where requester_email is not null;

alter table public.support_ticket_messages enable row level security;

comment on table public.support_ticket_messages is
  'Thread operativo dei ticket supporto: messaggi inbound, risposte email/WhatsApp e note interne.';
