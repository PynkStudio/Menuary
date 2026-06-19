-- Modulo rider: profili rider, assegnazione ordini, pin delivery.

-- ── Estende l'enum order_status ──────────────────────────────────────────────
-- Postgres non consente ALTER TYPE dentro una transazione con DDL su enum,
-- ma ADD VALUE IF NOT EXISTS è safe da rieseguire.
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'in_consegna' AFTER 'pronto';

-- ── rider_profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rider_profiles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   text        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  access_code text        NOT NULL,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, access_code)
);

CREATE INDEX IF NOT EXISTS rider_profiles_tenant_idx
  ON public.rider_profiles(tenant_id);

COMMENT ON TABLE public.rider_profiles IS
  'Profili rider per tenant. I rider si autenticano con access_code, senza account Supabase.';

-- ── Estende orders con campi delivery + rider ─────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS rider_id           uuid       REFERENCES public.rider_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_pin_lat   double precision,
  ADD COLUMN IF NOT EXISTS delivery_pin_lng   double precision,
  ADD COLUMN IF NOT EXISTS delivery_address_text text,
  ADD COLUMN IF NOT EXISTS assigned_at        timestamptz,
  ADD COLUMN IF NOT EXISTS picked_up_at       timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at       timestamptz;

CREATE INDEX IF NOT EXISTS orders_rider_idx
  ON public.orders(rider_id)
  WHERE rider_id IS NOT NULL;

COMMENT ON COLUMN public.orders.rider_id             IS 'Rider assegnato per la consegna delivery.';
COMMENT ON COLUMN public.orders.delivery_pin_lat     IS 'Latitudine pin cliente (MapLibre) per la consegna.';
COMMENT ON COLUMN public.orders.delivery_pin_lng     IS 'Longitudine pin cliente (MapLibre) per la consegna.';
COMMENT ON COLUMN public.orders.delivery_address_text IS 'Indirizzo testuale inserito dal cliente al checkout.';
COMMENT ON COLUMN public.orders.assigned_at          IS 'Quando il rider è stato assegnato all''ordine.';
COMMENT ON COLUMN public.orders.picked_up_at         IS 'Quando il rider ha preso in carico l''ordine (in_consegna).';
COMMENT ON COLUMN public.orders.delivered_at         IS 'Quando la consegna è avvenuta.';

-- ── RLS rider_profiles ────────────────────────────────────────────────────────
ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;

-- Gestione (autenticati con ruolo tenantadmin/siteadmin/employee): lettura completa.
CREATE POLICY "rider_profiles_select_gestione"
  ON public.rider_profiles FOR SELECT
  USING (true);

-- Solo service role può inserire/modificare/eliminare (le API usano service client).
CREATE POLICY "rider_profiles_insert_service"
  ON public.rider_profiles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "rider_profiles_update_service"
  ON public.rider_profiles FOR UPDATE
  USING (false);

CREATE POLICY "rider_profiles_delete_service"
  ON public.rider_profiles FOR DELETE
  USING (false);
