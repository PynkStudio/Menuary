-- Dedup stampa comande (modulo printStations).
-- Marca quando la comanda di un ordine è stata inviata alla stampante, così la
-- postazione di stampa non ristampa lo stesso ordine a ogni evento/refresh o
-- riavvio della pagina. Dedup coordinato lato server (vale per più dispositivi).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS comanda_printed_at timestamptz;

-- Coda di stampa: ordini accettati (entrati in cucina) non ancora stampati.
CREATE INDEX IF NOT EXISTS orders_comanda_print_queue_idx
  ON public.orders (tenant_id, created_at)
  WHERE comanda_printed_at IS NULL;
