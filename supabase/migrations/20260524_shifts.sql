-- Turni: pianificazione settimanale dello staff.
-- Ogni riga è un turno assegnato a un employee (auth user) con orario e ruolo.

CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  role text,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'confirmed', 'absent', 'cancelled')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT shifts_time_window CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS shifts_tenant_range_idx
  ON shifts(tenant_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS shifts_employee_idx
  ON shifts(employee_id, start_at DESC);
