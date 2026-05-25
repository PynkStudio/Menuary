create table if not exists public.menu_lists (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  position integer not null default 0,
  enabled boolean not null default true,
  visibility jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists public.menu_list_items (
  list_id uuid not null references public.menu_lists(id) on delete cascade,
  item_id uuid not null references public.menu_items(id) on delete cascade,
  position integer not null default 0,
  primary key (list_id, item_id)
);

create index if not exists menu_lists_tenant_position_idx
  on public.menu_lists (tenant_id, position);

create index if not exists menu_list_items_item_idx
  on public.menu_list_items (item_id);

alter table public.menu_lists enable row level security;
alter table public.menu_list_items enable row level security;

drop policy if exists "Public read menu lists" on public.menu_lists;
create policy "Public read menu lists"
  on public.menu_lists for select
  using (true);

drop policy if exists "Public read menu list items" on public.menu_list_items;
create policy "Public read menu list items"
  on public.menu_list_items for select
  using (true);

grant select on public.menu_lists to anon, authenticated;
grant select on public.menu_list_items to anon, authenticated;

comment on table public.menu_lists is 'Menu/listini pubblici del tenant, con regole di visibilita.';
comment on table public.menu_list_items is 'Associazione ordinata tra listini pubblici e voci menu.';
