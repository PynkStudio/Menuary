-- Platform contracts: source of truth per i contratti piattaforma.
-- Sostituisce localStorage come storage primario per supportare webhook Documenso.

create table if not exists platform_contracts (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  brand text not null default 'menuary',
  status text not null default 'draft',
  lead_id uuid references platform_leads(id) on delete set null,
  package_slug text,

  -- Dati contratto (ContractData serializzato)
  contract_data jsonb not null,
  clause_overrides jsonb not null default '{}',

  -- Documenso
  documenso_envelope_id text,
  documenso_item_id text,
  signing_url text,

  -- Firma
  signed_at timestamptz,
  signed_document_path text,

  -- Pagamento
  payment_method text, -- 'carta' | 'bonifico' | 'sdd'
  payment_status text not null default 'pending', -- 'pending' | 'paid' | 'failed'
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,

  -- Attivazione tenant
  tenant_id text references tenants(id) on delete set null,
  tenant_activated_at timestamptz,

  -- Subscription collegata
  subscription_id uuid references platform_subscriptions(id) on delete set null,

  -- Timestamps
  sent_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_contracts_lead on platform_contracts(lead_id);
create index if not exists idx_platform_contracts_documenso on platform_contracts(documenso_envelope_id);
create index if not exists idx_platform_contracts_status on platform_contracts(status);
create index if not exists idx_platform_contracts_numero on platform_contracts(numero);

-- RLS: solo service_role e siteadmin accedono
alter table platform_contracts enable row level security;

create policy "Service role full access"
  on platform_contracts for all
  using (auth.role() = 'service_role');
