-- Multi-location support
-- Extends the existing `locations` table and wires location_id across
-- all operational tables. Single-location tenants are unaffected:
-- all new FKs are nullable and queries without a location filter keep working.

-- ── Extend locations ────────────────────────────────────────────────────────
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS phone       text,
  ADD COLUMN IF NOT EXISTS email       text,
  ADD COLUMN IF NOT EXISTS city        text,
  ADD COLUMN IF NOT EXISTS routing_mode text NOT NULL DEFAULT 'both'
    CHECK (routing_mode IN ('subdomain', 'path', 'both'));

-- ── tables ──────────────────────────────────────────────────────────────────
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tables_location_id_idx ON tables(location_id);

-- ── orders ──────────────────────────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_location_id_idx ON orders(location_id);

-- ── gallery_images ───────────────────────────────────────────────────────────
ALTER TABLE gallery_images
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- ── reviews ─────────────────────────────────────────────────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- ── menu_categories ──────────────────────────────────────────────────────────
-- NULL = category visible in all locations.
-- Non-null = category exclusive to one location.
ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- ── menu_items ───────────────────────────────────────────────────────────────
-- NULL = item inherits from category visibility (all locations).
-- Non-null = item exclusive to one location (overrides category).
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- ── tenant_special_hours ─────────────────────────────────────────────────────
ALTER TABLE tenant_special_hours
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- ── tenant_google_locations → link to platform location ─────────────────────
ALTER TABLE tenant_google_locations
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- ── staff_locations pivot ───────────────────────────────────────────────────
-- Assigns staff members to one or more locations.
-- When no rows exist for a staff member, they can see all locations
-- (legacy behaviour preserved for single-location tenants).
CREATE TABLE IF NOT EXISTS staff_locations (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id  uuid        NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  location_id    uuid        NOT NULL REFERENCES locations(id)   ON DELETE CASCADE,
  created_at     timestamptz DEFAULT now() NOT NULL,
  UNIQUE (admin_user_id, location_id)
);

CREATE INDEX IF NOT EXISTS staff_locations_admin_user_id_idx ON staff_locations(admin_user_id);
CREATE INDEX IF NOT EXISTS staff_locations_location_id_idx   ON staff_locations(location_id);

-- ── Performance indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS locations_tenant_id_idx          ON locations(tenant_id);
CREATE INDEX IF NOT EXISTS reservation_requests_location_idx ON reservation_requests(location_id);
CREATE INDEX IF NOT EXISTS staff_shifts_location_id_idx      ON staff_shifts(location_id);
