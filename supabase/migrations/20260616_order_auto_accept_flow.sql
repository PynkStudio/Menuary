-- Estende il flusso di auto-accept ordini con soglia di preavviso.
-- NULL = nessun vincolo; valore in minuti rispetto all'orario desiderato/ritiro.

alter table public.tenant_order_settings
  add column if not exists auto_accept_min_notice_minutes integer
    check (
      auto_accept_min_notice_minutes is null
      or (auto_accept_min_notice_minutes >= 0 and auto_accept_min_notice_minutes <= 10080)
    );

comment on column public.tenant_order_settings.auto_accept_min_notice_minutes is
  'Preavviso minimo in minuti per auto-accettare un ordine. Es. 720 = almeno 12 ore.';
