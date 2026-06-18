-- Cascina Errante: tenant food attivo usato come ristorante demo Menuary.
-- Tutte le feature sono accese; Stripe usa la sandbox anche su dominio produzione
-- tramite policy applicativa (src/lib/payments/stripe/sandbox-policy.ts).

insert into public.tenants (
  id, name, label, domains, preview_slug, enabled, vertical, status, theme, features, site_config, hours
)
values (
  'cascina-errante',
  'Cascina Errante',
  'Demo · Cascina Errante',
  array['cascinaerrante.it', 'www.cascinaerrante.it']::text[],
  'cascina-errante',
  true,
  'food',
  'active',
  jsonb_build_object(
    'red', '#F0783C',
    'redDark', '#0F2F1E',
    'peach', '#EFE3C2',
    'cream', '#FFFFFF',
    'ink', '#0F2F1E',
    'brick', '#1C4A31',
    'mustard', '#EFA950',
    'mustardSoft', '#F4C985',
    'green', '#32704D',
    'pink', '#F0783C'
  ),
  jsonb_build_object(
    'website', true,
    'onlineMenu', true,
    'takeaway', true,
    'tableOrders', true,
    'orderKiosk', true,
    'kitchenDisplay', true,
    'dinerSeparation', true,
    'reservations', true,
    'tablePlanner', true,
    'productAvailability', true,
    'upselling', true,
    'crm', true,
    'analytics', true,
    'takeawaySlots', true,
    'deliveryHub', true,
    'cashRegister', true,
    'inventoryFoodCost', true,
    'printStations', true,
    'staffRoles', true,
    'multiLocation', true,
    'favorites', true,
    'reviews', true,
    'gallery', true,
    'shop', true,
    'slabbby', true,
    'aiPhone', true,
    'aiWhatsapp', true,
    'hubriseSync', true,
    'payments', true,
    'mail', true,
    'blog', true,
    'pressKit', true,
    'worksCatalog', true,
    'creativeBooking', true,
    'rightsRoyalties', true,
    'reputationReviews', true,
    'fanbaseCommunity', true,
    'linktree', true
  ),
  jsonb_build_object(
    'address', 'Via delle Cascine, 123 - 20010 Milano (MI)',
    'phone', '+39 095 123 4567',
    'email', 'info@cascinaerrante.it',
    'websiteUrl', 'https://cascinaerrante.it',
    'googleMapsUrl', 'https://www.google.com/maps/search/?api=1&query=Cascina+Errante+Via+delle+Cascine+123+Milano',
    'stripeMode', 'demo_sandbox_in_production'
  ),
  '[
    {"label":"Lunedì","closed":true,"slots":[]},
    {"label":"Martedì","closed":false,"slots":["12:00 - 15:00","19:00 - 23:00"]},
    {"label":"Mercoledì","closed":false,"slots":["12:00 - 15:00","19:00 - 23:00"]},
    {"label":"Giovedì","closed":false,"slots":["12:00 - 15:00","19:00 - 23:00"]},
    {"label":"Venerdì","closed":false,"slots":["12:00 - 15:00","19:00 - 00:00"]},
    {"label":"Sabato","closed":false,"slots":["11:30 - 15:30","19:00 - 00:00"]},
    {"label":"Domenica","closed":false,"slots":["11:30 - 16:00"]}
  ]'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  label = excluded.label,
  domains = excluded.domains,
  preview_slug = excluded.preview_slug,
  enabled = excluded.enabled,
  vertical = excluded.vertical,
  status = excluded.status,
  theme = excluded.theme,
  features = excluded.features,
  site_config = excluded.site_config,
  hours = excluded.hours,
  updated_at = now();

insert into public.locations (
  tenant_id, slug, name, address, city, phone, email, is_default, routing_mode, hours
)
values (
  'cascina-errante',
  'milano',
  'Cascina Errante',
  'Via delle Cascine, 123',
  'Milano',
  '+39 095 123 4567',
  'info@cascinaerrante.it',
  true,
  'both',
  '[
    {"label":"Lunedì","closed":true,"slots":[]},
    {"label":"Martedì","closed":false,"slots":["12:00 - 15:00","19:00 - 23:00"]},
    {"label":"Mercoledì","closed":false,"slots":["12:00 - 15:00","19:00 - 23:00"]},
    {"label":"Giovedì","closed":false,"slots":["12:00 - 15:00","19:00 - 23:00"]},
    {"label":"Venerdì","closed":false,"slots":["12:00 - 15:00","19:00 - 00:00"]},
    {"label":"Sabato","closed":false,"slots":["11:30 - 15:30","19:00 - 00:00"]},
    {"label":"Domenica","closed":false,"slots":["11:30 - 16:00"]}
  ]'::jsonb
)
on conflict (tenant_id, slug) do update set
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  phone = excluded.phone,
  email = excluded.email,
  is_default = excluded.is_default,
  routing_mode = excluded.routing_mode,
  hours = excluded.hours,
  updated_at = now();

insert into public.tenant_demo_controls (tenant_id, preview_slug, vertical, enabled, backend_live)
values ('cascina-errante', 'cascina-errante', 'food', true, true)
on conflict (tenant_id) do update set
  preview_slug = excluded.preview_slug,
  vertical = excluded.vertical,
  enabled = excluded.enabled,
  backend_live = excluded.backend_live,
  updated_at = now();

insert into public.tenant_order_settings (
  tenant_id,
  location_id,
  takeaway_enabled,
  dine_in_enabled,
  delivery_enabled,
  auto_accept_enabled,
  pending_timeout_seconds
)
select
  'cascina-errante',
  null,
  true,
  true,
  true,
  false,
  120
where not exists (
  select 1
  from public.tenant_order_settings
  where tenant_id = 'cascina-errante' and location_id is null
);

update public.tenant_order_settings
set
  takeaway_enabled = true,
  dine_in_enabled = true,
  delivery_enabled = true,
  auto_accept_enabled = false,
  pending_timeout_seconds = 120,
  updated_at = now()
where tenant_id = 'cascina-errante' and location_id is null;

insert into public.tenant_ai_phone_settings (
  tenant_id, enabled, phone_number, greeting_message, system_prompt, handoff_phone,
  language, human_transfer_enabled, confirm_before_write, menu_sync_enabled,
  include_special_hours, after_hours_mode, quick_settings
)
values (
  'cascina-errante',
  true,
  '+39 095 123 4567',
  'Ciao, hai chiamato Cascina Errante. Posso aiutarti con menu, prenotazioni, ordini o una demo Menuary.',
  'Sei l''assistente del ristorante demo Cascina Errante. Usa solo menu, prezzi, disponibilita, orari, sedi e policy presenti nel contesto. Conferma sempre prodotti, quantita, recapito, canale, orario e pagamento prima di creare ordini o prenotazioni. Ricorda che i pagamenti Stripe del tenant usano sandbox anche in produzione.',
  '+39 095 123 4567',
  'it-IT',
  true,
  true,
  true,
  true,
  'answer_and_collect',
  '{"askAllergiesForOrders":true,"suggestAlternatives":true,"collectMarketingConsent":true,"notesForAssistant":"Tenant demo completo: quando utile, cita che Cascina Errante serve per testare tutte le feature Menuary. Pagamenti sempre in sandbox."}'::jsonb
)
on conflict (tenant_id) do update set
  enabled = excluded.enabled,
  phone_number = excluded.phone_number,
  greeting_message = excluded.greeting_message,
  system_prompt = excluded.system_prompt,
  handoff_phone = excluded.handoff_phone,
  language = excluded.language,
  human_transfer_enabled = excluded.human_transfer_enabled,
  confirm_before_write = excluded.confirm_before_write,
  menu_sync_enabled = excluded.menu_sync_enabled,
  include_special_hours = excluded.include_special_hours,
  after_hours_mode = excluded.after_hours_mode,
  quick_settings = excluded.quick_settings,
  updated_at = now();

insert into public.tenant_ai_voice (tenant_id, tone, audience, keywords, do_examples, dont_examples)
values (
  'cascina-errante',
  'caldo, agricolo, preciso, dimostrativo',
  'ospiti del ristorante, clienti demo, team Menuary, prospect food',
  'cucina a vista, cascina, idroponica, microgreens, bottega, adventure food, demo Menuary, sandbox Stripe',
  'Spiega con naturalezza i moduli attivi quando la conversazione e una demo. Conferma sempre prima di scrivere dati operativi.',
  'Non promettere pagamenti live: per Cascina Errante Stripe resta sempre in sandbox.'
)
on conflict (tenant_id) do update set
  tone = excluded.tone,
  audience = excluded.audience,
  keywords = excluded.keywords,
  do_examples = excluded.do_examples,
  dont_examples = excluded.dont_examples,
  updated_at = now();

delete from public.menu_categories where tenant_id = 'cascina-errante';

with category as (
  insert into public.menu_categories (
    tenant_id, code, title, subtitle, description, position
  )
  values (
    'cascina-errante',
    'ristorante',
    'Il Teatro della Cucina',
    'Dal campo al piatto, sotto i vostri occhi',
    'Ingredienti della cascina, produzione idroponica e una brigata che trasforma ogni servizio in un racconto.',
    0
  )
  returning id
)
insert into public.menu_items (
  tenant_id, category_id, code, name, description, price_kind, price, tags, allergens, image, available, position
)
select 'cascina-errante', id, item.code, item.name, item.description, 'single'::public.price_kind,
  jsonb_build_object('kind', 'single', 'value', item.price), item.tags, item.allergens, item.image, true, item.position
from category
cross join (
  values
    ('percorso-errante', 'Percorso Errante', 'Menu degustazione stagionale con microgreens, fiori edibili, verdure idroponiche e ingredienti raccolti in cascina.', 68::numeric, array['firma']::text[], array[]::text[], '/cascina-errante/logo.png', 0),
    ('risotto-funghi', 'Risotto ai Funghi Orientali', 'Riso mantecato con funghi coltivati in cascina, erbe fresche e polvere di porcini.', 22::numeric, array['firma','veg']::text[], array['latte','sedano','solfiti']::text[], null, 1),
    ('loto-microgreens', 'Rizoma di Loto e Microgreens', 'Rizoma di loto croccante, selezione di germogli e salsa alle erbe aromatiche.', 18::numeric, array['veg']::text[], array['soia','sesamo']::text[], null, 2),
    ('uovo-papera', 'Uovo di Papera della Cascina', 'Uovo morbido, verdure di stagione e fondo aromatico della casa.', 20::numeric, array['novita']::text[], array['uova','latte','sedano']::text[], null, 3)
) as item(code, name, description, price, tags, allergens, image, position);

with category as (
  insert into public.menu_categories (
    tenant_id, code, title, subtitle, description, position
  )
  values (
    'cascina-errante',
    'bottega',
    'La Bottega',
    'Prodotti innovativi e tradizione artigianale',
    'Dal campo alla tavola, una selezione di prodotti freschi e trasformati della nostra produzione.',
    1
  )
  returning id
)
insert into public.menu_items (
  tenant_id, category_id, code, name, description, price_kind, price, tags, allergens, available, position
)
select 'cascina-errante', id, item.code, item.name, item.description, 'single'::public.price_kind,
  jsonb_build_object('kind', 'single', 'value', item.price), item.tags, array[]::text[], true, item.position
from category
cross join (
  values
    ('microgreens-premium', 'Microgreens Premium', 'Giovani germogli ricchi di nutrienti e sapore intenso.', 9::numeric, array['firma','veg']::text[], 0),
    ('miele-aromatizzato', 'Miele Aromatizzato', 'Basilico, menta e peperoni per un miele unico al mondo.', 18::numeric, array['novita']::text[], 1),
    ('erbe-aromatiche', 'Erbe Aromatiche Fresche', 'Dal nostro sistema idroponico verticale.', 6::numeric, array['veg']::text[], 2),
    ('fiori-edibili', 'Fiori Edibili', 'Colori e sapori per piatti d''autore.', 11::numeric, array['veg']::text[], 3)
) as item(code, name, description, price, tags, position);

with category as (
  insert into public.menu_categories (
    tenant_id, code, title, subtitle, description, position
  )
  values (
    'cascina-errante',
    'adventure',
    'Errante Adventure',
    'Liofilizzati gourmet per esploratori esigenti',
    'Sapore autentico, preparazione semplice e ingredienti coltivati nella nostra cascina lombarda.',
    2
  )
  returning id
)
insert into public.menu_items (
  tenant_id, category_id, code, name, description, price_kind, price, tags, allergens, available, position
)
select 'cascina-errante', id, item.code, item.name, item.description, 'single'::public.price_kind,
  jsonb_build_object('kind', 'single', 'value', item.price), item.tags, item.allergens, true, item.position
from category
cross join (
  values
    ('adventure-risotto', 'Risotto ai Funghi Porcini', 'Cremoso risotto con funghi selezionati, pronto in 8 minuti.', 24::numeric, array['firma']::text[], array[]::text[], 0),
    ('adventure-curry', 'Curry di Verdure Thai', 'Verdure di stagione e spezie autentiche, pronto in 10 minuti.', 22::numeric, array['veg']::text[], array[]::text[], 1),
    ('adventure-pasta-fagioli', 'Pasta e Fagioli della Nonna', 'Il comfort food italiano perfetto per ogni avventura.', 20::numeric, array[]::text[], array['glutine','sedano']::text[], 2),
    ('adventure-lenticchie', 'Zuppa di Lenticchie Speziate', 'Proteine vegetali e sapori intensi per rigenerarsi.', 19::numeric, array['veg']::text[], array['sedano']::text[], 3)
) as item(code, name, description, price, tags, allergens, position);

with category as (
  insert into public.menu_categories (
    tenant_id, code, title, subtitle, description, position
  )
  values (
    'cascina-errante',
    'eventi',
    'Eventi & Privé',
    'Esperienze itineranti su misura',
    'Food truck premium, catering con ingredienti propri e show cooking della brigata Errante.',
    3
  )
  returning id
)
insert into public.menu_items (
  tenant_id, category_id, code, name, description, price_kind, price, tags, allergens, available, position
)
select 'cascina-errante', id, item.code, item.name, item.description, 'single'::public.price_kind,
  jsonb_build_object('kind', 'single', 'value', item.price), item.tags, array[]::text[], true, item.position
from category
cross join (
  values
    ('food-truck-premium', 'Food Truck Premium', 'La brigata porta i prodotti della cascina nella location del tuo evento.', 45::numeric, array['firma']::text[], 0),
    ('catering-cascina', 'Catering con Ingredienti Propri', 'Servizio completo con derrate autoprodotte e preparazione sul posto.', 65::numeric, array[]::text[], 1),
    ('show-cooking', 'Esperienza dalla Cascina', 'Show cooking, storia degli ingredienti e degustazione guidata.', 85::numeric, array['novita']::text[], 2)
) as item(code, name, description, price, tags, position);

with lead as (
  insert into public.platform_leads (
    business_name, business_slug, business_vertical, business_type,
    contact_phone, contact_email, address, city, province, postal_code, country,
    source, status, stage, temperature, notes,
    demo_url, official_domain, official_domain_active, tenant_id,
    has_website, website_url, has_google_maps, maps_ownership_claimed,
    maps_profile_complete, matching_score, priority_score
  )
  values (
    'Cascina Errante', 'cascina-errante', 'food', 'Ristorante demo / cascina esperienziale',
    '+39 095 123 4567', 'info@cascinaerrante.it', 'Via delle Cascine, 123', 'Milano', 'MI', '20010', 'IT',
    'manuale', 'customer', 'active', 'hot',
    'Tenant demo Menuary attivo con tutte le feature abilitate. Pagamenti Stripe forzati su sandbox anche sul dominio produzione cascinaerrante.it.',
    'https://demo.menuary.it/cascina-errante', 'cascinaerrante.it', true, 'cascina-errante',
    true, 'https://cascinaerrante.it', true, true,
    true, 100, 100
  )
  on conflict (business_slug) where business_slug is not null do update set
    business_name = excluded.business_name,
    business_vertical = excluded.business_vertical,
    business_type = excluded.business_type,
    contact_phone = excluded.contact_phone,
    contact_email = excluded.contact_email,
    address = excluded.address,
    city = excluded.city,
    province = excluded.province,
    postal_code = excluded.postal_code,
    country = excluded.country,
    source = excluded.source,
    status = excluded.status,
    stage = excluded.stage,
    temperature = excluded.temperature,
    notes = excluded.notes,
    demo_url = excluded.demo_url,
    official_domain = excluded.official_domain,
    official_domain_active = excluded.official_domain_active,
    tenant_id = excluded.tenant_id,
    has_website = excluded.has_website,
    website_url = excluded.website_url,
    has_google_maps = excluded.has_google_maps,
    maps_ownership_claimed = excluded.maps_ownership_claimed,
    maps_profile_complete = excluded.maps_profile_complete,
    matching_score = excluded.matching_score,
    priority_score = excluded.priority_score,
    updated_at = now()
  returning id
)
insert into public.platform_lead_locations (
  lead_id, name, street, street_number, address, city, province, postal_code, country, is_primary
)
select
  lead.id, 'Sede principale', 'Via delle Cascine', '123',
  'Via delle Cascine, 123', 'Milano', 'MI', '20010', 'IT', true
from lead
where not exists (
  select 1 from public.platform_lead_locations l
  where l.lead_id = lead.id and l.is_primary = true
);
