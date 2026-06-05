create table if not exists public.tenant_ai_voice (
  tenant_id  text primary key references public.tenants(id) on delete cascade,
  tone       text not null default 'informale',
  audience   text not null default '',
  keywords   text not null default '',
  do_examples    text not null default '',
  dont_examples  text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.tenant_ai_voice enable row level security;

create policy "tenant_ai_voice_tenant_admin"
  on public.tenant_ai_voice
  for all
  using (
    exists (
      select 1 from public.tenantadmin ta
      where ta.tenant_id = tenant_ai_voice.tenant_id
        and ta.user_id = auth.uid()
        and ta.enabled = true
    )
    or exists (
      select 1 from public.siteadmin sa
      where sa.user_id = auth.uid()
        and sa.enabled = true
    )
  );
