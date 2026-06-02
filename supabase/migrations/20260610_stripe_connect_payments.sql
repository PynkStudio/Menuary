-- Stripe Connect (Standard): account collegato per ciascun tenant.
-- Ogni tenant possiede il proprio account Stripe; Menuary è la piattaforma
-- e può prelevare un'application fee opzionale (es. 3% sugli ordini AI).

create table if not exists public.tenant_payment_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  provider text not null default 'stripe' check (provider in ('stripe')),
  -- ID account Stripe collegato (acct_xxx). Univoco per tenant+provider.
  stripe_account_id text,
  -- Tipo Connect: per ora solo "standard". Futuro: "express".
  account_type text not null default 'standard' check (account_type in ('standard', 'express')),
  -- Stato onboarding ricavato da Stripe Account API.
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  -- email / country snapshot dall'account Stripe (utile per UI senza chiamare Stripe).
  account_email text,
  account_country text,
  -- Scope OAuth rilasciato da Stripe (read_only|read_write).
  oauth_scope text,
  -- Stato pipeline interna.
  status text not null default 'pending'
    check (status in ('pending', 'connected', 'restricted', 'disconnected')),
  last_synced_at timestamptz,
  connected_at timestamptz,
  disconnected_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un tenant può avere un solo account per provider attivo.
  unique (tenant_id, provider)
);

create index if not exists tenant_payment_accounts_stripe_idx
  on public.tenant_payment_accounts(stripe_account_id)
  where stripe_account_id is not null;

alter table public.tenant_payment_accounts enable row level security;

-- Service role bypassa RLS; lettura tenant-scoped la facciamo via API server-side.
-- Nessuna policy pubblica: dati sensibili.

create or replace function public.tenant_payment_accounts_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_tenant_payment_accounts_touch on public.tenant_payment_accounts;
create trigger trg_tenant_payment_accounts_touch
  before update on public.tenant_payment_accounts
  for each row execute function public.tenant_payment_accounts_touch_updated_at();

-- ─── Orders: tracciamento pagamento Stripe Connect ────────────────────────────
alter table public.orders
  add column if not exists payment_provider text,
  add column if not exists stripe_account_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists application_fee_amount_cents integer,
  add column if not exists paid_at timestamptz;

create index if not exists orders_stripe_session_idx
  on public.orders(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists orders_stripe_payment_intent_idx
  on public.orders(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- ─── Channel payment requests: collega all'account Stripe del tenant ──────────
alter table public.channel_payment_requests
  add column if not exists stripe_account_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists application_fee_amount_cents integer,
  add column if not exists paid_at timestamptz;

create index if not exists channel_payment_requests_stripe_pi_idx
  on public.channel_payment_requests(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- ─── Event log idempotente per i webhook Stripe Connect ───────────────────────
create table if not exists public.stripe_webhook_events (
  id text primary key, -- evt_xxx
  type text not null,
  livemode boolean not null default false,
  account text,        -- acct_xxx per eventi Connect; null per eventi piattaforma
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  process_error text
);

create index if not exists stripe_webhook_events_account_idx
  on public.stripe_webhook_events(account)
  where account is not null;

alter table public.stripe_webhook_events enable row level security;

comment on table public.tenant_payment_accounts is
  'Account Stripe Connect (Standard) collegato per ciascun tenant. Isola gli incassi e abilita application fee piattaforma.';
comment on column public.orders.payment_provider is
  'Provider pagamento: stripe (Connect). Null se ordine non richiede pagamento online.';
comment on column public.orders.stripe_account_id is
  'Account Stripe del tenant che ha incassato (snapshot al momento del checkout).';
comment on column public.orders.application_fee_amount_cents is
  'Fee piattaforma applicata in centesimi; tipicamente 0% per dine-in/online, 3% per ordini AI (Retell/WA).';
