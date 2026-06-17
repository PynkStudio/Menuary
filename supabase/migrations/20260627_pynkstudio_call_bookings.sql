-- Prenotazioni call di consulenza (PynkStudio): flusso "prenota-call" stile Calendly.
-- Slot da 20 min, lun-ven 10:00-18:00 (Europe/Rome). Una riga = una call confermata.
-- Accesso solo via service-role nelle API route: nessuna policy pubblica.

create table if not exists public.consultation_bookings (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         text not null,
  name              text not null,
  email             text not null,
  phone             text not null,
  topic             text not null,
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  status            text not null default 'confirmed'
                      check (status in ('confirmed', 'cancelled')),
  reminder_sent_at  timestamptz,
  created_at        timestamptz not null default now()
);

-- Impedisce doppia prenotazione dello stesso slot (solo tra le confermate).
create unique index if not exists consultation_bookings_slot_unique
  on public.consultation_bookings (tenant_id, starts_at)
  where status = 'confirmed';

-- Lookup per la vista agenda admin e per il cron reminder.
create index if not exists consultation_bookings_tenant_start_idx
  on public.consultation_bookings (tenant_id, starts_at);

alter table public.consultation_bookings enable row level security;
-- Nessuna policy: anon/authenticated non accedono. Tutto passa dal service-role.

-- ── Cron reminder 20 min prima (pg_cron + pg_net) ────────────────────────────
-- Stesso pattern di 20260615_subscription_renewals_pgcron.sql.
-- Prerequisiti nel Vault Supabase: app_url, cron_secret (= CRON_SECRET su Vercel).

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

  if exists (select 1 from cron.job where jobname = 'pynkstudio-call-reminders') then
    perform cron.unschedule('pynkstudio-call-reminders');
  end if;

  if app_url is null or cron_secret is null then
    raise warning 'pynkstudio-call-reminders cron NON schedulato: aggiungi app_url e cron_secret al Vault, poi rilancia questo blocco.';
    return;
  end if;

  perform cron.schedule(
    'pynkstudio-call-reminders',
    '* * * * *',
    format(
      $job$
        select net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || %L
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 25000
        );
      $job$,
      rtrim(app_url, '/') || '/api/cron/pynkstudio-call-reminders',
      cron_secret
    )
  );
end$$;
