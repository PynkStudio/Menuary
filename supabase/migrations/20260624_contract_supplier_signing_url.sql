alter table public.platform_contracts
  add column if not exists counterparty_signing_url text;

comment on column public.platform_contracts.counterparty_signing_url is
  'Link Documenso del secondo firmatario (fornitore), separato dal link cliente.';
