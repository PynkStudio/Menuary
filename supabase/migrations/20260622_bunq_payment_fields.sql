-- Aggiunge campi Bunq a platform_payments per link di pagamento e riconciliazione automatica

ALTER TABLE platform_payments
  ADD COLUMN IF NOT EXISTS bunq_request_id bigint,
  ADD COLUMN IF NOT EXISTS bunq_payment_url text,
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'manual';

COMMENT ON COLUMN platform_payments.bunq_request_id IS 'Bunq request-inquiry ID per riconciliazione webhook';
COMMENT ON COLUMN platform_payments.bunq_payment_url IS 'URL bunq.me per il pagamento (link inviato al cliente)';
COMMENT ON COLUMN platform_payments.payment_provider IS 'Provider pagamento: manual | stripe | bunq';

CREATE INDEX IF NOT EXISTS idx_platform_payments_bunq_request
  ON platform_payments (bunq_request_id)
  WHERE bunq_request_id IS NOT NULL;
