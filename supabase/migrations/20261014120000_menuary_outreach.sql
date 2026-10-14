create table if not exists public.menuary_outreach_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  video_url text,
  booking_url text not null default 'https://pynkstudio.eu/prenota-call',
  sender_name text not null default 'Massimo',
  reply_to text not null default 'info@menuary.it',
  daily_limit integer not null default 20 check (daily_limit between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menuary_outreach_steps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.menuary_outreach_campaigns(id) on delete cascade,
  position smallint not null check (position between 1 and 8),
  name text not null,
  delay_days smallint not null default 0 check (delay_days between 0 and 60),
  subject text not null,
  body_text text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, position)
);

create table if not exists public.menuary_outreach_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.menuary_outreach_campaigns(id) on delete cascade,
  crm_contact_id uuid references public.pynkstudio_crm(id) on delete set null,
  public_token uuid not null default gen_random_uuid() unique,
  contact_name text not null,
  restaurant_name text not null,
  email text not null,
  phone text,
  city text,
  website_url text,
  image_url text,
  observation text,
  headline text,
  primary_pain text,
  status text not null default 'ready' check (status in ('ready', 'active', 'replied', 'booked', 'won', 'lost', 'unsubscribed', 'bounced', 'paused')),
  current_step smallint not null default 0,
  next_send_at timestamptz,
  last_sent_at timestamptz,
  sent_count integer not null default 0,
  opened_at timestamptz,
  clicked_at timestamptz,
  landing_viewed_at timestamptz,
  video_clicked_at timestamptz,
  booked_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, email)
);

create table if not exists public.menuary_outreach_events (
  id bigint generated always as identity primary key,
  lead_id uuid not null references public.menuary_outreach_leads(id) on delete cascade,
  event_type text not null check (event_type in ('email_sent', 'email_failed', 'email_opened', 'link_clicked', 'landing_viewed', 'video_clicked', 'booking_clicked', 'replied', 'booked', 'unsubscribed', 'status_changed')),
  step_position smallint,
  provider_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists menuary_outreach_leads_due_idx
  on public.menuary_outreach_leads (next_send_at)
  where status = 'active';
create index if not exists menuary_outreach_leads_campaign_idx
  on public.menuary_outreach_leads (campaign_id, created_at desc);
create index if not exists menuary_outreach_events_lead_idx
  on public.menuary_outreach_events (lead_id, created_at desc);

alter table public.menuary_outreach_campaigns enable row level security;
alter table public.menuary_outreach_steps enable row level security;
alter table public.menuary_outreach_leads enable row level security;
alter table public.menuary_outreach_events enable row level security;

revoke all on public.menuary_outreach_campaigns from anon, authenticated;
revoke all on public.menuary_outreach_steps from anon, authenticated;
revoke all on public.menuary_outreach_leads from anon, authenticated;
revoke all on public.menuary_outreach_events from anon, authenticated;

insert into public.menuary_outreach_campaigns (name)
select 'Pilot ristoranti Menuary'
where not exists (select 1 from public.menuary_outreach_campaigns);

insert into public.menuary_outreach_steps (campaign_id, position, name, delay_days, subject, body_text)
select c.id, s.position, s.name, s.delay_days, s.subject, s.body_text
from public.menuary_outreach_campaigns c
cross join (values
  (1, 'Introduzione personalizzata', 0, '{{restaurant_name}}: abbiamo preparato una piccola idea', E'Ciao {{contact_name}},\n\nho visto {{restaurant_name}} e {{observation}}.\n\nAbbiamo preparato una breve presentazione personalizzata per mostrarti come Menuary potrebbe valorizzare il locale online, rendendo menu e prenotazioni più semplici da gestire.\n\nGuarda qui: {{landing_url}}\n\nSe ti sembra interessante, puoi rispondermi direttamente oppure scegliere una call di 15 minuti: {{booking_url}}\n\nUn saluto,\n{{sender_name}}'),
  (2, 'Follow-up operativo', 3, 'Re: {{restaurant_name}} e la gestione digitale', E'Ciao {{contact_name}},\n\nriprendo la mia email nel caso ti fosse sfuggita. Menuary riunisce sito, menu aggiornabile e richieste dei clienti in una gestione unica, pensata per non aggiungere lavoro allo staff.\n\nLa demo per {{restaurant_name}} è qui: {{landing_url}}\n\nSe vuoi, bastano 15 minuti per capire se ha senso: {{booking_url}}\n\n{{sender_name}}'),
  (3, 'Valore e indipendenza', 4, '{{restaurant_name}}: più controllo, meno dipendenza dai portali', E'Ciao {{contact_name}},\n\nun sito efficace non serve solo a “esserci”: permette al locale di presentarsi bene, aggiornare il menu e ricevere contatti diretti senza dipendere interamente da social e marketplace.\n\nQui trovi la proposta preparata per {{restaurant_name}}: {{landing_url}}\n\nSe preferisci, rispondi semplicemente “sì” e ti mando i prossimi dettagli.\n\n{{sender_name}}'),
  (4, 'Chiusura gentile', 5, 'Chiudo qui — proposta Menuary per {{restaurant_name}}', E'Ciao {{contact_name}},\n\nnon voglio essere insistente, quindi questa sarà la mia ultima email. Lascio comunque disponibile la presentazione preparata per {{restaurant_name}}: {{landing_url}}\n\nSe in futuro vorrai riparlarne, ti basterà rispondere a questa email.\n\nBuon lavoro,\n{{sender_name}}')
) as s(position, name, delay_days, subject, body_text)
where c.name = 'Pilot ristoranti Menuary'
on conflict (campaign_id, position) do nothing;
