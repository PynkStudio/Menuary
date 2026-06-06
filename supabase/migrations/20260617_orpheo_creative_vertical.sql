-- Orpheo: terzo verticale creativo collegato al backend Menuary/Bizery.
-- Include tenant tecnico, demo controls e pacchetti pricing dedicati gestibili
-- da admin.menuary.it nella tabella platform_packages.

alter table if exists public.tenant_demo_controls
  drop constraint if exists tenant_demo_controls_vertical_check;

alter table if exists public.tenant_demo_controls
  add constraint tenant_demo_controls_vertical_check
  check (vertical in ('food', 'services', 'creative'));

insert into public.tenants (
  id, name, label, domains, preview_slug, enabled, vertical, status, theme, features, site_config, hours
)
values (
  'orpheo-demo',
  'Orpheo Demo',
  'Demo · Orpheo',
  array[]::text[],
  'orpheo-demo',
  true,
  'creative',
  'trial',
  jsonb_build_object(
    'red', '#7C3AED',
    'redDark', '#4C1D95',
    'peach', '#F5D0FE',
    'cream', '#FBFAF7',
    'ink', '#17111F',
    'brick', '#24162F',
    'mustard', '#D6A84F',
    'mustardSoft', '#F4DF9A',
    'green', '#0F9F6E',
    'pink', '#D9468F'
  ),
  jsonb_build_object(
    'website', true,
    'crm', true,
    'analytics', true,
    'staffRoles', true,
    'reviews', true,
    'gallery', true,
    'pressKit', true,
    'worksCatalog', true,
    'creativeBooking', true,
    'rightsRoyalties', true,
    'reputationReviews', true,
    'fanbaseCommunity', true
  ),
  jsonb_build_object('brand', 'Orpheo', 'marketingDomain', 'weuseorpheo.com'),
  '[]'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  label = excluded.label,
  preview_slug = excluded.preview_slug,
  vertical = excluded.vertical,
  status = excluded.status,
  theme = excluded.theme,
  features = excluded.features,
  site_config = excluded.site_config;

insert into public.tenant_demo_controls (tenant_id, preview_slug, vertical, enabled, backend_live)
values ('orpheo-demo', 'orpheo-demo', 'creative', true, false)
on conflict (tenant_id) do update set
  preview_slug = excluded.preview_slug,
  vertical = excluded.vertical,
  enabled = excluded.enabled,
  backend_live = excluded.backend_live,
  updated_at = now();

insert into public.platform_packages (
  name, slug, description, vertical, price_monthly, price_monthly_billing, price_yearly,
  currency, modules, is_active, sort_order, marketing_name, tagline, marketing_description,
  setup_from, marketing_items, is_featured, cta_label, package_kind
)
values
  (
    'orpheo-presenza',
    'orpheo-presenza',
    'Profilo ufficiale, press kit e catalogo opere essenziale per artisti e professionisti creativi.',
    'creative',
    49,
    59,
    49 * 12,
    'EUR',
    array['website','pressKit','worksCatalog','reviews','gallery'],
    true,
    201,
    'Presenza',
    'Profilo e press kit',
    'Per artisti e professionisti creativi che vogliono una presenza ufficiale curata: sito, bio, press kit, opere principali e contatti media/booking.',
    'da €790',
    array[
      'Sito ufficiale su misura, dominio personalizzato',
      'Bio breve/lunga, foto ufficiali e press kit',
      'Catalogo opere essenziale',
      'Link social, streaming, vendita e provider',
      'Recensioni e citazioni selezionate',
      'Hosting, SSL, backup inclusi'
    ],
    false,
    null,
    'base'
  ),
  (
    'orpheo-pro',
    'orpheo-pro',
    'CRM creativo, booking eventi, asset manager e reputation provider.',
    'creative',
    119,
    139,
    119 * 12,
    'EUR',
    array['website','pressKit','worksCatalog','crm','analytics','creativeBooking','reputationReviews','gallery','staffRoles'],
    true,
    202,
    'Pro',
    'Presenza + opportunità',
    'Per gestire opportunità, richieste professionali, eventi e materiali promozionali in un unico pannello condiviso con manager, ufficio stampa o agente.',
    'da €1.490',
    array[
      'Tutto di Presenza',
      'CRM contatti professionali e media',
      'Pipeline opportunità, booking ed eventi',
      'Asset manager per foto, video e documenti',
      'Reputation & reviews da provider rilevanti',
      'Permessi per collaboratori'
    ],
    true,
    'Inizia con Pro',
    'base'
  ),
  (
    'orpheo-management',
    'orpheo-management',
    'Gestione creativa completa: opere, contratti, diritti, royalty, fanbase e analytics.',
    'creative',
    219,
    249,
    219 * 12,
    'EUR',
    array['website','pressKit','worksCatalog','crm','analytics','creativeBooking','rightsRoyalties','reputationReviews','fanbaseCommunity','gallery','staffRoles','multiLocation'],
    true,
    203,
    'Management',
    'Operatività creativa completa',
    'Per artisti strutturati, autori, musicisti, attori, registi, collettivi e team che devono coordinare opere, contratti, diritti, fanbase e analytics.',
    'da €2.490',
    array[
      'Tutto di Pro',
      'Diritti, licenze, territori e scadenze',
      'Royalty e rendicontazioni per opera/canale',
      'Fanbase, newsletter e segmenti audience',
      'Dashboard performance opere, eventi e campagne',
      'Multi-identità, team e ruoli avanzati'
    ],
    false,
    null,
    'base'
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  vertical = excluded.vertical,
  price_monthly = excluded.price_monthly,
  price_monthly_billing = excluded.price_monthly_billing,
  price_yearly = excluded.price_yearly,
  currency = excluded.currency,
  modules = excluded.modules,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  marketing_name = excluded.marketing_name,
  tagline = excluded.tagline,
  marketing_description = excluded.marketing_description,
  setup_from = excluded.setup_from,
  marketing_items = excluded.marketing_items,
  is_featured = excluded.is_featured,
  cta_label = excluded.cta_label,
  package_kind = excluded.package_kind,
  updated_at = now();
