alter table public.menu_items
  add column if not exists tag_meta jsonb not null default '{}'::jsonb;
