-- ─── Google Business Profile: auth e location linking ────────────────────────
-- Queste tabelle gestiscono il collegamento tra un tenant e la sua scheda
-- Google Business, acquisito tramite OAuth dal pannello di gestione.

-- ─── tenant_google_auth ───────────────────────────────────────────────────────
-- Memorizza il refresh_token OAuth per tenant. Un solo token per tenant
-- (l'ultimo gestore che ha autorizzato l'accesso).
-- TODO: valutare cifratura del refresh_token a riposo (pg_crypto o vault Supabase).
CREATE TABLE IF NOT EXISTS tenant_google_auth (
  tenant_id      text        PRIMARY KEY,
  refresh_token  text        NOT NULL,
  authorized_at  timestamptz NOT NULL DEFAULT now(),
  authorized_by  text,       -- admin_users.id che ha avviato il flow OAuth

  CONSTRAINT tenant_google_auth_tenant_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
);

-- ─── tenant_google_locations ──────────────────────────────────────────────────
-- Sedi Google collegate a un tenant. La relazione è uno-a-molti perché un
-- tenant può avere più sedi (es. catena con più punti vendita).
--
-- TODO: multi-location — implementare la selezione multipla di sedi nel pannello
-- di gestione. Attualmente il cron usa solo la sede con is_primary = true.
CREATE TABLE IF NOT EXISTS tenant_google_locations (
  id                      uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id               text        NOT NULL,
  location_resource_name  text        NOT NULL,  -- "accounts/{id}/locations/{id}"
  place_id                text,                  -- Google Maps Place ID (per Places API)
  location_name           text,                  -- nome visualizzato della sede
  is_primary              boolean     NOT NULL DEFAULT true,
  linked_at               timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tenant_google_locations_tenant_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,

  CONSTRAINT tenant_google_locations_unique
    UNIQUE (tenant_id, location_resource_name)
);

CREATE INDEX IF NOT EXISTS tenant_google_locations_tenant_idx
  ON tenant_google_locations (tenant_id);
