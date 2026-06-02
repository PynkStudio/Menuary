-- Controllo runtime dei link demo pubblici.
-- La tabella resta separata da tenants: alcune demo commerciali esistono nel
-- registry applicativo prima che il tenant venga creato completamente in DB.
create table if not exists public.tenant_demo_controls (
  tenant_id     text primary key,
  preview_slug  text not null unique,
  vertical      text not null default 'food'
                check (vertical in ('food', 'services')),
  enabled       boolean not null default true,
  disabled_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.tenant_demo_controls enable row level security;

-- Il controllo viene letto esclusivamente dal middleware e aggiornato dalle
-- API admin server-side con service_role. Nessun accesso diretto dal browser.
revoke all on table public.tenant_demo_controls from anon, authenticated, service_role;
grant select, insert, update on table public.tenant_demo_controls to service_role;

insert into public.tenant_demo_controls (tenant_id, preview_slug, vertical)
select
  id,
  coalesce(nullif(preview_slug, ''), id),
  case when vertical = 'services' then 'services' else 'food' end
from public.tenants
on conflict (tenant_id) do update
set preview_slug = excluded.preview_slug,
    vertical = excluded.vertical,
    updated_at = now();

comment on table public.tenant_demo_controls is
  'Interruttore server-side per spegnere immediatamente i link demo pubblici.';
comment on column public.tenant_demo_controls.enabled is
  'False: la demo risponde con redirect al sito ufficiale attivo oppure pagina offline.';
