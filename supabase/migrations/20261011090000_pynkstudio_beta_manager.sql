-- Beta manager PynkStudio (pynkstudio.eu/beta, admin.pynkstudio.eu/beta).
-- Accesso solo via service role: le API applicano le regole (cookie tester / siteadmin).

create table if not exists public.pynkstudio_beta_testers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text not null,
  devices text[] not null default '{}',
  -- TestFlight su invito email e Google Play closed testing vogliono l'account del dispositivo,
  -- che spesso non coincide con l'email di contatto.
  apple_id_email text,
  google_account_email text,
  locale text not null default 'it',
  access_token uuid not null default gen_random_uuid() unique,
  email_verified_at timestamptz,
  notify_enabled boolean not null default true,
  -- Array vuoto = nessun filtro (tutte le categorie / lingue / tipi).
  notify_categories text[] not null default '{}',
  notify_languages text[] not null default '{}',
  notify_kinds text[] not null default '{}',
  consent_at timestamptz not null default now(),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pynkstudio_betas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  icon_url text,
  category text not null default 'altro',
  languages text[] not null default '{}',
  kind text not null default 'new' check (kind in ('new', 'update')),
  version text,
  status text not null default 'draft' check (status in ('draft', 'open', 'full', 'closed')),
  -- [{ device, method, url, notes }]: un canale per dispositivo (TestFlight, Play, Firebase…).
  channels jsonb not null default '[]'::jsonb,
  feedback_url text,
  ends_at timestamptz,
  published_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pynkstudio_beta_requests (
  id uuid primary key default gen_random_uuid(),
  beta_id uuid not null references public.pynkstudio_betas(id) on delete cascade,
  tester_id uuid not null references public.pynkstudio_beta_testers(id) on delete cascade,
  device text not null,
  method text not null,
  account_email text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (beta_id, tester_id, device)
);

create table if not exists public.pynkstudio_beta_notifications (
  beta_id uuid not null references public.pynkstudio_betas(id) on delete cascade,
  tester_id uuid not null references public.pynkstudio_beta_testers(id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (beta_id, tester_id)
);

create index if not exists pynkstudio_beta_requests_tester_idx on public.pynkstudio_beta_requests (tester_id);
create index if not exists pynkstudio_beta_notifications_tester_idx on public.pynkstudio_beta_notifications (tester_id);
create index if not exists pynkstudio_betas_status_idx on public.pynkstudio_betas (status);

alter table public.pynkstudio_beta_testers enable row level security;
alter table public.pynkstudio_betas enable row level security;
alter table public.pynkstudio_beta_requests enable row level security;
alter table public.pynkstudio_beta_notifications enable row level security;
