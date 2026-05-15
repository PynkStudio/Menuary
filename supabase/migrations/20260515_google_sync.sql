-- ─── Google Sync: recensioni e My Business ────────────────────────────────────
-- Aggiunge il supporto per il polling automatico di Google Places Reviews
-- e predispone le strutture per la futura integrazione Google My Business.

-- reviews.source distingue le recensioni importate da Google da quelle inserite
-- manualmente nel backoffice. Valore default "manual" per retrocompatibilità.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

ALTER TABLE reviews
  ADD CONSTRAINT reviews_source_check
  CHECK (source IN ('manual', 'google_places'));

-- Indice per filtrare velocemente le recensioni Google da eliminare/sostituire
-- al prossimo ciclo di sync.
CREATE INDEX IF NOT EXISTS reviews_tenant_source_idx
  ON reviews (tenant_id, source);

-- ─── google_sync_log ──────────────────────────────────────────────────────────
-- Traccia ogni esecuzione del job di sync per tenant.
-- Usata dalla logica di scheduling per determinare se un tenant va processato:
--   • active  → ultimo sync > 30 giorni fa (o mai eseguito)
--   • trial   → nessun sync precedente con status 'success'
--   • offline → mai processato (il job salta il tenant prima di inserire qui)
CREATE TABLE IF NOT EXISTS google_sync_log (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id      text        NOT NULL,
  synced_at      timestamptz NOT NULL DEFAULT now(),
  reviews_fetched int,
  rating         numeric(3,1),
  rating_count   int,
  status         text        NOT NULL DEFAULT 'success',
  error_message  text,

  CONSTRAINT google_sync_log_status_check
    CHECK (status IN ('success', 'error', 'skipped'))
);

-- lookup per tenant + data (usato dal controllo "quando è stato l'ultimo sync?")
CREATE INDEX IF NOT EXISTS google_sync_log_tenant_synced_idx
  ON google_sync_log (tenant_id, synced_at DESC);
