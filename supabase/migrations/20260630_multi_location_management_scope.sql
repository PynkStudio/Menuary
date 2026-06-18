alter table public.extra_lists
  add column if not exists location_id uuid references public.locations(id) on delete cascade;

alter table public.menu_lists
  add column if not exists location_id uuid references public.locations(id) on delete cascade;

create index if not exists extra_lists_location_id_idx on public.extra_lists(location_id);
create index if not exists menu_lists_location_id_idx on public.menu_lists(location_id);

delete from public.tenant_order_settings fallback
where fallback.location_id is null
  and exists (
    select 1
      from public.locations location
      join public.tenant_order_settings scoped
        on scoped.tenant_id = fallback.tenant_id
       and scoped.location_id = location.id
     where location.tenant_id = fallback.tenant_id
       and location.is_default
  );

update public.tenant_order_settings fallback
   set location_id = (
     select location.id
       from public.locations location
      where location.tenant_id = fallback.tenant_id
      order by location.is_default desc, location.created_at asc
      limit 1
   )
 where fallback.location_id is null;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'tables',
    'orders',
    'gallery_images',
    'reviews',
    'menu_categories',
    'menu_items',
    'tenant_special_hours',
    'reservation_requests',
    'staff_shifts',
    'shifts',
    'cash_sessions',
    'kiosk_devices',
    'extra_lists',
    'menu_lists'
  ]
  loop
    execute format(
      'update public.%I target
          set location_id = (
           select l.id
             from public.locations l
            where l.tenant_id = target.tenant_id
            order by l.is_default desc, l.created_at asc
            limit 1
         )
        where target.location_id is null
          and exists (
            select 1
              from public.locations l
             where l.tenant_id = target.tenant_id
          )',
      table_name
    );
  end loop;
end
$$;

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

create or replace function public.enforce_tenant_location_scope()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  resolved_tenant_id text;
begin
  if new.location_id is null then
    select l.id
      into new.location_id
      from public.locations l
     where l.tenant_id = new.tenant_id
     order by l.is_default desc, l.created_at asc
     limit 1;
  end if;

  if new.location_id is null then
    return new;
  end if;

  select l.tenant_id
    into resolved_tenant_id
    from public.locations l
   where l.id = new.location_id;

  if resolved_tenant_id is distinct from new.tenant_id then
    raise exception 'La sede % non appartiene al tenant %', new.location_id, new.tenant_id
      using errcode = '23514';
  end if;

  return new;
end
$$;

do $$
declare
  table_name text;
  trigger_name text;
begin
  foreach table_name in array array[
    'tables',
    'orders',
    'gallery_images',
    'reviews',
    'menu_categories',
    'menu_items',
    'tenant_special_hours',
    'reservation_requests',
    'staff_shifts',
    'shifts',
    'cash_sessions',
    'kiosk_devices',
    'tenant_order_settings',
    'extra_lists',
    'menu_lists'
  ]
  loop
    trigger_name := format('%s_enforce_tenant_location', table_name);
    execute format('drop trigger if exists %I on public.%I', trigger_name, table_name);
    execute format(
      'create trigger %I
         before insert or update of tenant_id, location_id on public.%I
         for each row execute function public.enforce_tenant_location_scope()',
      trigger_name,
      table_name
    );
  end loop;
end
$$;

comment on function public.enforce_tenant_location_scope() is
  'Assegna la sede predefinita ai record legacy senza location e impedisce riferimenti sede cross-tenant.';
