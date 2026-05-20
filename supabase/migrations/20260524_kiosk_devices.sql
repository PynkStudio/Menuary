-- Kiosk: registro dei dispositivi self-service per tenant.
-- Ogni device ha un pairing_code (one-shot) usato dall'app pubblica per
-- accoppiarsi e ottenere un device_token long-lived. La configurazione
-- (steps UX + metodi di pagamento + lingue) è per-device in `config` JSON.

CREATE TABLE IF NOT EXISTS kiosk_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  pairing_code text NOT NULL,
  device_token text,
  enabled boolean NOT NULL DEFAULT true,
  paired_at timestamptz,
  last_seen_at timestamptz,
  config jsonb NOT NULL DEFAULT '{
    "languages": ["it"],
    "default_language": "it",
    "steps": {
      "language_picker": false,
      "dine_in_takeaway": true,
      "table_number": false,
      "customer_name": false
    },
    "payments": {
      "cash": true,
      "stripe_qr": false,
      "satispay": false,
      "pos": false
    }
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS kiosk_devices_pairing_code_idx
  ON kiosk_devices(pairing_code);
CREATE UNIQUE INDEX IF NOT EXISTS kiosk_devices_device_token_idx
  ON kiosk_devices(device_token) WHERE device_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS kiosk_devices_tenant_idx
  ON kiosk_devices(tenant_id);
