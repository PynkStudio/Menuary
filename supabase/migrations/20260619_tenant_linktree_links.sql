create table if not exists public.tenant_linktree_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  label text not null,
  href text not null,
  description text,
  kind text not null default 'link',
  position integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenant_linktree_links_tenant_position_idx
  on public.tenant_linktree_links (tenant_id, position, created_at);

alter table public.tenant_linktree_links enable row level security;

drop policy if exists "tenant_linktree_links_public_read" on public.tenant_linktree_links;
create policy "tenant_linktree_links_public_read"
  on public.tenant_linktree_links
  for select
  using (enabled = true);
