create table if not exists public.menu_item_translations (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.menu_items(id) on delete cascade,
  tenant_id   text not null references public.tenants(id) on delete cascade,
  locale      text not null,
  name        text,
  description text,
  ingredients jsonb,
  updated_at  timestamptz not null default now(),
  unique (item_id, locale)
);

create index if not exists menu_item_translations_item_idx
  on public.menu_item_translations(item_id);

create index if not exists menu_item_translations_tenant_locale_idx
  on public.menu_item_translations(tenant_id, locale);

alter table public.menu_item_translations enable row level security;

-- Lettura pubblica (serve per il menu pubblico)
create policy "menu_item_translations_public_read"
  on public.menu_item_translations
  for select
  using (true);

-- Scrittura solo da tenant admin o siteadmin
create policy "menu_item_translations_admin_write"
  on public.menu_item_translations
  for all
  using (
    exists (
      select 1 from public.tenantadmin ta
      where ta.tenant_id = menu_item_translations.tenant_id
        and ta.user_id = auth.uid()
        and ta.enabled = true
    )
    or exists (
      select 1 from public.siteadmin sa
      where sa.user_id = auth.uid()
        and sa.enabled = true
    )
  );
