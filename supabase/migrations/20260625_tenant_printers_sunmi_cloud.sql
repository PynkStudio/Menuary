-- Aggiunge il supporto alle stampanti cloud SUNMI al modulo printStations.
--
-- SUNMI Cloud Printer: stampante che si collega da sola a internet e al cloud
-- SUNMI. Il nostro server "pusha" un messaggio firmato (app_id/app_key, MD5) e la
-- stampante scarica il contenuto ESC/POS dal NOSTRO endpoint di callback. È un
-- percorso 100% server-side (nessun PC/QZ Tray). Vedi src/lib/printing/sunmi-cloud.ts.

-- 1) Estendi i valori ammessi per `connection` includendo 'sunmi_cloud'.
DO $$
DECLARE cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint c
  JOIN pg_class r ON r.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = r.relnamespace
  WHERE n.nspname = 'public' AND r.relname = 'tenant_printers'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%connection%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.tenant_printers DROP CONSTRAINT %I', cname);
  END IF;
END$$;

ALTER TABLE public.tenant_printers
  ADD CONSTRAINT tenant_printers_connection_check
  CHECK (connection IN ('qz', 'network_eposprint', 'printnode', 'sunmi_cloud'));

-- 2) Numero di serie del device cloud (es. SUNMI SN). Per QZ resta NULL.
ALTER TABLE public.tenant_printers
  ADD COLUMN IF NOT EXISTS device_sn text;
