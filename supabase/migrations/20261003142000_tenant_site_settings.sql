create table if not exists public.tenant_site_settings (
  tenant_id text primary key references public.tenants(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
comment on table public.tenant_site_settings is
  'Impostazioni sito modificate dalla gestione (social, link email footer, prezzi menu, finestre prenotazione, valuta, lingue, sospensioni moduli). Prima vivevano solo nel localStorage del browser del gestore.';
alter table public.tenant_site_settings enable row level security;
revoke all on table public.tenant_site_settings from anon, authenticated;
