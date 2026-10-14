create table public.pynkstudio_mcp_clients (
  client_id text primary key,
  client_name text not null,
  redirect_uris text[] not null,
  grant_types text[] not null default array['authorization_code','refresh_token'],
  response_types text[] not null default array['code'],
  token_endpoint_auth_method text not null default 'none',
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table public.pynkstudio_mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  siteadmin_id uuid not null references public.siteadmin(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text references public.pynkstudio_mcp_clients(client_id) on delete cascade,
  name text not null,
  token_hash text not null unique,
  token_prefix text not null,
  kind text not null default 'manual' check (kind in ('manual','oauth_access','oauth_refresh')),
  scopes text[] not null default '{}',
  resource text,
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.pynkstudio_mcp_authorization_codes (
  code_hash text primary key,
  client_id text not null references public.pynkstudio_mcp_clients(client_id) on delete cascade,
  siteadmin_id uuid not null references public.siteadmin(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redirect_uri text not null,
  scopes text[] not null,
  resource text not null,
  code_challenge text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.pynkstudio_mcp_audit_log (
  id uuid primary key default gen_random_uuid(),
  token_id uuid references public.pynkstudio_mcp_tokens(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  tool text not null,
  arguments jsonb not null default '{}'::jsonb,
  outcome text not null check (outcome in ('pending','ok','error','denied')),
  error text,
  target_id text,
  result jsonb,
  client_request_id text,
  duration_ms integer,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index pynkstudio_mcp_audit_idempotency_idx
  on public.pynkstudio_mcp_audit_log(token_id, tool, client_request_id)
  where outcome = 'ok' and client_request_id is not null;
create index pynkstudio_mcp_tokens_user_idx on public.pynkstudio_mcp_tokens(user_id, created_at desc);
create index pynkstudio_mcp_codes_expiry_idx on public.pynkstudio_mcp_authorization_codes(expires_at);
create index pynkstudio_mcp_audit_created_idx on public.pynkstudio_mcp_audit_log(created_at desc);

alter table public.pynkstudio_mcp_clients enable row level security;
alter table public.pynkstudio_mcp_tokens enable row level security;
alter table public.pynkstudio_mcp_authorization_codes enable row level security;
alter table public.pynkstudio_mcp_audit_log enable row level security;

revoke all on public.pynkstudio_mcp_clients from anon, authenticated;
revoke all on public.pynkstudio_mcp_tokens from anon, authenticated;
revoke all on public.pynkstudio_mcp_authorization_codes from anon, authenticated;
revoke all on public.pynkstudio_mcp_audit_log from anon, authenticated;
