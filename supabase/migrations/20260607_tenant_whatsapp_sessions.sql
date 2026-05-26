create table if not exists public.tenant_whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  session_kind text not null default 'tenant_public'
    check (session_kind in ('tenant_public')),
  session_id text not null,
  phone_e164 text,
  status text not null default 'not_configured'
    check (status in ('not_configured', 'pending_qr', 'connected', 'offline', 'error')),
  qr_data_url text,
  qr_updated_at timestamptz,
  last_heartbeat_at timestamptz,
  last_connected_at timestamptz,
  last_error text,
  alert_email_sent_at timestamptz,
  alert_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, session_kind)
);

create index if not exists tenant_whatsapp_sessions_status_idx
  on public.tenant_whatsapp_sessions(status, last_heartbeat_at);

alter table public.tenant_whatsapp_sessions enable row level security;

comment on table public.tenant_whatsapp_sessions is
  'Stato sessioni WhatsApp Web dei numeri pubblici tenant: QR, heartbeat, errori e alert email.';
