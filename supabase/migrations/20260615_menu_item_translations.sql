-- La tabella esisteva già nel DB con schema (id uuid, menu_item_id uuid, locale text, name text, description text).
-- Questa migration aggiunge le colonne mancanti, gli indici e le policy RLS.

alter table public.menu_item_translations
  add column if not exists tenant_id   text references public.tenants(id) on delete cascade,
  add column if not exists ingredients jsonb,
  add column if not exists updated_at  timestamptz not null default now();

create index if not exists menu_item_translations_tenant_locale_idx
  on public.menu_item_translations(tenant_id, locale)
  where tenant_id is not null;

-- RLS già abilitata; aggiungiamo le policy

create policy "menu_item_translations_public_read"
  on public.menu_item_translations
  for select
  using (true);

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
