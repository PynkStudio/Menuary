-- Aggiunge supporto a eccezioni orarie con intervallo e ricorrenza settimanale.
-- kind: 'single' (default), 'range', 'weekly-in-range'
-- end_date: data di fine per range/weekly-in-range
-- weekday: 0=lun … 6=dom, usato solo da weekly-in-range

ALTER TABLE tenant_special_hours
  ADD COLUMN IF NOT EXISTS kind     text    NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS weekday  integer
    CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'special_hours_end_date_required'
      AND conrelid = 'tenant_special_hours'::regclass
  ) THEN
    ALTER TABLE tenant_special_hours
      ADD CONSTRAINT special_hours_end_date_required CHECK (
        (kind = 'single' AND end_date IS NULL) OR
        (kind IN ('range', 'weekly-in-range') AND end_date IS NOT NULL)
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'special_hours_weekday_required'
      AND conrelid = 'tenant_special_hours'::regclass
  ) THEN
    ALTER TABLE tenant_special_hours
      ADD CONSTRAINT special_hours_weekday_required CHECK (
        (kind = 'weekly-in-range' AND weekday IS NOT NULL) OR
        (kind != 'weekly-in-range' AND weekday IS NULL)
      );
  END IF;
END$$;

ALTER TABLE tenant_special_hours
  DROP CONSTRAINT IF EXISTS tenant_special_hours_unique;
