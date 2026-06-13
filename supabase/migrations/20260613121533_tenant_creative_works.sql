create table if not exists public.tenant_creative_works (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null default '',
  secondary_text text not null default '',
  cover_image_url text,
  background_media_url text,
  cta_label text not null default 'Scopri',
  cta_href text,
  position integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists tenant_creative_works_tenant_position_idx
  on public.tenant_creative_works (tenant_id, position, created_at);

alter table public.tenant_creative_works enable row level security;

drop policy if exists "tenant_creative_works_public_read" on public.tenant_creative_works;
create policy "tenant_creative_works_public_read"
  on public.tenant_creative_works
  for select
  using (enabled = true);

insert into public.tenant_creative_works (
  id,
  tenant_id,
  slug,
  title,
  description,
  secondary_text,
  cover_image_url,
  background_media_url,
  cta_label,
  cta_href,
  position,
  enabled
)
values
  (
    '44acaaba-1814-46ef-923d-a4f50aa11901',
    'valentina-orciuoli',
    'anxiety',
    'Anxiety',
    'E se l''ansia fosse un potere? E se questo potere si manifestasse nella forma di un dragone?',
    'Quando non è più possibile mentire a sé stessi, quando il vero combatte per uscire allo scoperto il potere dell''ansia si sprigiona, più feroce che mai.',
    '/valentina-orciuoli/anxiety-mockup-standup.png',
    '/valentina-orciuoli/video-anxiety.webm',
    'Leggilo qui',
    'https://www.amazon.it/Anxiety-Valentina-Orciuoli-ebook/dp/B0F1KVZKFC',
    0,
    true
  ),
  (
    '44acaaba-1814-46ef-923d-a4f50aa11902',
    'valentina-orciuoli',
    'fury',
    'Fury',
    'E se perdere se stessi fosse l''unico modo per salvare chi ami? Quando la rabbia prende il sopravvento, cosa resta del proprio io?',
    'Un secolo prima dell''apparizione del Dragone Nero dell''ansia, il Primo Long era l''incarnazione della rabbia.',
    'https://m.media-amazon.com/images/I/71z2LZ6a8XL.jpg',
    '/valentina-orciuoli/video-fury.webm',
    'Leggilo qui',
    'https://www.amazon.it/Fury-Emotion-Dragons-Trilogy-Vol-ebook/dp/B0GKWCS774',
    1,
    true
  ),
  (
    '44acaaba-1814-46ef-923d-a4f50aa11903',
    'valentina-orciuoli',
    'tra-fumo-e-ombre',
    'Tra fumo e ombre',
    'E se il fumo fosse l''unico posto dove poter nascondere la verità?',
    'Nella Milano cupa degli anni ''70, tra nebbia, silenzi e ombre che sembrano respirare, una donna cerca di dimenticare ciò che ha perduto. Ma ogni sigaretta accesa riporta a galla un ricordo, ogni strada bagnata riflette un volto che non vuole più vedere.',
    '/valentina-orciuoli/tra-fumo-e-ombre.webp',
    '/valentina-orciuoli/video-dark.webm',
    'Preordina qui',
    '/valentina-orciuoli/link',
    2,
    true
  )
on conflict (id) do nothing;
