create table if not exists public.bunq_api_contexts (
  environment text primary key
    check (environment in ('production', 'sandbox')),
  encrypted_context text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bunq_api_contexts enable row level security;

revoke all on table public.bunq_api_contexts from anon, authenticated;
grant select, insert, update, delete on table public.bunq_api_contexts to service_role;

comment on table public.bunq_api_contexts is
  'Contesto installation/device Bunq cifrato dall applicazione. Accessibile solo con service_role.';
