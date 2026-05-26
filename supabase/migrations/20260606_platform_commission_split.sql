-- Aggiorna provvigioni piattaforma:
-- - 30% per chi chiude la vendita
-- - 10% per chi ha inserito il lead
-- - base sempre setup + canone del primo pagamento commerciale

alter table public.platform_leads
  add column if not exists created_by_id uuid references auth.users (id) on delete set null,
  add column if not exists created_by_name text;

alter table public.platform_commissions
  add column if not exists commission_kind text not null default 'closing';

alter table public.platform_commissions
  drop constraint if exists platform_commissions_subscription_id_seller_user_id_key;

create unique index if not exists platform_commissions_subscription_seller_kind_uidx
  on public.platform_commissions (subscription_id, seller_user_id, commission_kind);

update public.siteadmin
set commission_rate = case
  when role = 'lead_inserter' then 10
  else 30
end;

update public.platform_subscriptions ps
set first_payment_amount = coalesce(ps.setup_amount, 0) + coalesce(
  ps.price_override,
  case
    when ps.billing_cycle = 'yearly' then coalesce(pp.price_yearly, pp.price_monthly * 12)
    else pp.price_monthly
  end,
  0
)
from public.platform_packages pp
where pp.id = ps.package_id;

update public.platform_commissions
set first_payment_amount = coalesce(setup_amount, 0) + coalesce(recurring_amount, 0);

comment on column public.platform_leads.created_by_id is 'Utente interno che ha creato/inserito il lead nel CRM.';
comment on column public.platform_leads.created_by_name is 'Snapshot nome utente interno che ha inserito il lead.';
comment on column public.platform_commissions.commission_kind is 'closing = provvigione chiusura 30%; lead_insert = provvigione inserimento lead 10%.';
