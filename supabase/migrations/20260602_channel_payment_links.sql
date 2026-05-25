-- Payment links riusabili per canali conversazionali (Retell, WhatsApp, SMS).

alter table public.orders
  add column if not exists fulfillment_type text not null default 'takeaway'
    check (fulfillment_type in ('takeaway', 'delivery')),
  add column if not exists customer_phone text,
  add column if not exists delivery_address text,
  add column if not exists delivery_doorbell text,
  add column if not exists delivery_floor text,
  add column if not exists delivery_notes text,
  add column if not exists desired_time text,
  add column if not exists payment_status text not null default 'not_required'
    check (payment_status in ('not_required', 'pending', 'paid', 'failed', 'expired')),
  add column if not exists payment_link_url text;

create table if not exists public.channel_payment_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  reservation_id uuid references public.reservation_requests(id) on delete set null,
  channel text not null check (channel in ('retell', 'whatsapp', 'sms', 'manual')),
  recipient_phone text not null,
  amount numeric(10, 2) not null,
  currency text not null default 'EUR',
  provider text not null default 'stripe',
  provider_session_id text,
  payment_url text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'paid', 'failed', 'expired')),
  message_status text not null default 'queued'
    check (message_status in ('queued', 'sent', 'failed', 'skipped')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists channel_payment_requests_tenant_idx
  on public.channel_payment_requests(tenant_id, created_at desc);

create index if not exists channel_payment_requests_order_idx
  on public.channel_payment_requests(order_id);

alter table public.channel_payment_requests enable row level security;

alter table public.tenant_ai_phone_settings
  add column if not exists payment_controls jsonb not null default
    '{"enabled":false,"requireForTakeaway":false,"requireForDelivery":false,"defaultChannel":"sms","sendAutomatically":true}'::jsonb;

