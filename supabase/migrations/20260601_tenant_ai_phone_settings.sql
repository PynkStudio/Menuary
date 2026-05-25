-- Impostazioni tenant per Assistente vocale AI / Retell.
-- I controlli rapidi del gestionale e quelli completi di admin.menuary.it
-- condividono questa tabella.

create table if not exists public.tenant_ai_phone_settings (
  tenant_id text primary key references public.tenants(id) on delete cascade,
  enabled boolean not null default true,

  phone_number text,
  retell_agent_id text,
  retell_phone_number_id text,
  greeting_message text,
  system_prompt text,
  handoff_phone text,

  language text not null default 'it-IT',
  voice_label text,
  human_transfer_enabled boolean not null default true,
  confirm_before_write boolean not null default true,
  menu_sync_enabled boolean not null default true,
  include_special_hours boolean not null default true,
  after_hours_mode text not null default 'answer_and_collect'
    check (after_hours_mode in ('answer_and_collect', 'answer_info_only', 'closed_message')),

  order_controls jsonb not null default '{"accepting":true,"disabledUntil":null,"reason":null}'::jsonb,
  reservation_controls jsonb not null default '{"accepting":true,"disabledUntil":null,"reason":null}'::jsonb,
  payment_controls jsonb not null default '{"enabled":false,"requireForTakeaway":false,"requireForDelivery":false,"defaultChannel":"sms","sendAutomatically":true}'::jsonb,
  quick_settings jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenant_ai_phone_settings enable row level security;

create index if not exists tenant_ai_phone_settings_updated_idx
  on public.tenant_ai_phone_settings(updated_at desc);

comment on table public.tenant_ai_phone_settings is
  'Configurazione Assistente vocale AI Retell per tenant: controlli rapidi gestione e configurazione completa admin.';
