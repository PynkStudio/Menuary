create table if not exists public.tenant_reservation_blocks (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  reason text,
  source text not null default 'gestione',
  created_by_phone_e164 text,
  created_at timestamptz not null default now(),
  constraint tenant_reservation_blocks_valid_range check (start_time < end_time)
);

create index if not exists tenant_reservation_blocks_lookup_idx
  on public.tenant_reservation_blocks (tenant_id, reservation_date, start_time, end_time);

alter table public.tenant_reservation_blocks enable row level security;

revoke all on public.tenant_reservation_blocks from anon, authenticated;

comment on table public.tenant_reservation_blocks is
  'Fasce nelle quali nuove prenotazioni sono sospese. Scrittura server-side e audit della sorgente.';
