-- Pack remoto del presentatore AYS: manifest pubblicato da `npm run ays:pack`
-- e clip indirizzate per SHA-256. Nessuna retention: le clip restano finché il
-- manifest le referenzia; `--prune` rimuove quelle non più usate.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ays-presenter-pack', 'ays-presenter-pack', false, 2097152, array['audio/mpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.ays_presenter_packs (
  locale text not null,
  format integer not null,
  revision integer not null,
  manifest jsonb not null,
  published_at timestamptz not null default now(),
  primary key (locale, format)
);

-- Solo service_role (route server e script di pubblicazione).
alter table public.ays_presenter_packs enable row level security;
