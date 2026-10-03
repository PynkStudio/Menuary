alter table public.tenant_demo_controls add column if not exists backend_live_until timestamptz;
comment on column public.tenant_demo_controls.backend_live_until is
  'Scadenza della finestra backend live (15 minuti dall''attivazione). Oltre questa data la demo torna ai fixture.';
update public.tenant_demo_controls set backend_live = false where backend_live and backend_live_until is null;
