-- Sequenze ordini per tenant + RLS client-facing
-- Già applicata via MCP; file presente per tracciabilità git.

-- ─── Sequenze ordini ──────────────────────────────────────────────────────────
create table if not exists public.tenant_order_sequences (
  tenant_id  text primary key references public.tenants (id) on delete cascade,
  last_seq   integer not null default 0
);

create or replace function public.next_order_code(
  p_tenant_id text,
  p_prefix    text default 'B'
)
returns text language plpgsql as $$
declare v_seq integer;
begin
  insert into public.tenant_order_sequences (tenant_id, last_seq)
  values (p_tenant_id, 1)
  on conflict (tenant_id) do update
    set last_seq = tenant_order_sequences.last_seq + 1
  returning last_seq into v_seq;
  return p_prefix || lpad(v_seq::text, 3, '0');
end;
$$;

-- ─── RLS client-facing ────────────────────────────────────────────────────────
create policy "orders_client_read_own" on public.orders for select
  using (menuary_user_id = auth.uid() or diner_client_id = auth.uid()::text);

create policy "order_lines_client_read_own" on public.order_lines for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_lines.order_id
      and (o.menuary_user_id = auth.uid() or o.diner_client_id = auth.uid()::text)
  ));

create policy "table_sessions_read_by_code" on public.table_sessions for select
  using (can_admin_tenant(tenant_id) or auth.role() = 'authenticated');

create policy "session_diners_self_insert" on public.session_diners for insert
  with check (auth.role() = 'authenticated'
    or can_admin_tenant((select tenant_id from public.table_sessions s where s.id = session_id)));

create policy "session_diners_self_read" on public.session_diners for select
  using (can_admin_tenant((select tenant_id from public.table_sessions s where s.id = session_id))
    or auth.role() = 'authenticated');
