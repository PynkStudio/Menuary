-- Preserve the original language of Google Places reviews so public tenant
-- sites can prefer reviews matching the active locale without hiding fallback
-- content written in other languages.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS language_code text,
  ADD COLUMN IF NOT EXISTS original_language_code text,
  ADD COLUMN IF NOT EXISTS translated boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS reviews_tenant_source_language_idx
  ON reviews (tenant_id, source, language_code);
