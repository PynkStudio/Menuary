-- ─── Orari straordinari + risposte recensioni ────────────────────────────────

-- Eccezioni date-specifiche agli orari settimanali standard.
-- Esempi: chiusura festiva, orario prolungato per un evento, apertura straordinaria.
-- Quando sincronizzato con Google My Business, compare come "orario speciale" su Maps.
CREATE TABLE IF NOT EXISTS tenant_special_hours (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   text    NOT NULL,
  date        date    NOT NULL,
  closed      boolean NOT NULL DEFAULT false,
  slots       jsonb   NOT NULL DEFAULT '[]',   -- ["HH:MM – HH:MM", ...]
  label       text,                             -- es. "Orario natalizio", "Chiusura estiva"
  synced_to_google boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tenant_special_hours_tenant_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,

  CONSTRAINT tenant_special_hours_unique
    UNIQUE (tenant_id, date)
);

CREATE INDEX IF NOT EXISTS tenant_special_hours_tenant_date_idx
  ON tenant_special_hours (tenant_id, date);

-- Campo per tracciare il testo della risposta del gestore su Google.
-- Il reply viene inviato via My Business API; qui teniamo traccia locale.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS google_review_id text,
  ADD COLUMN IF NOT EXISTS reply_comment    text,
  ADD COLUMN IF NOT EXISTS replied_at       timestamptz;

CREATE INDEX IF NOT EXISTS reviews_google_review_id_idx
  ON reviews (google_review_id) WHERE google_review_id IS NOT NULL;
