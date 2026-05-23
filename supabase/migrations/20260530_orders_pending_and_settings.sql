-- Order flow: pending confirmation, dine-in vs takeaway option,
-- per-location order settings (with tenant fallback).

-- ── orders: nuovi campi ─────────────────────────────────────────────────────
-- dine_option distingue "mangia qui" (vassoio) da "asporto" (sacchetto)
-- per locali senza tavoli numerati. Per ordini al tavolo via QR resta NULL.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dine_option text
    CHECK (dine_option IN ('dine_in', 'takeaway')),
  ADD COLUMN IF NOT EXISTS confirmed_at            timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_accepted           boolean NOT NULL DEFAULT false;

-- Lo status precedente era validato lato app; non c'è un CHECK su orders.status
-- nelle migrations note. Aggiungiamo i nuovi stati come valori app-side soltanto
-- per non rompere righe esistenti. (Se in futuro vorremo un enum/CHECK, va fatto
-- in una migration dedicata con backfill.)

CREATE INDEX IF NOT EXISTS orders_status_idx
  ON public.orders (status);

CREATE INDEX IF NOT EXISTS orders_pending_expires_idx
  ON public.orders (confirmation_expires_at)
  WHERE status = 'pending_confirmation';

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

  -- Finestre orarie rispetto agli orari di apertura del locale (in minuti).
  -- Esempio: takeaway_window_before_open_min = 15  → ordini aperti 15' prima dell'apertura
  --          takeaway_window_before_close_min = 30 → chiusi 30' prima della chiusura
  -- NULL = nessun limite su quel lato.
  takeaway_window_before_open_min  integer,
  takeaway_window_before_close_min integer,
  dine_in_window_before_open_min   integer,
  dine_in_window_before_close_min  integer,

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
