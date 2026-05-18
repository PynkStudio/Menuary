-- Profilo personale per gli utenti interni (siteadmin):
-- nome, cognome, telefono, orari di lavoro. Usati per popolare
-- la firma email automatica e la pagina /admin/profilo.

alter table public.siteadmin
  add column if not exists first_name text,
  add column if not exists last_name  text,
  add column if not exists phone      text,
  add column if not exists work_hours text;

comment on column public.siteadmin.first_name is 'Nome dell''utente interno, usato nella firma email automatica.';
comment on column public.siteadmin.last_name  is 'Cognome dell''utente interno, usato nella firma email automatica.';
comment on column public.siteadmin.phone      is 'Telefono mostrato in firma e nei contatti interni.';
comment on column public.siteadmin.work_hours is 'Orari di lavoro in forma libera (es. "Lun-Ven 9:00-18:00").';
