-- Audit gestione 2026-10-03 (docs/03-features/audit-gestione.md § 2.2–2.3).
-- Tabelle esposte a PostgREST senza RLS e con grant pieni ad anon/authenticated.
-- Tutti gli accessi applicativi passano dal service role, tranne staff_locations
-- che il layout gestione legge con la sessione dell'utente.

do $$
declare
  t text;
begin
  foreach t in array array[
    'tenant_google_auth',
    'tenant_google_locations',
    'google_sync_log',
    'tenant_special_hours',
    'staff_locations',
    'shifts',
    'cash_sessions',
    'cash_movements',
    'kiosk_devices',
    'siteadmin_email_aliases',
    'tenant_order_sequences',
    'hubrise_links',
    'hubrise_menu_sync_log',
    'hubrise_inbound_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

grant select on table public.staff_locations to authenticated;

drop policy if exists staff_locations_select_own on public.staff_locations;
create policy staff_locations_select_own on public.staff_locations
  for select to authenticated
  using (
    admin_user_id in (select au.id from public.admin_users au where au.auth_user_id = auth.uid())
  );

-- Funzioni SECURITY DEFINER chiamate solo dal service role.
revoke execute on function public.create_tenant_with_location(text, text, text, text, text, text[], text, jsonb, jsonb, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.platform_suspend_overdue_tenants() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.handle_new_admin_user_row() from public, anon, authenticated;
revoke execute on function public.log_order_status_change() from public, anon, authenticated;

-- Il revocante era un parametro: chiunque poteva passare l'id di un siteadmin.
-- La firma resta invariata per compatibilità, ma il parametro viene ignorato.
create or replace function public.revoke_tenant_access(p_employee_id uuid, p_revoker_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tenant text;
  v_caller uuid := auth.uid();
begin
  if v_caller is null then raise exception 'unauthorized'; end if;
  select tenant_id into v_tenant from employee where id = p_employee_id;
  if v_tenant is null then raise exception 'employee not found'; end if;
  if not (
    exists(select 1 from siteadmin   where user_id = v_caller and enabled = true)
    or exists(select 1 from tenantadmin where user_id = v_caller and tenant_id = v_tenant and enabled = true)
    or exists(select 1 from employee    where user_id = v_caller and tenant_id = v_tenant and role = 'manager' and enabled = true)
  ) then raise exception 'unauthorized'; end if;
  update employee set enabled = false where id = p_employee_id;
end;
$function$;

revoke execute on function public.revoke_tenant_access(uuid, uuid) from public, anon;
grant execute on function public.revoke_tenant_access(uuid, uuid) to authenticated;
