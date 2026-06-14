-- Qualificazione commerciale inbound dal numero WhatsApp condiviso.
-- Le conversazioni restano separate dal supporto operativo dei tenant attivi.

alter table public.platform_leads
  add column if not exists contact_phone_normalized text,
  add column if not exists requested_services text[] not null default '{}',
  add column if not exists pain_points text[] not null default '{}',
  add column if not exists whatsapp_qualification jsonb not null default '{}'::jsonb,
  add column if not exists whatsapp_inferred_vertical text not null default 'unknown'
    check (whatsapp_inferred_vertical in ('unknown', 'food', 'services', 'creative', 'other')),
  add column if not exists whatsapp_vertical_confidence numeric(4, 3) not null default 0,
  add column if not exists last_whatsapp_at timestamptz;

update public.platform_leads
set contact_phone_normalized = case
  when contact_phone like '+%' then '+' || regexp_replace(contact_phone, '\D', '', 'g')
  when regexp_replace(contact_phone, '\D', '', 'g') ~ '^3[0-9]{8,10}$'
    then '+39' || regexp_replace(contact_phone, '\D', '', 'g')
  else '+' || regexp_replace(contact_phone, '\D', '', 'g')
end
where contact_phone is not null
  and contact_phone_normalized is null
  and regexp_replace(contact_phone, '\D', '', 'g') <> '';

create index if not exists platform_leads_phone_normalized_idx
  on public.platform_leads (contact_phone_normalized)
  where contact_phone_normalized is not null;

create table if not exists public.platform_whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  sender_phone_e164 text not null unique,
  lead_id uuid references public.platform_leads(id) on delete set null,
  state text not null default 'qualifying'
    check (state in ('qualifying', 'call_proposed', 'handed_off', 'closed')),
  inferred_vertical text not null default 'unknown'
    check (inferred_vertical in ('unknown', 'food', 'services', 'creative', 'other')),
  vertical_confidence numeric(4, 3) not null default 0,
  profile jsonb not null default '{}'::jsonb,
  summary text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.platform_whatsapp_conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  provider_message_id text,
  reply_to_provider_message_id text,
  body text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists platform_whatsapp_messages_provider_uidx
  on public.platform_whatsapp_messages(provider_message_id)
  where provider_message_id is not null and direction = 'inbound';

create index if not exists platform_whatsapp_messages_conversation_idx
  on public.platform_whatsapp_messages(conversation_id, created_at desc);

create index if not exists platform_whatsapp_messages_reply_idx
  on public.platform_whatsapp_messages(reply_to_provider_message_id)
  where reply_to_provider_message_id is not null;

alter table public.platform_whatsapp_conversations enable row level security;
alter table public.platform_whatsapp_messages enable row level security;

comment on column public.platform_leads.whatsapp_qualification is
  'Profilo strutturato e cumulativo estratto dalla conversazione commerciale WhatsApp.';
comment on table public.platform_whatsapp_conversations is
  'Stato e memoria delle conversazioni commerciali sul numero WhatsApp condiviso.';
comment on table public.platform_whatsapp_messages is
  'Transcript inbound/outbound delle conversazioni commerciali WhatsApp, con deduplicazione dei webhook provider.';
