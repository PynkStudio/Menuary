-- Moduli piattaforma: profili utente Menuary, CRM, prenotazioni, sedi, staff, delivery, magazzino, i18n menu
-- RLS: utente finale vede/scrive solo ciò che le policy consentono; service_role bypassa (API server).

-- ─── locations (multi-sede) ───────────────────────────────────────────────────
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  slug text not null,
  name text not null,
  address text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists locations_tenant_idx on public.locations (tenant_id);

-- ─── Profilo utente (auth.users) — colonne whitelist per personalizzazione ───
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  is_vegetarian boolean not null default false,
  diet_notes text,
  preferred_language text not null default 'it',
  marketing_opt_in boolean not null default false,
  birth_date date,
  updated_at timestamptz not null default now()
);

-- ─── Legame esplicito tenant ↔ utente (dopo ordine / prenotazione / tavolo) ───
create table if not exists public.tenant_customer_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null,
  established_at timestamptz not null default now(),
  first_order_id uuid references public.orders (id) on delete set null,
  unique (tenant_id, user_id)
);

create index if not exists tenant_customer_links_user_idx on public.tenant_customer_links (user_id);

-- ─── Eventi write-back (interazioni per store) ───────────────────────────────
create table if not exists public.user_tenant_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists user_tenant_events_tenant_user_idx
  on public.user_tenant_events (tenant_id, user_id, created_at desc);

-- ─── CRM tenant ───────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  menuary_user_id uuid references auth.users (id) on delete set null,
  phone text,
  email text,
  display_name text,
  birth_date date,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_tenant_menuary_uidx
  on public.customers (tenant_id, menuary_user_id)
  where menuary_user_id is not null;

create index if not exists customers_tenant_phone_idx on public.customers (tenant_id, phone);

create table if not exists public.customer_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  event_kind text not null,
  ref_id uuid,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists customer_events_customer_idx on public.customer_events (customer_id, created_at desc);

-- ─── Prenotazioni (fonte server) ───────────────────────────────────────────────
create table if not exists public.reservation_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  covers int not null check (covers >= 1 and covers <= 99),
  reservation_date date not null,
  reservation_time text not null,
  notes text,
  special_request_tags text[] not null default '{}',
  status text not null default 'auto_proposed',
  table_id uuid references public.tables (id) on delete set null,
  assigned_area text,
  menuary_user_id uuid references auth.users (id) on delete set null,
  channel text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservation_requests_tenant_date_idx
  on public.reservation_requests (tenant_id, reservation_date, reservation_time);

-- ─── Tavoli: area sala (per auto-assign) ───────────────────────────────────────
alter table public.tables add column if not exists area text not null default 'Sala';

-- ─── Ordini: collegamento utente Menuary ───────────────────────────────────────
alter table public.orders add column if not exists menuary_user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_menuary_user_idx on public.orders (menuary_user_id) where menuary_user_id is not null;

-- ─── Staff scheduling ───────────────────────────────────────────────────────────
create table if not exists public.staff_shifts (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  staff_auth_user_id uuid references auth.users (id) on delete cascade,
  shift_date date not null,
  start_time text not null,
  end_time text not null,
  role_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_shifts_tenant_date_idx on public.staff_shifts (tenant_id, shift_date);

create table if not exists public.time_off_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  requester_auth_user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists time_off_tenant_status_idx on public.time_off_requests (tenant_id, status);

-- ─── Web Push (dipendenti / staff) ─────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

-- ─── Delivery hub (canali) ───────────────────────────────────────────────────────
create table if not exists public.delivery_channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  name text not null,
  status text not null default 'attivo',
  commission_note text,
  orders_today int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Magazzino / food cost ─────────────────────────────────────────────────────
create table if not exists public.inventory_ingredients (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  name text not null,
  unit text not null default 'kg',
  stock_qty numeric not null default 0,
  threshold_qty numeric not null default 0,
  cost_per_unit numeric not null default 0,
  linked_item_codes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_ingredients_tenant_idx on public.inventory_ingredients (tenant_id);

-- ─── Traduzioni menu (i18n) ────────────────────────────────────────────────────
create table if not exists public.menu_item_translations (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  locale text not null,
  name text not null,
  description text,
  unique (menu_item_id, locale)
);

create index if not exists menu_item_translations_locale_idx on public.menu_item_translations (locale);

-- ─── Webhook adapter (Retell / WhatsApp) ───────────────────────────────────────
create table if not exists public.channel_webhook_events (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  tenant_id text references public.tenants (id) on delete set null,
  payload jsonb not null default '{}',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

create index if not exists channel_webhook_events_channel_idx on public.channel_webhook_events (channel, received_at desc);

-- ─── RLS ───────────────────────────────────────────────────────────────────────
alter table public.locations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.tenant_customer_links enable row level security;
alter table public.user_tenant_events enable row level security;
alter table public.customers enable row level security;
alter table public.customer_events enable row level security;
alter table public.reservation_requests enable row level security;
alter table public.staff_shifts enable row level security;
alter table public.time_off_requests enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.delivery_channels enable row level security;
alter table public.inventory_ingredients enable row level security;
alter table public.menu_item_translations enable row level security;
alter table public.channel_webhook_events enable row level security;

-- user_profiles: solo il proprietario
create policy user_profiles_owner_select on public.user_profiles
  for select to authenticated using (user_id = auth.uid());
create policy user_profiles_owner_upsert on public.user_profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy user_profiles_owner_update on public.user_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- tenant_customer_links: l'utente vede e crea solo i propri legami
create policy tenant_customer_links_self_select on public.tenant_customer_links
  for select to authenticated using (user_id = auth.uid());
create policy tenant_customer_links_self_insert on public.tenant_customer_links
  for insert to authenticated with check (user_id = auth.uid());

-- user_tenant_events: inserimento/lettura propri eventi per tenant noto
create policy user_tenant_events_self_select on public.user_tenant_events
  for select to authenticated using (user_id = auth.uid());
create policy user_tenant_events_self_insert on public.user_tenant_events
  for insert to authenticated with check (user_id = auth.uid());

-- reservation_requests: utente loggato vede le proprie; insert da API guest via service role
create policy reservation_requests_owner_select on public.reservation_requests
  for select to authenticated using (menuary_user_id = auth.uid());

-- customers: nessun accesso diretto consumer (solo service_role / admin backend)
-- (nessuna policy = deny per authenticated/anon su customers)

-- staff self-service
create policy staff_shifts_self_select on public.staff_shifts
  for select to authenticated using (staff_auth_user_id = auth.uid());
create policy time_off_self_all on public.time_off_requests
  for all to authenticated using (requester_auth_user_id = auth.uid()) with check (requester_auth_user_id = auth.uid());

-- push subscriptions
create policy push_subscriptions_owner on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- locations, delivery_channels, inventory_ingredients, menu_item_translations: nessuna policy anon/authenticated
-- (letture filtrate per tenant_id tramite route Next + service_role o client già esistente per menu_items)

-- Funzione guest reservation: route Next + service_role.

comment on table public.user_profiles is 'Profilo Menuary: RLS owner-only; tenant riceve subset via API.';
comment on table public.tenant_customer_links is 'Legame post-interazione; upsert da server dopo ordine/prenotazione/tavolo.';
comment on table public.reservation_requests is 'Prenotazioni server-side; admin via service_role.';
