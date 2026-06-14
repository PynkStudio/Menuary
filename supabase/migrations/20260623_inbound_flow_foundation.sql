-- Fase 1 — Fondamenta del flusso inbound lead → tenant.
-- 1. Proposta commerciale sul lead (scelta PRIMA della demo, alimenta demo/contratto/abbonamento).
-- 2. Abbonamento unico su DB con campi per attivazione + dunning (no più localStorage).
-- 3. Pagamenti distinti primo/rinnovo per gestire solleciti e sospensione a 15gg.
-- Tutte additive (add column if not exists) → sicure su DB esistente.

-- ─── 1. Proposta commerciale sul lead ───────────────────────────────────────────
alter table public.platform_leads
  add column if not exists proposed_package_slug    text,
  add column if not exists proposed_addons          text[]  not null default '{}',
  add column if not exists proposed_extra_modules   text[]  not null default '{}',
  add column if not exists proposed_billing_cycle   text,                 -- monthly | yearly
  add column if not exists proposed_setup_amount    numeric(10, 2),
  add column if not exists proposed_recurring_amount numeric(10, 2),      -- override prezzo concordato (null = listino)
  add column if not exists proposal_updated_at      timestamptz;

-- ─── 2. Abbonamento: attivazione + dunning ─────────────────────────────────────
alter table public.platform_subscriptions
  add column if not exists contract_id          uuid references public.platform_contracts (id) on delete set null,
  add column if not exists tenant_id            text references public.tenants (id) on delete set null,
  add column if not exists package_slug         text,                    -- catalogo reale (PLATFORM_PACKAGES) vive in codice, non in platform_packages
  add column if not exists payment_method       text,                    -- bonifico | bunq | carta | sdd
  add column if not exists setup_amount         numeric(10, 2),
  add column if not exists first_payment_amount numeric(10, 2),
  add column if not exists official_domain      text,
  add column if not exists activated_at         timestamptz,
  add column if not exists suspended_at         timestamptz,
  add column if not exists grace_until          date,                    -- scadenza pagamento corrente + 15gg → oltre = sospensione
  add column if not exists last_reminder_at     date;                    -- anti-doppio-invio reminder nel cron

-- package_id era NOT NULL con FK alla tabella legacy platform_packages; il catalogo
-- reale ora è in codice → rendiamo opzionale e usiamo package_slug.
alter table public.platform_subscriptions
  alter column package_id drop not null;

-- status ammette ora anche 'pending_payment' (firmato, in attesa del primo pagamento).
-- Colonna text senza check constraint: nessuna migrazione necessaria sui valori.

create index if not exists platform_subscriptions_contract_idx on public.platform_subscriptions (contract_id);
create index if not exists platform_subscriptions_grace_idx
  on public.platform_subscriptions (grace_until)
  where status in ('pending_payment', 'active');

-- ─── 3. Pagamenti: primo vs rinnovo ─────────────────────────────────────────────
alter table public.platform_payments
  add column if not exists kind            text not null default 'first',  -- first | renewal
  add column if not exists paid_at         timestamptz,
  add column if not exists reminder_sent_at date;

comment on column public.platform_payments.kind is 'first = setup + primo canone; renewal = canone di rinnovo';
comment on column public.platform_subscriptions.grace_until is 'Oltre questa data senza pagamento il tenant viene sospeso (15gg da contratto)';
