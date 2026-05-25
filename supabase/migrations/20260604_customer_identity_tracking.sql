-- Tracciamento clienti da canali conversazionali e form.
-- Ogni ordine/prenotazione puo' essere collegato al profilo CRM tenant,
-- registrato Menuary o contatto non registrato creato da telefono.

alter table public.orders
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

alter table public.reservation_requests
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

create index if not exists orders_customer_id_idx
  on public.orders(customer_id)
  where customer_id is not null;

create index if not exists reservation_requests_customer_id_idx
  on public.reservation_requests(customer_id)
  where customer_id is not null;

create index if not exists customers_tenant_phone_normalized_idx
  on public.customers(tenant_id, phone)
  where phone is not null;

comment on column public.orders.customer_id is
  'Profilo CRM tenant associato tramite numero cliente o account Menuary.';

comment on column public.reservation_requests.customer_id is
  'Profilo CRM tenant associato tramite numero cliente o account Menuary.';

