create table if not exists public.tenant_blog_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  title text not null,
  slug text not null,
  excerpt text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.tenant_blog_blocks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.tenant_blog_posts(id) on delete cascade,
  type text not null default 'paragraph' check (type in ('paragraph', 'heading', 'quote', 'image', 'gallery', 'embed')),
  content text,
  media_urls text[] not null default '{}',
  caption text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.tenant_blog_posts(id) on delete cascade,
  author_name text not null,
  author_email text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ip_hash text,
  user_agent text,
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tenant_blog_posts_tenant_status_published_idx
  on public.tenant_blog_posts (tenant_id, status, published_at desc, created_at desc);

create index if not exists tenant_blog_blocks_post_position_idx
  on public.tenant_blog_blocks (post_id, position);

create index if not exists tenant_blog_comments_post_status_created_idx
  on public.tenant_blog_comments (post_id, status, created_at desc);

alter table public.tenant_blog_posts enable row level security;
alter table public.tenant_blog_blocks enable row level security;
alter table public.tenant_blog_comments enable row level security;

drop policy if exists "tenant_blog_posts_public_read" on public.tenant_blog_posts;
create policy "tenant_blog_posts_public_read"
  on public.tenant_blog_posts
  for select
  using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists "tenant_blog_blocks_public_read" on public.tenant_blog_blocks;
create policy "tenant_blog_blocks_public_read"
  on public.tenant_blog_blocks
  for select
  using (
    exists (
      select 1
      from public.tenant_blog_posts p
      where p.id = tenant_blog_blocks.post_id
        and p.status = 'published'
        and p.published_at is not null
        and p.published_at <= now()
    )
  );

drop policy if exists "tenant_blog_comments_public_read" on public.tenant_blog_comments;
create policy "tenant_blog_comments_public_read"
  on public.tenant_blog_comments
  for select
  using (
    status = 'approved'
    and exists (
      select 1
      from public.tenant_blog_posts p
      where p.id = tenant_blog_comments.post_id
        and p.status = 'published'
        and p.published_at is not null
        and p.published_at <= now()
    )
  );

drop policy if exists "tenant_blog_comments_public_insert_pending" on public.tenant_blog_comments;
create policy "tenant_blog_comments_public_insert_pending"
  on public.tenant_blog_comments
  for insert
  with check (
    status = 'pending'
    and exists (
      select 1
      from public.tenant_blog_posts p
      where p.id = tenant_blog_comments.post_id
        and p.status = 'published'
        and p.published_at is not null
        and p.published_at <= now()
    )
  );
