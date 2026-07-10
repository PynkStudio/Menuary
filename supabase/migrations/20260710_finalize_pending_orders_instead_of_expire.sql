-- Gli ordini Retell/WhatsApp restano modificabili per una finestra breve.
-- Alla scadenza non vanno annullati: si confermano con default contanti e
-- diventano stampabili/fatturabili.

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
     and confirmation_expires_at < now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.expire_pending_orders() from public, anon, authenticated;
