-- Traduzioni delle categorie menu: titolo, sottotitolo e descrizione.

create table if not exists public.menu_category_translations (
  id uuid primary key default gen_random_uuid(),
  menu_category_id uuid not null references public.menu_categories(id) on delete cascade,
  tenant_id text references public.tenants(id) on delete cascade,
  locale text not null,
  title text not null default '',
  subtitle text,
  description text,
  updated_at timestamptz not null default now(),
  unique (menu_category_id, locale)
);

create index if not exists menu_category_translations_tenant_locale_idx
  on public.menu_category_translations(tenant_id, locale)
  where tenant_id is not null;

alter table public.menu_category_translations enable row level security;

create policy "menu_category_translations_public_read"
  on public.menu_category_translations
  for select
  using (true);

create policy "menu_category_translations_admin_write"
  on public.menu_category_translations
  for all
  using (
    exists (
      select 1 from public.tenantadmin ta
      where ta.tenant_id = menu_category_translations.tenant_id
        and ta.user_id = auth.uid()
        and ta.enabled = true
    )
    or exists (
      select 1 from public.siteadmin sa
      where sa.user_id = auth.uid()
        and sa.enabled = true
    )
  );
