-- Servizio clienti operativo per tenant via WhatsApp.
-- Questo modulo e' separato dall'AI WhatsApp per clienti finali: qui scrivono
-- tenant admin e, solo se autorizzati dal superadmin, singoli employee con
-- permessi granulari per modifiche operative disponibili in gestione.

create table if not exists public.tenant_customer_service_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  phone_e164 text not null,
  display_name text,
  contact_kind text not null default 'tenantadmin'
    check (contact_kind in ('tenantadmin', 'employee')),
  contact_ref_id uuid,
  authorized_by_siteadmin_id uuid references public.siteadmin(id) on delete set null,
  permissions jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone_e164)
);

create index if not exists tenant_customer_service_contacts_phone_idx
  on public.tenant_customer_service_contacts(phone_e164)
  where enabled = true;

create table if not exists public.tenant_customer_service_conversations (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'whatsapp'
    check (channel in ('whatsapp')),
  sender_phone_e164 text not null,
  tenant_id text references public.tenants(id) on delete set null,
  state text not null default 'active'
    check (state in ('active', 'pending_tenant_selection', 'pending_ticket_confirmation', 'ticket_opened', 'closed')),
  pending_ticket_subject text,
  pending_ticket_body text,
  metadata jsonb not null default '{}'::jsonb,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenant_customer_service_conversations_sender_idx
  on public.tenant_customer_service_conversations(sender_phone_e164, last_message_at desc);
create index if not exists tenant_customer_service_conversations_tenant_idx
  on public.tenant_customer_service_conversations(tenant_id, last_message_at desc);

create table if not exists public.tenant_customer_service_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.tenant_customer_service_conversations(id) on delete cascade,
  tenant_id text references public.tenants(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_phone_e164 text,
  message_id text,
  body text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tenant_customer_service_messages_conversation_idx
  on public.tenant_customer_service_messages(conversation_id, created_at);
create index if not exists tenant_customer_service_messages_tenant_idx
  on public.tenant_customer_service_messages(tenant_id, created_at desc);

create table if not exists public.tenant_customer_service_actions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.tenant_customer_service_conversations(id) on delete cascade,
  tenant_id text references public.tenants(id) on delete set null,
  action_type text not null,
  status text not null default 'proposed'
    check (status in ('proposed', 'applied', 'rejected', 'unsupported', 'failed')),
  requested_by_phone_e164 text not null,
  input_text text not null default '',
  parameters jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create index if not exists tenant_customer_service_actions_tenant_idx
  on public.tenant_customer_service_actions(tenant_id, created_at desc);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id text references public.tenants(id) on delete set null,
  source text not null default 'whatsapp_customer_service'
    check (source in ('whatsapp_customer_service', 'email', 'admin', 'gestione')),
  requester_phone_e164 text,
  requester_name text,
  subject text not null default '',
  body text not null default '',
  status text not null default 'open'
    check (status in ('open', 'triage', 'waiting_customer', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to_siteadmin_id uuid references public.siteadmin(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_tenant_idx
  on public.support_tickets(tenant_id, created_at desc);
create index if not exists support_tickets_status_idx
  on public.support_tickets(status, created_at desc);

alter table public.tenant_customer_service_contacts enable row level security;
alter table public.tenant_customer_service_conversations enable row level security;
alter table public.tenant_customer_service_messages enable row level security;
alter table public.tenant_customer_service_actions enable row level security;
alter table public.support_tickets enable row level security;

comment on table public.tenant_customer_service_contacts is
  'Numeri WhatsApp autorizzati a usare il servizio clienti operativo: tenantadmin di default, employee solo con grant superadmin e permessi granulari.';
comment on table public.tenant_customer_service_actions is
  'Audit trail delle azioni operative richieste via WhatsApp; include azioni applicate, respinte e non supportate.';
comment on table public.support_tickets is
  'Ticket di assistenza visibili in admin.menuary.it, creati da WhatsApp operativo, email o pannelli.';
