alter table public.menu_items
  add column if not exists variant_groups jsonb not null default '[]'::jsonb;

comment on column public.menu_items.variant_groups is
  'Gruppi variante a scelta singola per item menu, con eventuale defaultOptionId.';

alter table public.extra_lists
  add column if not exists location_id uuid references public.locations(id) on delete cascade;

alter table public.menu_lists
  add column if not exists location_id uuid references public.locations(id) on delete cascade;

create index if not exists extra_lists_location_id_idx on public.extra_lists(location_id);
create index if not exists menu_lists_location_id_idx on public.menu_lists(location_id);

alter table public.menu_categories
  drop constraint if exists menu_categories_tenant_id_code_key;
alter table public.menu_categories
  add constraint menu_categories_tenant_location_code_key
  unique (tenant_id, location_id, code);

alter table public.menu_items
  drop constraint if exists menu_items_tenant_id_code_key;
alter table public.menu_items
  add constraint menu_items_tenant_location_code_key
  unique (tenant_id, location_id, code);

alter table public.extra_lists
  drop constraint if exists extra_lists_tenant_id_code_key;
alter table public.extra_lists
  add constraint extra_lists_tenant_location_code_key
  unique (tenant_id, location_id, code);

alter table public.menu_lists
  drop constraint if exists menu_lists_tenant_id_code_key;
alter table public.menu_lists
  add constraint menu_lists_tenant_location_code_key
  unique (tenant_id, location_id, code);
