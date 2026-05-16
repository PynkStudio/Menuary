-- Estensione CRM piattaforma: pipeline commerciale, temperatura lead, sedi multiple,
-- piani per sede, dati economici vendita e provvigioni.

alter table public.platform_leads
  add column if not exists stage text not null default 'new',
  add column if not exists temperature text not null default 'cold',
  add column if not exists demo_url text,
  add column if not exists demo_pr_url text,
  add column if not exists official_domain text,
  add column if not exists official_domain_active boolean not null default false,
  add column if not exists sales_owner_id uuid references auth.users (id) on delete set null,
  add column if not exists sales_owner_name text;

alter table public.platform_subscriptions
  add column if not exists setup_amount numeric(10, 2) not null default 0,
  add column if not exists first_payment_amount numeric(10, 2);

alter table public.platform_payments
  add column if not exists stripe_payment_link text,
  add column if not exists billing_payload jsonb;

alter table public.siteadmin
  add column if not exists commission_rate numeric(5, 2) not null default 0;

update public.siteadmin
set commission_rate = case when role = 'venditore' then 30 else 0 end
where commission_rate = 0;

update public.platform_leads
set temperature = 'hot'
where source = 'form_web'
  and temperature = 'cold';

create table if not exists public.platform_lead_locations (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.platform_leads (id) on delete cascade,
  name        text not null default 'Sede principale',
  address     text,
  city        text,
  province    text,
  postal_code text,
  country     text not null default 'IT',
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists platform_lead_locations_primary_uidx
  on public.platform_lead_locations (lead_id)
  where is_primary;

insert into public.platform_lead_locations (
  lead_id,
  name,
  address,
  city,
  province,
  postal_code,
  country,
  is_primary
)
select
  id,
  'Sede principale',
  address,
  city,
  province,
  postal_code,
  country,
  true
from public.platform_leads l
where not exists (
  select 1 from public.platform_lead_locations pll where pll.lead_id = l.id
);

alter table public.platform_packages
  add column if not exists vertical text not null default 'both',
  add column if not exists adapted_name text;

create table if not exists public.platform_subscription_locations (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.platform_subscriptions (id) on delete cascade,
  lead_location_id uuid not null references public.platform_lead_locations (id) on delete cascade,
  package_id      uuid not null references public.platform_packages (id) on delete restrict,
  price_factor    numeric(4, 2) not null default 1,
  modules_override text[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (subscription_id, lead_location_id)
);

create table if not exists public.platform_commissions (
  id                   uuid primary key default gen_random_uuid(),
  lead_id              uuid not null references public.platform_leads (id) on delete cascade,
  tenant_id            text references public.tenants (id) on delete set null,
  subscription_id      uuid not null references public.platform_subscriptions (id) on delete cascade,
  payment_id           uuid references public.platform_payments (id) on delete set null,
  seller_user_id       uuid references auth.users (id) on delete set null,
  seller_name          text not null,
  seller_role          text not null default 'venditore',
  billing_cycle        text not null,
  recurring_amount     numeric(10, 2) not null default 0,
  setup_amount         numeric(10, 2) not null default 0,
  first_payment_amount numeric(10, 2) not null default 0,
  commission_rate      numeric(5, 2) not null default 30,
  commission_amount    numeric(10, 2) generated always as (round(first_payment_amount * commission_rate / 100, 2)) stored,
  status               text not null default 'pending',
  closed_at            timestamptz not null default now(),
  paid_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (subscription_id, seller_user_id)
);

create index if not exists platform_commissions_seller_idx on public.platform_commissions (seller_user_id, status);
create index if not exists platform_commissions_tenant_idx on public.platform_commissions (tenant_id) where tenant_id is not null;

alter table public.platform_lead_locations enable row level security;
alter table public.platform_subscription_locations enable row level security;
alter table public.platform_commissions enable row level security;

comment on column public.platform_leads.stage is 'Pipeline commerciale: new, contacted, qualified, demo, proposal, contract, tenant, lost.';
comment on column public.platform_leads.temperature is 'Classificazione CRM: cold, warm, hot. I form web di interesse partono da hot.';
comment on column public.platform_leads.demo_url is 'Link demo pubblico creato prima della vendita, es. demo.menuary.it/slug.';
comment on column public.platform_leads.demo_pr_url is 'PR GitHub della demo, creata prima della conversione a tenant venduto.';
comment on column public.platform_leads.official_domain is 'Dominio ufficiale previsto; viene attivato solo quando il lead diventa tenant.';
comment on column public.platform_leads.official_domain_active is 'True quando il dominio ufficiale è attivo; a quel punto il link demo può essere disattivato.';
comment on column public.platform_leads.sales_owner_id is 'Utente venditore che ha seguito il lead fino alla conversione.';
comment on column public.platform_subscriptions.setup_amount is 'Importo setup concordato nella vendita, anche se diverso dal listino.';
comment on column public.platform_subscriptions.first_payment_amount is 'Importo del primo pagamento da usare per Stripe/fatturazione e provvigioni.';
comment on column public.platform_payments.billing_payload is 'Snapshot economico usato per generare pagamento Stripe e dati di fatturazione.';
comment on column public.siteadmin.commission_rate is 'Percentuale provvigione del ruolo/utente interno. Default venditore 30.';
comment on table public.platform_lead_locations is 'Sedi operative del lead. Una sede primaria viene creata anche per lead monosedi.';
comment on table public.platform_subscription_locations is 'Associazione piano per sede. Le sedi successive hanno di default factor 0.5, modificabile.';
comment on table public.platform_commissions is 'Provvigioni maturate sui tenant venduti dai venditori.';

create or replace function public.platform_suspend_overdue_tenants()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  with overdue as (
    select distinct pl.tenant_id
    from public.platform_payments pp
    join public.platform_subscriptions ps on ps.id = pp.subscription_id
    join public.platform_leads pl on pl.id = pp.lead_id
    where pp.status = 'pending'
      and pp.due_date is not null
      and pl.tenant_id is not null
      and (
        (ps.billing_cycle = 'yearly' and pp.due_date < current_date - interval '30 days')
        or
        (ps.billing_cycle = 'monthly' and pp.due_date < current_date - interval '10 days')
      )
  ), updated as (
    update public.tenants t
    set enabled = false,
        status = 'offline'
    from overdue
    where t.id = overdue.tenant_id
    returning t.id
  )
  select count(*) into affected from updated;

  return affected;
end;
$$;

comment on function public.platform_suspend_overdue_tenants() is
  'Disattiva i tenant con pagamenti scaduti oltre 30gg annuale o 10gg mensile. Da schedulare con pg_cron/Supabase Scheduled Function.';
