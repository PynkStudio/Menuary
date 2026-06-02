-- Token pubblico per checkout via link (WA/SMS/Retell).
-- Il codice ordine (B001, B002…) è sequenziale e quindi enumerabile:
-- il token aggiunge una componente unguessable per autorizzare la lettura
-- pubblica dell'ordine sulla pagina /checkout/[code]?t=[token].

create extension if not exists pgcrypto;

alter table public.orders
  add column if not exists public_token text;

-- Popola il token su tutte le righe esistenti senza valore.
update public.orders
   set public_token = encode(gen_random_bytes(16), 'hex')
 where public_token is null;

-- Default per inserimenti futuri.
alter table public.orders
  alter column public_token set default encode(gen_random_bytes(16), 'hex');

alter table public.orders
  alter column public_token set not null;

create unique index if not exists orders_public_token_uidx
  on public.orders(public_token);

-- Lookup tipico nella pagina checkout: (tenant_id, code).
create index if not exists orders_tenant_code_idx
  on public.orders(tenant_id, code);

comment on column public.orders.public_token is
  'Token random 32-char per autorizzare la lettura pubblica dell''ordine sulla pagina /checkout/[code]?t=[token]. Generato server-side, non esposto a chi non ha il link.';
