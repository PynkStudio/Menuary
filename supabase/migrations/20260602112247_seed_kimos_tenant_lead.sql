-- Pizzeria Kimos: tenant demo collegato al lead CRM, sede principale,
-- orari operativi e configurazione iniziale degli ordini AI.
-- Idempotente: può essere rieseguito senza duplicare tenant, sede o lead.

insert into public.tenants (
  id, name, label, domains, preview_slug, enabled, vertical, status, theme, features, site_config, hours
)
values (
  'kimos',
  'Pizzeria Kimos',
  'Lead · Pizzeria Kimos',
  '{}'::text[],
  'kimos',
  true,
  'food',
  'trattativa',
  '{
    "red":"#C64335","redDark":"#8E2B26","peach":"#E9D8B6","cream":"#F4E9D3",
    "ink":"#171512","brick":"#2B211C","mustard":"#E5B83B","mustardSoft":"#F1D98C",
    "green":"#667A45","pink":"#B96756"
  }'::jsonb,
  '{
    "website":true,"onlineMenu":true,"takeaway":true,"tableOrders":false,"orderKiosk":false,
    "kitchenDisplay":true,"dinerSeparation":false,"reservations":false,"tablePlanner":false,
    "productAvailability":true,"upselling":true,"crm":true,"analytics":true,"takeawaySlots":true,
    "deliveryHub":true,"inventoryFoodCost":false,"printStations":false,"staffRoles":false,
    "multiLocation":false,"favorites":true,"reviews":true,"gallery":true,"shop":false,
    "slabbby":false,"aiPhone":true,"aiWhatsapp":true,"hubriseSync":false
  }'::jsonb,
  '{
    "address":"Via Bruno Cassinari, 3 - 20138 Milano (MI)",
    "phone":"02 513404",
    "googleMapsUrl":"https://maps.app.goo.gl/55BuJJ4iMh6ZWqrs7",
    "facebookUrl":"https://www.facebook.com/profile.php?id=100054450701009",
    "websiteUrl":"https://pizzeria-kimos.it"
  }'::jsonb,
  '[
    {"label":"Lunedì","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Martedì","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Mercoledì","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Giovedì","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Venerdì","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Sabato","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Domenica","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]}
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
  tenant_id, slug, name, address, city, phone, is_default, hours
)
values (
  'kimos',
  'milano-santa-giulia',
  'Milano Santa Giulia',
  'Via Bruno Cassinari, 3',
  'Milano',
  '02 513404',
  true,
  '[
    {"label":"Lunedì","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Martedì","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Mercoledì","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Giovedì","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Venerdì","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Sabato","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]},
    {"label":"Domenica","closed":false,"slots":["11:30 – 15:00","18:00 – 00:00"]}
  ]'::jsonb
)
on conflict (tenant_id, slug) do update set
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  phone = excluded.phone,
  is_default = excluded.is_default,
  hours = excluded.hours,
  updated_at = now();

insert into public.tenant_ai_phone_settings (
  tenant_id, enabled, phone_number, greeting_message, system_prompt, handoff_phone,
  language, human_transfer_enabled, confirm_before_write, menu_sync_enabled,
  include_special_hours, after_hours_mode, quick_settings
)
values (
  'kimos',
  true,
  '02 513404',
  'Ciao, hai chiamato Pizzeria Kimos. Posso aiutarti a scegliere dal menu o raccogliere il tuo ordine.',
  'Sei l''assistente ordini di Pizzeria Kimos. Usa solo menu, prezzi, disponibilità, orari e sede presenti nel contesto. Conferma sempre prodotti, quantità, recapito, modalità di consegna o ritiro e orario prima di creare l''ordine. Per allergeni o richieste dubbie passa la chiamata al locale.',
  '02 513404',
  'it-IT',
  true,
  true,
  true,
  true,
  'answer_and_collect',
  '{"askAllergiesForOrders":true,"suggestAlternatives":true,"collectMarketingConsent":false,"notesForAssistant":"Per Kimos raccogli sempre la scelta tra ritiro e consegna. Conferma salse e piccante per kebab e piadine."}'::jsonb
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

with lead as (
  insert into public.platform_leads (
    business_name, business_slug, business_vertical, business_type,
    contact_phone, address, city, province, postal_code, country,
    source, status, stage, temperature, notes,
    demo_url, official_domain, official_domain_active, tenant_id,
    has_website, website_url, has_google_maps, maps_ownership_claimed,
    maps_profile_complete, matching_score, priority_score
  )
  values (
    'Pizzeria Kimos', 'pizzeria-kimos', 'food', 'Pizzeria / kebab',
    '02 513404', 'Via Bruno Cassinari, 3', 'Milano', 'MI', '20138', 'IT',
    'manuale', 'prospect', 'demo', 'hot',
    'Lead con sito demo Menuary dedicato. Moduli attivi: menu online, ordini online, ordini AI WhatsApp e Retell, recensioni Google e predisposizione Business API. Orari richiesti: 7/7 11:30-15:00 e 18:00-00:00.',
    'https://demo.menuary.it/kimos', 'pizzeria-kimos.it', false, 'kimos',
    true, 'https://pizzeria-kimos.it', true, null,
    true, 91, 94
  )
  on conflict (business_slug) where business_slug is not null do update set
    business_name = excluded.business_name,
    business_vertical = excluded.business_vertical,
    business_type = excluded.business_type,
    contact_phone = excluded.contact_phone,
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
  lead.id, 'Sede principale', 'Via Bruno Cassinari', '3',
  'Via Bruno Cassinari, 3', 'Milano', 'MI', '20138', 'IT', true
from lead
where not exists (
  select 1 from public.platform_lead_locations l
  where l.lead_id = lead.id and l.is_primary = true
);
