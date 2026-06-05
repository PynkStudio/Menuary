create table if not exists public.menu_upsell_indexes (
  tenant_id text not null references public.tenants(id) on delete cascade,
  channel text not null,
  menu_scope text not null,
  menu_list_id uuid references public.menu_lists(id) on delete cascade,
  source_item_id uuid not null references public.menu_items(id) on delete cascade,
  menu_hash text not null,
  suggestions jsonb not null default '[]'::jsonb,
  generated_by text not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, channel, menu_scope, source_item_id)
);

create index if not exists menu_upsell_indexes_lookup_idx
  on public.menu_upsell_indexes (tenant_id, channel, menu_scope, menu_hash);

alter table public.menu_upsell_indexes enable row level security;

drop policy if exists "Service role manages upsell indexes" on public.menu_upsell_indexes;
create policy "Service role manages upsell indexes"
  on public.menu_upsell_indexes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.menu_upsell_indexes is
  'Indice AI degli abbinamenti upsell per tenant, canale e menu/listino visibile.';
