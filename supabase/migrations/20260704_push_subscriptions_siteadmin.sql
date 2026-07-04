-- Web Push per utenti siteadmin del pannello admin piattaforma:
-- le subscription possono ora essere legate a un tenant (flussi esistenti)
-- oppure a un siteadmin (notifiche admin, es. mail assegnate).

alter table push_subscriptions
  alter column tenant_id drop not null;

alter table push_subscriptions
  add column if not exists siteadmin_id uuid references siteadmin(id) on delete cascade;

alter table push_subscriptions
  drop constraint if exists push_subscriptions_target_check,
  add constraint push_subscriptions_target_check
    check (tenant_id is not null or siteadmin_id is not null);

create index if not exists push_subscriptions_siteadmin_id_idx
  on push_subscriptions (siteadmin_id)
  where siteadmin_id is not null;
