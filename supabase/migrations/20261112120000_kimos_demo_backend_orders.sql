alter table public.tenant_demo_controls
  add column if not exists backend_always_live boolean not null default false;

comment on column public.tenant_demo_controls.backend_always_live is
  'Mantiene la gestione demo collegata al backend reale senza scadenza. Da abilitare solo per demo operative presidiate.';

alter table public.tenant_ai_phone_settings
  add column if not exists demo_orders boolean not null default false;

comment on column public.tenant_ai_phone_settings.demo_orders is
  'Marca come demo gli ordini creati dai canali conversazionali del tenant.';

alter table public.orders
  add column if not exists is_demo boolean not null default false;

create index if not exists orders_tenant_demo_created_idx
  on public.orders (tenant_id, created_at desc)
  where is_demo;

comment on column public.orders.is_demo is
  'True per ordini di prova: restano operativi e stampabili, ma sono distinguibili dagli ordini reali.';

update public.tenant_demo_controls
   set backend_always_live = true,
       updated_at = now()
 where tenant_id = 'kimos';

update public.tenant_ai_phone_settings
   set demo_orders = true,
       updated_at = now()
 where tenant_id = 'kimos';
