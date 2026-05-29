-- HubRise integration: catalog push + inbound orders/customers.
-- Account HubRise unico Menuary; ogni tenant/location ha il proprio location_token.

create table if not exists public.hubrise_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  location_id uuid null references public.locations(id) on delete cascade,
  hubrise_account_id text null,
  hubrise_location_id text not null,
  location_name text null,
  location_token text not null,
  catalog_id text null,
  customer_list_id text null,
  status text not null default 'active' check (status in ('active', 'paused', 'revoked')),
  menu_push_enabled boolean not null default true,
  orders_inbound_enabled boolean not null default true,
  last_menu_push_at timestamptz null,
  last_menu_push_hash text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, location_id),
  unique (hubrise_location_id)
);

create index if not exists hubrise_links_tenant_idx
  on public.hubrise_links(tenant_id);

comment on table public.hubrise_links is
  'Collegamento tenant/location ↔ HubRise. Location_token concede accesso a catalog + customer list.';

create table if not exists public.hubrise_menu_sync_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  link_id uuid not null references public.hubrise_links(id) on delete cascade,
  status text not null check (status in ('queued', 'running', 'ok', 'error', 'skipped')),
  payload_hash text null,
  error text null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null
);

create index if not exists hubrise_menu_sync_log_link_idx
  on public.hubrise_menu_sync_log(link_id, started_at desc);

-- ─── Orders: tag origine + idempotenza HubRise ────────────────────────────────
alter table public.orders
  add column if not exists source text not null default 'direct';

alter table public.orders
  add column if not exists external_order_id text null;

alter table public.orders
  add column if not exists external_platform text null;

alter table public.orders
  add column if not exists external_payload jsonb null;

create unique index if not exists orders_tenant_external_id_idx
  on public.orders(tenant_id, external_order_id)
  where external_order_id is not null;

create index if not exists orders_external_platform_idx
  on public.orders(tenant_id, external_platform)
  where external_platform is not null;

comment on column public.orders.source is
  'Canale di provenienza: direct (web/QR/kiosk), hubrise (piattaforme aggregate).';
comment on column public.orders.external_order_id is
  'ID ordine nel sistema esterno (es. HubRise order id) per idempotenza webhook.';
comment on column public.orders.external_platform is
  'Piattaforma sorgente quando source=hubrise: deliveroo, ubereats, justeat, glovo, ecc.';

-- ─── Customers: link HubRise + source ─────────────────────────────────────────
alter table public.customers
  add column if not exists hubrise_customer_id text null;

alter table public.customers
  add column if not exists email text null;

alter table public.customers
  add column if not exists source text not null default 'direct';

create index if not exists customers_tenant_hubrise_idx
  on public.customers(tenant_id, hubrise_customer_id)
  where hubrise_customer_id is not null;

create index if not exists customers_tenant_email_idx
  on public.customers(tenant_id, lower(email))
  where email is not null;

comment on column public.customers.hubrise_customer_id is
  'ID cliente HubRise quando il profilo è creato/aggiornato da ordini piattaforma.';
comment on column public.customers.source is
  'direct = web/whatsapp/retell/kiosk. hubrise:<platform> = ordine da piattaforma aggregata.';
