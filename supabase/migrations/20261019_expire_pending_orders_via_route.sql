-- La finalizzazione a scadenza degli ordini Retell/WhatsApp deve far uscire la comanda.
-- La funzione SQL `expire_pending_orders()` cambia solo lo stato: non può chiamare
-- SUNMI né mandare il push allo staff. Da qui in poi:
--   1. ogni minuto pg_cron chiama la route Next `/api/cron/expire-pending-orders`, che
--      finalizza con `finalizePendingOrder` (stampa + push) e ritenta le comande cloud
--      non uscite;
--   2. la funzione SQL resta come fallback, ma tocca solo ordini scaduti da più di
--      3 minuti (route irraggiungibile o in timeout). Quelli li ristampa poi il ripasso
--      della route appena torna raggiungibile.
-- URL e segreto vengono da Supabase Vault (`app_url`, `cron_secret`), non dal testo del job.

create or replace function public.expire_pending_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.orders
     set status = 'nuovo',
         payment_method = coalesce(payment_method, 'on_delivery_cash'),
         payment_status = case
           when payment_status = 'paid' then payment_status
           else 'not_required'
         end,
         payment_provider = case
           when payment_status = 'paid' then payment_provider
           else null
         end,
         confirmed_at = coalesce(confirmed_at, now()),
         auto_accepted = true,
         confirmation_expires_at = null,
         updated_at = now()
   where status = 'pending_confirmation'
     and confirmation_expires_at < now() - interval '3 minutes';

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.expire_pending_orders() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'expire-pending-orders-http') then
    perform cron.unschedule('expire-pending-orders-http');
  end if;
end;
$$;

select cron.schedule(
  'expire-pending-orders-http',
  '* * * * *',
  $$
    select net.http_get(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_url') || '/api/cron/expire-pending-orders',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      timeout_milliseconds := 55000
    );
  $$
);
