-- Aggiunge il campo tip_amount_cents agli ordini per tracciare le mance rider.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tip_amount_cents integer NOT NULL DEFAULT 0;
