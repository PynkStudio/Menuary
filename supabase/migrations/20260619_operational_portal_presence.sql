create table if not exists public.operational_portal_presence (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  portal text not null,
  location_id uuid references public.locations (id) on delete set null,
  visible boolean not null default false,
  last_seen_at timestamptz not null default now(),
  user_agent text,
  created_at timestamptz not null default now(),
  unique (tenant_id, portal, user_id, location_id)
);

create index if not exists operational_portal_presence_lookup_idx
  on public.operational_portal_presence (tenant_id, portal, visible, last_seen_at desc);

alter table public.operational_portal_presence enable row level security;

drop policy if exists operational_portal_presence_service on public.operational_portal_presence;
create policy operational_portal_presence_service
  on public.operational_portal_presence
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
