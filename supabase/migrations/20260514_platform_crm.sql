-- CRM piattaforma Menuary: lead, pacchetti commerciali, abbonamenti, pagamenti
-- RLS: nessuna policy per anon/authenticated — accesso solo via service_role (admin.menuary.it).

-- ─── Lead CRM ──────────────────────────────────────────────────────────────────
create table if not exists public.platform_leads (
  id                   uuid primary key default gen_random_uuid(),

  -- Dati attività
  business_name        text not null,
  business_slug        text,                          -- futuro tenant_id quando convertito
  business_vertical    text not null default 'food',  -- food | services

  -- Responsabile
  contact_name         text not null,
  contact_email        text not null,
  contact_phone        text,

  -- Sede operativa
  address              text,
  city                 text,
  province             text,
  postal_code          text,
  country              text not null default 'IT',

  -- Dati di fatturazione (sincronizzati su studio.menuary.it all'attivazione)
  billing_name         text,    -- ragione sociale / nome legale
  billing_vat          text,    -- partita IVA
  billing_cf           text,    -- codice fiscale
  billing_address      text,
  billing_city         text,
  billing_province     text,
  billing_postal_code  text,
  billing_sdi          text,    -- codice destinatario SDI
  billing_pec          text,    -- PEC per fatturazione elettronica

  -- CRM pipeline
  status               text not null default 'lead',  -- lead | prospect | active | churned
  source               text,                          -- form_web | referral | diretto | evento | altro
  notes                text,

  -- Collegamento tenant (valorizzato quando il lead viene convertito)
  tenant_id            text references public.tenants (id) on delete set null,
  converted_at         timestamptz,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists platform_leads_status_idx  on public.platform_leads (status);
create index if not exists platform_leads_tenant_idx  on public.platform_leads (tenant_id) where tenant_id is not null;
create unique index if not exists platform_leads_slug_uidx on public.platform_leads (business_slug) where business_slug is not null;

-- ─── Pacchetti commerciali ─────────────────────────────────────────────────────
-- I moduli disponibili sono quelli definiti in TENANT_MODULES (lib/tenant-modules.ts).
-- Il campo `modules` è un array di TenantFeatureKey — si aggiorna automaticamente
-- quando si aggiungono nuovi moduli al catalogo.
create table if not exists public.platform_packages (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  price_monthly   numeric(10, 2) not null default 0,
  price_yearly    numeric(10, 2),
  currency        text not null default 'EUR',
  modules         text[] not null default '{}',   -- array di TenantFeatureKey
  is_active       boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Abbonamenti ───────────────────────────────────────────────────────────────
create table if not exists public.platform_subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  lead_id               uuid not null references public.platform_leads (id) on delete cascade,
  package_id            uuid not null references public.platform_packages (id) on delete restrict,

  billing_cycle         text not null default 'monthly',   -- monthly | yearly
  price_override        numeric(10, 2),                    -- prezzo concordato se diverso dal listino
  currency              text not null default 'EUR',

  status                text not null default 'trial',     -- trial | active | suspended | cancelled
  started_at            date not null default current_date,
  trial_ends_at         date,
  current_period_start  date,
  current_period_end    date,
  next_renewal_at       date,
  cancelled_at          timestamptz,

  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists platform_subscriptions_lead_idx    on public.platform_subscriptions (lead_id);
create index if not exists platform_subscriptions_renewal_idx on public.platform_subscriptions (next_renewal_at) where status in ('trial','active');

-- ─── Pagamenti ─────────────────────────────────────────────────────────────────
create table if not exists public.platform_payments (
  id                uuid primary key default gen_random_uuid(),
  subscription_id   uuid not null references public.platform_subscriptions (id) on delete cascade,
  lead_id           uuid not null references public.platform_leads (id) on delete cascade,

  amount            numeric(10, 2) not null,
  currency          text not null default 'EUR',
  status            text not null default 'pending',  -- pending | paid | failed | refunded
  payment_method    text,                             -- bonifico | carta | sepa | altro
  payment_date      date,
  due_date          date,
  invoice_number    text,
  notes             text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists platform_payments_subscription_idx on public.platform_payments (subscription_id);
create index if not exists platform_payments_lead_idx         on public.platform_payments (lead_id);
create index if not exists platform_payments_due_idx          on public.platform_payments (due_date) where status = 'pending';

-- ─── RLS ───────────────────────────────────────────────────────────────────────
-- Nessuna policy anon/authenticated: tutte le operazioni passano per service_role
-- tramite le API route di admin.menuary.it.
alter table public.platform_leads          enable row level security;
alter table public.platform_packages       enable row level security;
alter table public.platform_subscriptions  enable row level security;
alter table public.platform_payments       enable row level security;

-- ─── Seed pacchetti base ───────────────────────────────────────────────────────
insert into public.platform_packages (name, slug, description, price_monthly, price_yearly, modules, sort_order)
values
  (
    'Starter',
    'starter',
    'Presenza digitale essenziale: sito, menu online e raccolta prenotazioni.',
    49,
    490,
    array['website','onlineMenu','reservations'],
    1
  ),
  (
    'Growth',
    'growth',
    'Tutto Starter più ordini takeaway, tavoli QR, recensioni e galleria.',
    99,
    990,
    array['website','onlineMenu','reservations','takeaway','tableOrders','reviews','gallery','favorites'],
    2
  ),
  (
    'Pro',
    'pro',
    'Pacchetto completo: tutti i moduli operativi, CRM, analytics e gestione magazzino.',
    179,
    1790,
    array['website','onlineMenu','reservations','takeaway','tableOrders','reviews','gallery','favorites',
          'crm','analytics','upselling','kitchenDisplay','printStations','productAvailability',
          'takeawaySlots','deliveryHub','inventoryFoodCost','staffRoles','tablePlanner','orderKiosk'],
    3
  )
on conflict (slug) do nothing;

comment on table public.platform_leads         is 'CRM lead/tenant piattaforma Menuary — accesso solo service_role.';
comment on table public.platform_packages      is 'Pacchetti commerciali con lista moduli TenantFeatureKey.';
comment on table public.platform_subscriptions is 'Abbonamento lead→pacchetto con ciclo e date di rinnovo.';
comment on table public.platform_payments      is 'Registro pagamenti per abbonamento.';
