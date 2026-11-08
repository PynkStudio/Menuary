create table if not exists public.sailcrew_relay_boats (
  boat_id text primary key,
  secret_verifier text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sailcrew_relay_devices (
  boat_id text not null references public.sailcrew_relay_boats(boat_id) on delete cascade,
  device_id text not null,
  node_id text not null,
  public_key text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_authenticated_at timestamptz not null default now(),
  primary key (boat_id, device_id),
  unique (boat_id, node_id)
);

create table if not exists public.sailcrew_relay_events (
  boat_id text not null references public.sailcrew_relay_boats(boat_id) on delete cascade,
  event_id text not null,
  author_node_id text not null,
  target_node_id text,
  frame jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  primary key (boat_id, event_id)
);

create index if not exists sailcrew_relay_events_delivery_idx
  on public.sailcrew_relay_events (boat_id, created_at, expires_at);

alter table public.sailcrew_relay_boats enable row level security;
alter table public.sailcrew_relay_devices enable row level security;
alter table public.sailcrew_relay_events enable row level security;

revoke all on table public.sailcrew_relay_boats from anon, authenticated;
revoke all on table public.sailcrew_relay_devices from anon, authenticated;
revoke all on table public.sailcrew_relay_events from anon, authenticated;

comment on table public.sailcrew_relay_boats is
  'Server-only verifier registry for SailCrew boat relay enrollment.';
comment on table public.sailcrew_relay_devices is
  'Server-only device identities authorized for SailCrew relay access.';
comment on table public.sailcrew_relay_events is
  'Durable SailCrew relay frames retained for reconnect replay.';
