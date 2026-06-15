-- Schedula il cron rinnovi/dunning su Supabase (pg_cron + pg_net), non su Vercel
-- (piano Hobby: niente cron Vercel). Chiama la route Next via HTTP una volta al giorno.
--
-- Prerequisiti nel Supabase Vault (Project Settings → Vault):
--   app_url      → URL pubblico dell'app (es. https://admin.menuary.it)
--   cron_secret  → stesso valore di CRON_SECRET nelle env di Vercel
-- Se mancano, il job non viene schedulato (warning) → aggiungili e rilancia il blocco.

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

  if exists (select 1 from cron.job where jobname = 'subscription-renewals') then
    perform cron.unschedule('subscription-renewals');
  end if;

  if app_url is null or cron_secret is null then
    raise warning 'subscription-renewals cron NON schedulato: aggiungi app_url e cron_secret al Vault, poi rilancia questo blocco.';
    return;
  end if;

  perform cron.schedule(
    'subscription-renewals',
    '0 6 * * *',
    format(
      $job$
        select net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || %L
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 55000
        );
      $job$,
      rtrim(app_url, '/') || '/api/cron/subscription-renewals',
      cron_secret
    )
  );
end$$;
