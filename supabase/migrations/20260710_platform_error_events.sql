create table if not exists public.platform_error_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  status text not null default 'new'
    check (status in ('new', 'triage', 'in_progress', 'resolved', 'ignored')),
  severity text not null default 'error'
    check (severity in ('debug', 'info', 'warning', 'error', 'critical')),
  source text not null default 'unknown'
    check (source in ('api', 'edge_function', 'android_app', 'cloud_print', 'webhook', 'cron', 'gestione', 'client', 'unknown')),
  environment text not null default 'production'
    check (environment in ('production', 'preview', 'development')),
  tenant_id text references public.tenants(id) on delete set null,
  location_id uuid,
  flow text not null,
  operation text,
  title text not null,
  message text not null default '',
  error_code text,
  http_status integer,
  fingerprint text not null,
  occurrence_count integer not null default 1 check (occurrence_count > 0),
  request_id text,
  actor_type text,
  actor_id text,
  device_id text,
  order_id text,
  external_ref text,
  stack text,
  metadata jsonb not null default '{}'::jsonb,
  assigned_to_siteadmin_id uuid references public.siteadmin(id) on delete set null
);

create unique index if not exists platform_error_events_fingerprint_idx
  on public.platform_error_events(environment, fingerprint);

create index if not exists platform_error_events_status_seen_idx
  on public.platform_error_events(status, last_seen_at desc);

create index if not exists platform_error_events_tenant_seen_idx
  on public.platform_error_events(tenant_id, last_seen_at desc)
  where tenant_id is not null;

create index if not exists platform_error_events_source_seen_idx
  on public.platform_error_events(source, last_seen_at desc);

alter table public.platform_error_events enable row level security;

do $$
begin
  alter publication supabase_realtime add table public.platform_error_events;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

drop policy if exists "siteadmin can read platform error events" on public.platform_error_events;
create policy "siteadmin can read platform error events"
  on public.platform_error_events
  for select
  using (public.is_siteadmin());

drop policy if exists "siteadmin can update platform error events" on public.platform_error_events;
create policy "siteadmin can update platform error events"
  on public.platform_error_events
  for update
  using (public.is_siteadmin())
  with check (public.is_siteadmin());

comment on table public.platform_error_events is
  'Registro interno degli errori tecnici e operativi generati da API, edge function, app operative, stampa, webhook e automazioni.';
