create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  restaurant_name text not null,
  email text not null,
  phone text,
  city text,
  interest text not null default 'demo',
  message text,
  source text not null default 'menuary-marketing-site',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.marketing_leads enable row level security;

create index if not exists marketing_leads_created_at_idx
  on public.marketing_leads (created_at desc);

create index if not exists marketing_leads_email_idx
  on public.marketing_leads (lower(email));
