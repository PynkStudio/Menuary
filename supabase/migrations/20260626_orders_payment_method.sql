-- Metodo di pagamento scelto dal cliente (telefono/checkout), distinto dal solo
-- payment_status. Serve per: template WhatsApp, opzioni checkout e riga pagamento
-- sulla comanda (pagato/non pagato + contanti/carta).
--
--   online            → paga adesso con carta (Stripe). payment_status pending→paid.
--   on_delivery_cash  → paga alla consegna in contanti. Auto-accettato, non pagato.
--   on_delivery_card  → paga alla consegna con carta (POS). Auto-accettato, non pagato.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text;

-- Cambio metodo dal checkout (entro la finestra di edit): timestamp per richiedere la
-- ristampa di una comanda di "variazione". Se valorizzato e successivo a
-- comanda_printed_at, il modulo stampa produce una comanda di aggiornamento.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method_changed_at timestamptz;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS comanda_update_printed_at timestamptz;
