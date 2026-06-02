-- I default grant del progetto possono assegnare privilegi aggiuntivi alle
-- nuove tabelle. Il middleware e l'API admin richiedono solo questi tre.
revoke all on table public.tenant_demo_controls from anon, authenticated, service_role;
grant select, insert, update on table public.tenant_demo_controls to service_role;
