-- Orari per-sede: aggiunge locations.hours (jsonb), backfill da tenants.hours
-- su tutte le sedi esistenti, e trigger che impedisce di lasciare un tenant
-- senza sedi (impossibile DELETE dell'ultima location attiva).
--
-- tenants.hours rimane come fallback di compatibilità: i lettori devono
-- preferire locations.hours per la sede attiva, ricadendo su tenants.hours
-- solo se la sede non ha orari propri.

-- ── Colonna hours su locations ──────────────────────────────────────────────
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS hours jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ── Backfill: copia tenants.hours su tutte le sedi del tenant ───────────────
-- Solo dove la location ha ancora il default (array vuoto), così la migrazione
-- è idempotente e non sovrascrive dati già inseriti per-sede.
UPDATE locations l
SET    hours = t.hours
FROM   tenants t
WHERE  l.tenant_id = t.id
  AND  l.hours = '[]'::jsonb
  AND  t.hours IS NOT NULL
  AND  jsonb_array_length(t.hours) > 0;

-- ── Trigger: vieta DELETE dell'ultima location di un tenant ─────────────────
CREATE OR REPLACE FUNCTION public.prevent_orphan_tenant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  remaining int;
BEGIN
  SELECT count(*)
    INTO remaining
    FROM locations
   WHERE tenant_id = OLD.tenant_id
     AND id <> OLD.id;

  IF remaining = 0 THEN
    RAISE EXCEPTION 'Impossibile eliminare l''ultima sede del tenant %: ogni tenant deve avere almeno una sede.', OLD.tenant_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_orphan_tenant ON locations;
CREATE TRIGGER trg_prevent_orphan_tenant
  BEFORE DELETE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_orphan_tenant();

-- ── tenant_special_hours: unique key include location_id ───────────────────
-- L'unique originale (tenant_id, date) impedisce di avere lo stesso giorno
-- straordinario configurato su due sedi diverse dello stesso tenant. Lo
-- estendiamo con location_id usando NULLS NOT DISTINCT così un record
-- "globale" (location_id NULL) resta unico per tenant+data.
ALTER TABLE tenant_special_hours
  DROP CONSTRAINT IF EXISTS tenant_special_hours_unique;

ALTER TABLE tenant_special_hours
  ADD CONSTRAINT tenant_special_hours_unique
  UNIQUE NULLS NOT DISTINCT (tenant_id, date, location_id);

COMMENT ON COLUMN locations.hours IS
  'Orario settimanale per la sede. Formato DaySchedule[] (jsonb). Fallback su tenants.hours se array vuoto.';
COMMENT ON FUNCTION public.prevent_orphan_tenant() IS
  'Vieta la cancellazione dell''ultima sede di un tenant. Un tenant senza sedi è invalido.';

-- ── RPC: crea tenant + prima sede in transazione ────────────────────────────
-- Garantisce l'invariante: un tenant non può esistere senza almeno una sede.
-- L'INSERT in tenants e l'INSERT della prima location avvengono nella stessa
-- transazione; se uno fallisce, l'altro viene rollbackato automaticamente.
CREATE OR REPLACE FUNCTION public.create_tenant_with_location(
  p_tenant_id      text,
  p_name           text,
  p_label          text,
  p_vertical       text,
  p_status         text,
  p_domains        text[],
  p_preview_slug   text,
  p_theme          jsonb,
  p_features       jsonb,
  p_location_slug  text,
  p_location_name  text,
  p_address        text,
  p_city           text DEFAULT NULL,
  p_phone          text DEFAULT NULL,
  p_email          text DEFAULT NULL
)
RETURNS TABLE(tenant_id text, location_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_loc_id uuid;
BEGIN
  INSERT INTO tenants (id, name, label, domains, preview_slug, enabled, vertical, status, theme, features, hours)
  VALUES (p_tenant_id, p_name, p_label, COALESCE(p_domains, '{}'), p_preview_slug, true, p_vertical, p_status, p_theme, p_features, '[]'::jsonb);

  INSERT INTO locations (tenant_id, slug, name, address, city, phone, email, is_default, hours)
  VALUES (p_tenant_id, p_location_slug, p_location_name, p_address, p_city, p_phone, p_email, true, '[]'::jsonb)
  RETURNING id INTO new_loc_id;

  RETURN QUERY SELECT p_tenant_id, new_loc_id;
END;
$$;

COMMENT ON FUNCTION public.create_tenant_with_location IS
  'Crea atomicamente un tenant + la sua prima sede (con indirizzo). Un tenant nasce sempre con almeno una sede.';
