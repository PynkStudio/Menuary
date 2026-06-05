-- Profilo personale per gli utenti del pannello gestione.
alter table public.admin_users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists preferred_language text not null default 'it';

alter table public.tenantadmin
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists preferred_language text not null default 'it';

alter table public.employee
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists preferred_language text not null default 'it';

comment on column public.admin_users.preferred_language is 'Lingua preferita per il pannello gestione.';
comment on column public.tenantadmin.preferred_language is 'Lingua preferita per il pannello gestione.';
comment on column public.employee.preferred_language is 'Lingua preferita per il pannello gestione.';
