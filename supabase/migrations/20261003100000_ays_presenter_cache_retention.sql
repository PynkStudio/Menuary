create table if not exists public.ays_presenter_cache_entries (
  cache_key text primary key,
  object_path text not null unique,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now(),
  hit_count bigint not null default 0
);

create index if not exists ays_presenter_cache_last_accessed_idx
  on public.ays_presenter_cache_entries (last_accessed_at);

alter table public.ays_presenter_cache_entries enable row level security;

create or replace function public.touch_ays_presenter_cache(p_cache_key text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ays_presenter_cache_entries
  set last_accessed_at = now(), hit_count = hit_count + 1
  where cache_key = p_cache_key;
$$;

revoke all on function public.touch_ays_presenter_cache(text) from public, anon, authenticated;
grant execute on function public.touch_ays_presenter_cache(text) to service_role;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  app_url text;
  cron_secret text;
begin
  select decrypted_secret into app_url
  from vault.decrypted_secrets where name = 'app_url';

  select decrypted_secret into cron_secret
  from vault.decrypted_secrets where name = 'cron_secret';

  if exists (select 1 from cron.job where jobname = 'ays-presenter-cache-retention') then
    perform cron.unschedule('ays-presenter-cache-retention');
  end if;

  if app_url is null or cron_secret is null then
    raise warning 'AYS presenter cache cleanup not scheduled: configure app_url and cron_secret in Vault.';
    return;
  end if;

  perform cron.schedule(
    'ays-presenter-cache-retention',
    '17 4 * * *',
    format(
      $cron$select net.http_get(url := %L, headers := jsonb_build_object('Authorization', 'Bearer ' || %L));$cron$,
      rtrim(app_url, '/') || '/api/cron/ays-presenter-cache',
      cron_secret
    )
  );
end $$;
