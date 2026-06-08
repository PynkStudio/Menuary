-- KDS todo: spunta di preparazione per riga ordine.
-- prepared/prepared_at vengono toggle-ati dal cuoco nello schermo cucina.
-- Quando tutte le righe non-coperto di un ordine sono prepared=true,
-- il client suggerisce di marcare l'ordine come "pronto" (non automatico).

ALTER TABLE public.order_lines
  ADD COLUMN IF NOT EXISTS prepared    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prepared_at timestamptz;

-- Sincronizzazione real-time tra device cucina.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'order_lines'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_lines;
  END IF;
END $$;

-- Stesso trattamento per reservation_requests: serve al feed realtime del
-- chime sulle nuove prenotazioni in arrivo nei pannelli gestione.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'reservation_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservation_requests;
  END IF;
END $$;
