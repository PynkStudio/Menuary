-- Ordini telefonici "diretti" e annullamenti con causale.
--
-- direct_orders: l'ordine creato dall'assistente (Retell/WhatsApp) nasce già confermato
--   e la comanda parte subito; niente finestra di modifica di 2 minuti, niente modifiche
--   o pagamento Stripe dal link inviato al cliente (solo riepilogo).
-- order_cancel_window_minutes: per quanti minuti dalla creazione il locale può annullare
--   un ordine dal pannello. NULL = nessun limite (comportamento storico).
-- orders.cancellation_*: causale scelta dal locale. Servono a capire cosa correggere nel
--   prodotto e a non addebitare la chiamata che ha generato un ordine annullato.
-- orders.retell_call_id: la chiamata Retell che ha generato l'ordine, collegata dal
--   webhook di fine chiamata.

alter table public.tenant_ai_phone_settings
  add column if not exists direct_orders boolean not null default false,
  add column if not exists order_cancel_window_minutes integer
    check (order_cancel_window_minutes is null or order_cancel_window_minutes between 1 and 1440);

alter table public.orders
  add column if not exists cancellation_reason text
    check (cancellation_reason is null or cancellation_reason in (
      'fuori_area', 'ordine_finto', 'prodotti_esauriti', 'richiesta_cliente', 'altro'
    )),
  add column if not exists cancellation_note text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid,
  add column if not exists retell_call_id text;

create index if not exists orders_retell_call_id_idx on public.orders (retell_call_id) where retell_call_id is not null;
create index if not exists orders_cancelled_at_idx on public.orders (cancelled_at) where cancelled_at is not null;

update public.tenant_ai_phone_settings
   set direct_orders = true,
       order_cancel_window_minutes = 5
 where tenant_id = 'kimos';
