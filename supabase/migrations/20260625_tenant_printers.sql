-- Modulo "Stampanti e reparti" (feature flag printStations): configurazione
-- delle stampanti comande per tenant/sede.
--
-- Il ponte verso la stampante è QZ Tray, un servizio locale sul PC cassa Windows
-- che espone le stampanti installate (anche USB) via WebSocket su localhost. La
-- web app (KDS / cassa operativa) si connette e invia la comanda in ESC/POS raw.
--
-- Schema PREDISPOSTO per il multi-stampante (più righe per sede, routing per
-- "station" e per categorie di menu), ma la UI iniziale gestisce una sola
-- stampante per locale. Vedi TODO(multi-printer) nel codice applicativo.

CREATE TABLE IF NOT EXISTS public.tenant_printers (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   text        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  location_id uuid        REFERENCES public.locations(id) ON DELETE CASCADE,

  -- Etichetta mostrata in gestione (es. "Cucina", "Bar").
  name text NOT NULL DEFAULT 'Cucina',

  -- Ponte/protocollo. Per ora solo 'qz' (QZ Tray locale). Predisposto per
  -- 'network_eposprint' (Epson ePOS diretto su IP) e 'printnode' (cloud) futuri.
  connection text NOT NULL DEFAULT 'qz'
    CHECK (connection IN ('qz', 'network_eposprint', 'printnode')),

  -- Nome della stampante così come QZ Tray la vede sull'OS (es. "EPSON TM-T20III").
  qz_printer_name text,

  -- TODO(multi-printer): routing per reparto. NULL = stampa tutto.
  station text CHECK (station IN ('cucina', 'bar', 'pizzeria', 'banco')),

  -- TODO(multi-printer): routing per categorie di menu (id categoria).
  -- Array vuoto / NULL = nessun filtro, la stampante riceve tutte le righe.
  categories text[],

  -- Larghezza carta in caratteri: 48 = 80mm, 32 = 58mm.
  char_width integer NOT NULL DEFAULT 48 CHECK (char_width BETWEEN 24 AND 64),

  copies integer NOT NULL DEFAULT 1 CHECK (copies BETWEEN 1 AND 5),

  -- Stampa automatica della comanda all'arrivo di un nuovo ordine.
  auto_print boolean NOT NULL DEFAULT true,

  -- Stampante predefinita del locale: usata quando non c'è routing specifico.
  is_default boolean NOT NULL DEFAULT true,

  enabled boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_printers_tenant_id_idx
  ON public.tenant_printers (tenant_id);

CREATE INDEX IF NOT EXISTS tenant_printers_tenant_location_idx
  ON public.tenant_printers (tenant_id, location_id);

-- Una sola stampante "default" per (tenant, location). Due indici parziali per
-- distinguere la riga default di sede da quella default tenant (location NULL).
CREATE UNIQUE INDEX IF NOT EXISTS tenant_printers_default_tenant_idx
  ON public.tenant_printers (tenant_id)
  WHERE is_default AND location_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tenant_printers_default_location_idx
  ON public.tenant_printers (tenant_id, location_id)
  WHERE is_default AND location_id IS NOT NULL;

-- updated_at trigger (la funzione set_updated_at esiste già da migration precedenti).
DROP TRIGGER IF EXISTS tenant_printers_set_updated_at ON public.tenant_printers;
CREATE TRIGGER tenant_printers_set_updated_at
  BEFORE UPDATE ON public.tenant_printers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Config non pubblica: solo l'admin del tenant la legge/scrive. I percorsi
-- server (KDS/cassa) usano il service client che bypassa la RLS.
ALTER TABLE public.tenant_printers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "printers_admin_all" ON public.tenant_printers
  FOR ALL
  USING (can_admin_tenant(tenant_id))
  WITH CHECK (can_admin_tenant(tenant_id));
