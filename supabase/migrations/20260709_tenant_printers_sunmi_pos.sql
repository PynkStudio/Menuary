-- Aggiunge la modalità SUNMI POS locale al modulo printStations.
--
-- sunmi_pos non sostituisce sunmi_cloud: il cloud resta server-side, mentre
-- questa modalità viene gestita da una app Android installata sul terminale POS
-- SUNMI che polla la coda comande e stampa con la stampante integrata.

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
  CHECK (connection IN ('qz', 'network_eposprint', 'printnode', 'sunmi_cloud', 'sunmi_pos'));
