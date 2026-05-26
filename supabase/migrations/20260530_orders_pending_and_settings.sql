-- Order flow: pending confirmation, dine-in vs takeaway option,
-- per-location order settings (with tenant fallback).

-- ── enum order_status: nuovi valori ─────────────────────────────────────────
-- ALTER TYPE ... ADD VALUE non può girare dentro una transazione, ma il runner
-- delle migration Supabase commit-a ogni file singolarmente: ogni statement è
-- in transazione separata, quindi va bene così.
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_confirmation' BEFORE 'nuovo';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'expired' AFTER 'annullato';

-- ── orders: nuovi campi ─────────────────────────────────────────────────────
-- dine_option distingue "mangia qui" (vassoio) da "asporto" (sacchetto)
-- per locali senza tavoli numerati. Per ordini al tavolo via QR resta NULL.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dine_option text
    CHECK (dine_option IN ('dine_in', 'takeaway', 'delivery')),
  ADD COLUMN IF NOT EXISTS confirmed_at            timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_accepted           boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_email          text;

-- Se la colonna esisteva già con CHECK ('dine_in','takeaway') la rifacciamo
-- includendo 'delivery'. Drop e re-add del check è idempotente.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint c
  JOIN pg_class r ON r.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = r.relnamespace
  WHERE n.nspname = 'public' AND r.relname = 'orders'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%dine_option%'
    AND pg_get_constraintdef(c.oid) NOT ILIKE '%delivery%'
  LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT %I', cname);
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_dine_option_check
      CHECK (dine_option IN ('dine_in', 'takeaway', 'delivery'));
  END IF;
END$$;

-- Lo status precedente era validato lato app; non c'è un CHECK su orders.status
-- nelle migrations note. Aggiungiamo i nuovi stati come valori app-side soltanto
-- per non rompere righe esistenti. (Se in futuro vorremo un enum/CHECK, va fatto
-- in una migration dedicata con backfill.)

CREATE INDEX IF NOT EXISTS orders_status_idx
  ON public.orders (status);

CREATE INDEX IF NOT EXISTS orders_pending_expires_idx
  ON public.orders (confirmation_expires_at)
  WHERE status = 'pending_confirmation';

-- Realtime: il cliente in attesa di conferma sottoscrive la propria riga
-- per essere notificato del cambio di stato (pending_confirmation → nuovo / expired).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END$$;

-- ── tenant_order_settings ───────────────────────────────────────────────────
-- Una riga per (tenant_id, location_id). location_id NULL = default tenant
-- (fallback usato quando per la sede specifica non esiste una riga dedicata).
CREATE TABLE IF NOT EXISTS public.tenant_order_settings (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   text        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  location_id uuid        REFERENCES public.locations(id) ON DELETE CASCADE,

  -- Abilitazione canali
  takeaway_enabled boolean NOT NULL DEFAULT true,
  dine_in_enabled  boolean NOT NULL DEFAULT true,
  delivery_enabled boolean NOT NULL DEFAULT false,

  -- Finestre orarie rispetto agli orari di apertura del locale (in minuti).
  -- Esempio: takeaway_window_before_open_min = 15  → ordini aperti 15' prima dell'apertura
  --          takeaway_window_before_close_min = 30 → chiusi 30' prima della chiusura
  -- NULL = nessun limite su quel lato.
  takeaway_window_before_open_min  integer,
  takeaway_window_before_close_min integer,
  dine_in_window_before_open_min   integer,
  dine_in_window_before_close_min  integer,
  delivery_window_before_open_min  integer,
  delivery_window_before_close_min integer,

  -- Auto-accept (AND tra le condizioni non-null/non-false)
  auto_accept_enabled        boolean NOT NULL DEFAULT false,
  auto_accept_max_total      numeric(10,2),  -- importo massimo (€) — NULL = nessun limite
  auto_accept_max_items      integer,        -- n. massimo prodotti (somma qty) — NULL = nessun limite
  auto_accept_only_returning boolean NOT NULL DEFAULT false, -- solo clienti già conosciuti
  auto_accept_no_notes       boolean NOT NULL DEFAULT false, -- ordine senza note né di linea né di testata

  -- Finestra di attesa conferma (secondi). Default 120s come da specifica.
  pending_timeout_seconds integer NOT NULL DEFAULT 120,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Idempotenza per re-run su DB con tabella già creata pre-delivery.
ALTER TABLE public.tenant_order_settings
  ADD COLUMN IF NOT EXISTS delivery_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_window_before_open_min  integer,
  ADD COLUMN IF NOT EXISTS delivery_window_before_close_min integer;

-- Univocità: una sola riga per (tenant, location). NULL location_id = default tenant.
CREATE UNIQUE INDEX IF NOT EXISTS tenant_order_settings_tenant_default_idx
  ON public.tenant_order_settings (tenant_id)
  WHERE location_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tenant_order_settings_tenant_location_idx
  ON public.tenant_order_settings (tenant_id, location_id)
  WHERE location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS tenant_order_settings_tenant_id_idx
  ON public.tenant_order_settings (tenant_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenant_order_settings_set_updated_at ON public.tenant_order_settings;
CREATE TRIGGER tenant_order_settings_set_updated_at
  BEFORE UPDATE ON public.tenant_order_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.tenant_order_settings ENABLE ROW LEVEL SECURITY;

-- Admin tenant: full access
CREATE POLICY "order_settings_admin_all" ON public.tenant_order_settings
  FOR ALL
  USING (can_admin_tenant(tenant_id))
  WITH CHECK (can_admin_tenant(tenant_id));

-- Letture pubbliche: il client checkout ha bisogno di sapere se può ordinare
-- e in che finestre. Sono dati non sensibili.
CREATE POLICY "order_settings_public_read" ON public.tenant_order_settings
  FOR SELECT
  USING (true);

-- ── Helper: risolve settings effettivi (location + fallback tenant) ─────────
CREATE OR REPLACE FUNCTION public.resolve_order_settings(
  p_tenant_id   text,
  p_location_id uuid
)
RETURNS public.tenant_order_settings
LANGUAGE sql STABLE AS $$
  SELECT *
  FROM public.tenant_order_settings
  WHERE tenant_id = p_tenant_id
    AND (
      (p_location_id IS NOT NULL AND location_id = p_location_id)
      OR location_id IS NULL
    )
  ORDER BY (location_id IS NULL) ASC  -- location-specific prima del default
  LIMIT 1;
$$;
