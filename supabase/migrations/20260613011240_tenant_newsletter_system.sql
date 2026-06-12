create table if not exists public.tenant_newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  email text not null,
  name text,
  locale text not null default 'it',
  source text not null default 'web',
  status text not null default 'active'
    check (status in ('active', 'unsubscribed', 'bounced', 'complained')),
  tags text[] not null default '{}',
  consent_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tenant_newsletter_subscribers_tenant_email_uidx
  on public.tenant_newsletter_subscribers (tenant_id, email);
create unique index if not exists tenant_newsletter_subscribers_unsubscribe_token_uidx
  on public.tenant_newsletter_subscribers (unsubscribe_token);
create index if not exists tenant_newsletter_subscribers_status_idx
  on public.tenant_newsletter_subscribers (tenant_id, status, created_at desc);

create table if not exists public.tenant_newsletter_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  kind text not null default 'campaign' check (kind in ('campaign', 'automation')),
  name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'active', 'paused', 'sending', 'sent')),
  trigger_key text,
  delay_minutes integer not null default 0 check (delay_minutes >= 0),
  subject text not null default '',
  preheader text,
  body_html text not null default '',
  from_name text,
  reply_to text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind = 'campaign' and trigger_key is null)
    or (kind = 'automation' and trigger_key is not null)
  )
);

create index if not exists tenant_newsletter_messages_due_idx
  on public.tenant_newsletter_messages (status, scheduled_at)
  where kind = 'campaign';
create index if not exists tenant_newsletter_messages_automation_idx
  on public.tenant_newsletter_messages (tenant_id, trigger_key, status)
  where kind = 'automation';

create table if not exists public.tenant_newsletter_trigger_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  trigger_key text not null,
  subscriber_id uuid references public.tenant_newsletter_subscribers(id) on delete set null,
  recipient_email text,
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'processing', 'processed', 'failed')),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists tenant_newsletter_trigger_events_due_idx
  on public.tenant_newsletter_trigger_events (status, available_at);

create table if not exists public.tenant_newsletter_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  message_id uuid not null references public.tenant_newsletter_messages(id) on delete cascade,
  subscriber_id uuid references public.tenant_newsletter_subscribers(id) on delete set null,
  trigger_event_id uuid references public.tenant_newsletter_trigger_events(id) on delete set null,
  recipient_email text not null,
  provider_message_id text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed', 'skipped')),
  open_count integer not null default 0,
  click_count integer not null default 0,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  first_clicked_at timestamptz,
  last_clicked_at timestamptz,
  last_clicked_url text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create unique index if not exists tenant_newsletter_deliveries_provider_uidx
  on public.tenant_newsletter_deliveries (provider_message_id)
  where provider_message_id is not null;
create unique index if not exists tenant_newsletter_campaign_recipient_uidx
  on public.tenant_newsletter_deliveries (message_id, recipient_email)
  where trigger_event_id is null;
create unique index if not exists tenant_newsletter_automation_event_uidx
  on public.tenant_newsletter_deliveries (message_id, trigger_event_id, recipient_email)
  where trigger_event_id is not null;
create index if not exists tenant_newsletter_deliveries_metrics_idx
  on public.tenant_newsletter_deliveries (tenant_id, created_at desc);

create table if not exists public.tenant_newsletter_unsubscribe_feedback (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  subscriber_id uuid references public.tenant_newsletter_subscribers(id) on delete set null,
  email text not null,
  reason_code text,
  reason_text text,
  source text not null default 'unsubscribe_page',
  created_at timestamptz not null default now()
);

alter table public.tenant_newsletter_subscribers enable row level security;
alter table public.tenant_newsletter_messages enable row level security;
alter table public.tenant_newsletter_trigger_events enable row level security;
alter table public.tenant_newsletter_deliveries enable row level security;
alter table public.tenant_newsletter_unsubscribe_feedback enable row level security;

revoke all on public.tenant_newsletter_subscribers from anon, authenticated;
revoke all on public.tenant_newsletter_messages from anon, authenticated;
revoke all on public.tenant_newsletter_trigger_events from anon, authenticated;
revoke all on public.tenant_newsletter_deliveries from anon, authenticated;
revoke all on public.tenant_newsletter_unsubscribe_feedback from anon, authenticated;

grant all on public.tenant_newsletter_subscribers to service_role;
grant all on public.tenant_newsletter_messages to service_role;
grant all on public.tenant_newsletter_trigger_events to service_role;
grant all on public.tenant_newsletter_deliveries to service_role;
grant all on public.tenant_newsletter_unsubscribe_feedback to service_role;
