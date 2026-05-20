-- Cassa: sessioni e movimenti
-- Gestisce apertura/chiusura cassa, scontrini, fondo cassa e movimenti
-- straordinari. Una sola sessione "aperta" per tenant/location alla volta.

-- ── cash_sessions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opened_by uuid REFERENCES auth.users(id),
  closed_by uuid REFERENCES auth.users(id),
  opening_amount numeric(10,2) NOT NULL DEFAULT 0,
  closing_amount numeric(10,2),
  expected_amount numeric(10,2),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed')),
  note text
);

CREATE INDEX IF NOT EXISTS cash_sessions_tenant_status_idx
  ON cash_sessions(tenant_id, status);
CREATE INDEX IF NOT EXISTS cash_sessions_opened_at_idx
  ON cash_sessions(tenant_id, opened_at DESC);

-- Una sola sessione "open" per tenant+location alla volta.
CREATE UNIQUE INDEX IF NOT EXISTS cash_sessions_one_open_per_location
  ON cash_sessions(tenant_id, COALESCE(location_id::text, ''))
  WHERE status = 'open';

-- ── cash_movements ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  kind text NOT NULL
    CHECK (kind IN ('sale', 'refund', 'cash_in', 'cash_out', 'adjustment')),
  method text NOT NULL DEFAULT 'cash'
    CHECK (method IN ('cash', 'card', 'voucher', 'other')),
  amount numeric(10,2) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS cash_movements_session_idx
  ON cash_movements(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cash_movements_tenant_idx
  ON cash_movements(tenant_id, created_at DESC);
