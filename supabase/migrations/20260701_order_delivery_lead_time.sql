-- Lead time di gestione ordine + override giornalieri.
--
-- Contesto: l'agente telefonico (e il portale ordini) devono calcolare la prima
-- consegna possibile come "adesso + tempo medio di gestione". Il tempo medio è un
-- default per (tenant, sede) ma il ristorante può alzarlo SOLO PER OGGI nelle
-- giornate cariche, dal portale ordini; a fine giornata torna al default (la riga
-- override è per-data, quindi domani non esiste più).

-- 1. Tempo medio di gestione ordine (minuti). Default 45.
ALTER TABLE public.tenant_order_settings
  ADD COLUMN IF NOT EXISTS avg_handling_minutes integer NOT NULL DEFAULT 45;

-- 2. Override giornalieri per (tenant, sede, data). Oggi solo avg_handling_minutes,
--    ma la tabella è predisposta per altri campi override futuri.
CREATE TABLE IF NOT EXISTS public.tenant_order_daily_overrides (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            text NOT NULL,
  location_id          uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  service_date         date NOT NULL,
  avg_handling_minutes integer,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Una sola riga override per (tenant, sede, data). NULLS NOT DISTINCT così la sede
-- "default" (location_id NULL) collassa su un'unica riga per data (PG15+).
CREATE UNIQUE INDEX IF NOT EXISTS tenant_order_daily_overrides_unique
  ON public.tenant_order_daily_overrides (tenant_id, location_id, service_date)
  NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS tenant_order_daily_overrides_lookup
  ON public.tenant_order_daily_overrides (tenant_id, service_date);

ALTER TABLE public.tenant_order_daily_overrides ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica come tenant_order_settings (il portale/agente leggono lato server,
-- ma manteniamo coerenza con la policy esistente). Scrittura solo via service role.
CREATE POLICY "order_daily_overrides_public_read" ON public.tenant_order_daily_overrides
  FOR SELECT
  USING (true);
