-- Bookable services
-- Estende `menu_items` per supportare appuntamenti con durata preimpostata
-- (tenant verticale services: consulenze, visite, trattamenti, ecc.).
-- Aggiunge il link `service_id` su `reservation_requests` per collegare la
-- prenotazione al servizio scelto. Tutti i nuovi campi sono opzionali: i
-- tenant food restano invariati.

-- ── menu_items ──────────────────────────────────────────────────────────────
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS duration_minutes int,
  ADD COLUMN IF NOT EXISTS bookable boolean NOT NULL DEFAULT false;

-- Solo righe prenotabili devono avere una durata sensata.
ALTER TABLE menu_items
  DROP CONSTRAINT IF EXISTS menu_items_duration_positive;
ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_duration_positive
  CHECK (duration_minutes IS NULL OR duration_minutes > 0);

CREATE INDEX IF NOT EXISTS menu_items_bookable_idx
  ON menu_items(tenant_id, bookable)
  WHERE bookable = true;

-- ── reservation_requests ────────────────────────────────────────────────────
ALTER TABLE reservation_requests
  ADD COLUMN IF NOT EXISTS service_id uuid
    REFERENCES menu_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duration_minutes int;

CREATE INDEX IF NOT EXISTS reservation_requests_service_id_idx
  ON reservation_requests(service_id);
