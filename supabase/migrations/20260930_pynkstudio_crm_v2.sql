-- CRM PynkStudio v2: dati strutturati (dimensione, tempistica, interessi, attribuzione)
-- invece di testo libero nelle note, follow-up, valore stimato e timeline attività.
-- Accesso solo via service-role nelle API route admin: nessuna policy.

alter table public.pynkstudio_crm
  add column if not exists employees_range   text,
  add column if not exists interests         text[]      not null default '{}',
  add column if not exists timing            text,
  add column if not exists plan_interest     text,
  add column if not exists first_attribution jsonb,
  add column if not exists last_attribution  jsonb,
  add column if not exists submissions_count integer     not null default 0,
  add column if not exists last_activity_at  timestamptz not null default now(),
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists estimated_value   numeric(10,2),
  add column if not exists unsubscribed_at   timestamptz;

comment on column public.pynkstudio_crm.employees_range is
  'Dimensione come dichiarata dal contatto (es. "11–20"). employees_count ne è la stima numerica per ordinare/filtrare.';
comment on column public.pynkstudio_crm.first_attribution is
  'Attribuzione (utm_*, gclid, fbclid, referrer, landing_path) della prima richiesta: da dove è arrivato.';
comment on column public.pynkstudio_crm.last_attribution is
  'Attribuzione dell''ultima richiesta ricevuta.';

-- Le email si confrontano in minuscolo: normalizza lo storico dove non crea duplicati.
update public.pynkstudio_crm c
set email = lower(trim(c.email))
where c.email <> lower(trim(c.email))
  and not exists (
    select 1 from public.pynkstudio_crm o
    where o.id <> c.id and o.email = lower(trim(c.email))
  );

-- Backfill dai testi che finora finivano solo nelle note (la voce più recente è in cima).
update public.pynkstudio_crm
set employees_range = btrim((regexp_match(notes, 'Dimensione: ([^\n]+?) persone'))[1])
where employees_range is null and notes ~ 'Dimensione: ';

update public.pynkstudio_crm
set employees_range = btrim((regexp_match(notes, 'Persone: ([^\n]+)'))[1])
where employees_range is null and notes ~ 'Persone: ';

update public.pynkstudio_crm
set employees_count = nullif((regexp_match(employees_range, '(\d+)[^\d]*$'))[1], '')::int
where employees_count is null and employees_range ~ '\d';

update public.pynkstudio_crm
set timing = btrim((regexp_match(notes, 'Tempistica: ([^\n]+)'))[1])
where timing is null and notes ~ 'Tempistica: ';

update public.pynkstudio_crm
set industry = btrim((regexp_match(notes, 'Settore: ([^\n]+)'))[1])
where industry is null and notes ~ 'Settore: ';

update public.pynkstudio_crm
set interests = string_to_array(btrim((regexp_match(notes, 'Obiettivi: ([^\n]+)'))[1]), ' · ')
where interests = '{}' and notes ~ 'Obiettivi: ';

update public.pynkstudio_crm
set plan_interest = btrim((regexp_match(notes, 'Percorso di interesse: ([^\n]+)'))[1])
where plan_interest is null and notes ~ 'Percorso di interesse: ';

update public.pynkstudio_crm
set last_activity_at = greatest(coalesce(last_booking_at, created_at), updated_at);

create index if not exists pynkstudio_crm_follow_up_idx
  on public.pynkstudio_crm (next_follow_up_at) where next_follow_up_at is not null;
create index if not exists pynkstudio_crm_last_activity_idx
  on public.pynkstudio_crm (last_activity_at desc);
create index if not exists pynkstudio_crm_source_idx
  on public.pynkstudio_crm (source);

-- Timeline: ogni richiesta, prenotazione, cambio stato e nota manuale.
create table if not exists public.pynkstudio_crm_activities (
  id          uuid        primary key default gen_random_uuid(),
  contact_id  uuid        not null references public.pynkstudio_crm(id) on delete cascade,
  type        text        not null
                check (type in ('form','booking','note','call','email','whatsapp','status','unsubscribe','system')),
  title       text        not null,
  body        text,
  meta        jsonb,
  created_by  text,
  created_at  timestamptz not null default now()
);

create index if not exists pynkstudio_crm_activities_contact_idx
  on public.pynkstudio_crm_activities (contact_id, created_at desc);

alter table public.pynkstudio_crm_activities enable row level security;

-- Storico: le call già prenotate diventano voci di timeline.
insert into public.pynkstudio_crm_activities (contact_id, type, title, body, meta, created_at)
select c.id,
       'booking',
       case when b.status = 'cancelled' then 'Call annullata' else 'Call prenotata' end,
       b.topic,
       jsonb_build_object('booking_id', b.id, 'starts_at', b.starts_at, 'status', b.status),
       b.created_at
from public.consultation_bookings b
join public.pynkstudio_crm c on c.email = lower(trim(b.email))
where b.tenant_id = 'pynkstudio';

update public.pynkstudio_crm c
set submissions_count = coalesce((
  select count(*) from public.pynkstudio_crm_activities a
  where a.contact_id = c.id and a.type = 'form'
), 0);
