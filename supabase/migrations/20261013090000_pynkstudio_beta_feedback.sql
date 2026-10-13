-- Feedback dei beta tester PynkStudio (area tester → admin.pynkstudio.eu/beta).
-- Accesso solo via service role, come le altre tabelle pynkstudio_beta_*.

create table if not exists public.pynkstudio_beta_feedback (
  id uuid primary key default gen_random_uuid(),
  beta_id uuid not null references public.pynkstudio_betas(id) on delete cascade,
  tester_id uuid not null references public.pynkstudio_beta_testers(id) on delete cascade,
  device text not null,
  kind text not null check (kind in ('bug', 'crash', 'feature', 'ux', 'performance', 'content', 'other')),
  message text not null,
  app_version text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'closed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pynkstudio_beta_feedback_beta_idx on public.pynkstudio_beta_feedback (beta_id, created_at desc);
create index if not exists pynkstudio_beta_feedback_tester_idx on public.pynkstudio_beta_feedback (tester_id);

alter table public.pynkstudio_beta_feedback enable row level security;
