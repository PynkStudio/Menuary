-- Unifica la consegna messaggi nella coda outbound_text_messages.
-- channel_payment_requests resta come "intent di pagamento" (amount, fees, Stripe
-- IDs, payment_url, status pagamento), ma la consegna effettiva del link al
-- cliente passa per outbound_text_messages (kind='payment_link' o 'order_summary').
--
-- Aggiungiamo un FK per correlazione bidirezionale.

alter table public.outbound_text_messages
  add column if not exists channel_payment_request_id uuid
    references public.channel_payment_requests(id) on delete set null;

create index if not exists outbound_text_messages_channel_payment_request_idx
  on public.outbound_text_messages(channel_payment_request_id)
  where channel_payment_request_id is not null;

-- I campi channel/recipient_phone/message_status su channel_payment_requests
-- diventano informazioni storiche (cosa è stato pianificato), mentre la verità
-- operativa sullo stato di consegna vive su outbound_text_messages.attempts.
comment on column public.channel_payment_requests.message_status is
  'Deprecato dal 2026-06-13: lo stato consegna reale è su outbound_text_messages.status. Questo campo è solo l''intento iniziale del chiamante.';
