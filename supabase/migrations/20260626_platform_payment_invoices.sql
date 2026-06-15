-- Fatture caricate manualmente per i pagamenti piattaforma confermati.

alter table platform_payments
  add column if not exists invoice_date date,
  add column if not exists invoice_file_path text,
  add column if not exists invoice_file_name text,
  add column if not exists invoice_uploaded_at timestamptz;

comment on column platform_payments.invoice_number is 'Numero fattura o riferimento contabile del pagamento';
comment on column platform_payments.invoice_date is 'Data fattura caricata per il pagamento';
comment on column platform_payments.invoice_file_path is 'Path privato nel bucket platform-documents';
comment on column platform_payments.invoice_file_name is 'Nome file originale della fattura';
comment on column platform_payments.invoice_uploaded_at is 'Timestamp caricamento fattura';

create index if not exists idx_platform_payments_invoice_tasks
  on platform_payments (status, invoice_file_path)
  where status = 'paid';
