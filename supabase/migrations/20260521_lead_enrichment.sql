-- Lead enrichment: digital presence assessment, scoring, indirizzi separati
-- Rende contatto email/nome opzionali per inserimento manuale guidato

-- ── Contatti opzionali ───────────────────────────────────────────────────────
ALTER TABLE public.platform_leads
  ALTER COLUMN contact_name  DROP NOT NULL,
  ALTER COLUMN contact_email DROP NOT NULL;

-- ── Nuovi campi platform_leads ───────────────────────────────────────────────
ALTER TABLE public.platform_leads
  ADD COLUMN IF NOT EXISTS business_type               text,
  ADD COLUMN IF NOT EXISTS contact_first_name          text,
  ADD COLUMN IF NOT EXISTS contact_last_name           text,
  ADD COLUMN IF NOT EXISTS has_website                 boolean,
  ADD COLUMN IF NOT EXISTS website_url                 text,
  ADD COLUMN IF NOT EXISTS website_score_beauty        smallint CHECK (website_score_beauty        BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS website_score_functionality smallint CHECK (website_score_functionality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS website_score_clarity       smallint CHECK (website_score_clarity       BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS website_score_updated       smallint CHECK (website_score_updated       BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS has_google_maps             boolean,
  ADD COLUMN IF NOT EXISTS maps_ownership_claimed      boolean,
  ADD COLUMN IF NOT EXISTS maps_profile_complete       boolean,
  ADD COLUMN IF NOT EXISTS matching_score              smallint,
  ADD COLUMN IF NOT EXISTS priority_score              smallint;

-- ── Via e civico separati in platform_lead_locations ─────────────────────────
ALTER TABLE public.platform_lead_locations
  ADD COLUMN IF NOT EXISTS street        text,
  ADD COLUMN IF NOT EXISTS street_number text;

-- ── Commenti ─────────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.platform_leads.business_type
  IS 'Categoria HORECA (es. Pizzeria, Cocktail Bar) o tipo attività services (es. Studio dentistico).';
COMMENT ON COLUMN public.platform_leads.has_website
  IS 'True se l''attività ha un sito web proprio. NULL = non rilevato.';
COMMENT ON COLUMN public.platform_leads.website_url
  IS 'URL del sito web dell''attività.';
COMMENT ON COLUMN public.platform_leads.website_score_beauty
  IS 'Valutazione estetica sito 1–5 (inserita manualmente durante la profilazione).';
COMMENT ON COLUMN public.platform_leads.website_score_functionality
  IS 'Valutazione funzionalità sito 1–5.';
COMMENT ON COLUMN public.platform_leads.website_score_clarity
  IS 'Valutazione chiarezza informazioni sito 1–5.';
COMMENT ON COLUMN public.platform_leads.website_score_updated
  IS 'Valutazione aggiornamento contenuti sito 1–5.';
COMMENT ON COLUMN public.platform_leads.has_google_maps
  IS 'True se l''attività è presente su Google Maps. NULL = non rilevato.';
COMMENT ON COLUMN public.platform_leads.maps_ownership_claimed
  IS 'True se la titolarità del profilo Google Maps è stata registrata dal proprietario.';
COMMENT ON COLUMN public.platform_leads.maps_profile_complete
  IS 'True se il profilo Google Maps è ritenuto completo (foto, orari, descrizione).';
COMMENT ON COLUMN public.platform_leads.matching_score
  IS 'Score 0–100: quanto bene questa attività si adatta alla nostra offerta (calcolato al salvataggio).';
COMMENT ON COLUMN public.platform_leads.priority_score
  IS 'Score 0–100: urgenza/valore commerciale del lead (calcolato al salvataggio).';
COMMENT ON COLUMN public.platform_lead_locations.street
  IS 'Via/Viale/Piazza — parte testuale dell''indirizzo, separata dal civico.';
COMMENT ON COLUMN public.platform_lead_locations.street_number
  IS 'Numero civico.';
