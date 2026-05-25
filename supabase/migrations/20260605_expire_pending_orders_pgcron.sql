-- Sostituisce il cron Vercel "expire-pending-orders" (* * * * *),
-- non eseguibile sul piano Hobby (max 1/giorno), con pg_cron lato Supabase.

create extension if not exists pg_cron with schema extensions;

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
     set status = 'expired',
         updated_at = now()
   where status = 'pending_confirmation'
     and confirmation_expires_at < now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.expire_pending_orders() from public, anon, authenticated;

do $$
begin
  if exists (
    select 1 from cron.job where jobname = 'expire-pending-orders'
  ) then
    perform cron.unschedule('expire-pending-orders');
  end if;
end$$;

select cron.schedule(
  'expire-pending-orders',
  '* * * * *',
  $$select public.expire_pending_orders();$$
);
