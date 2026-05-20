-- Listini multi-paese per Menuary/Bizery.
-- Ogni riga sovrascrive i prezzi base di platform_packages per un mercato.

alter table public.platform_leads
  add column if not exists country text not null default 'IT';

alter table public.platform_packages
  add column if not exists package_kind text not null default 'base',
  add column if not exists min_package_slug text,
  add column if not exists settings jsonb not null default '{}'::jsonb;

create table if not exists public.platform_package_market_prices (
  id                    uuid primary key default gen_random_uuid(),
  package_id            uuid references public.platform_packages (id) on delete cascade,
  package_slug          text not null,
  country_code          text not null,
  currency              text not null default 'EUR',
  price_monthly         numeric(10, 2) not null default 0,
  price_monthly_billing numeric(10, 2),
  setup_from            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (package_slug, country_code)
);

create index if not exists platform_package_market_prices_country_idx
  on public.platform_package_market_prices (country_code, package_slug);

alter table public.platform_package_market_prices enable row level security;

comment on table public.platform_package_market_prices is 'Override prezzi pacchetti per mercato nazionale, gestiti da admin.menuary.it.';
comment on column public.platform_package_market_prices.country_code is 'ISO 3166-1 alpha-2 del mercato commerciale: IT, FR, DE, AU, ecc.';
comment on column public.platform_leads.country is 'Nazionalità/mercato commerciale del lead, usata per listino e segmentazione CRM.';
comment on column public.platform_packages.package_kind is 'base per piani principali, addon per piani aggiuntivi come assistente AI.';
comment on column public.platform_packages.min_package_slug is 'Slug del piano minimo richiesto per attivare un add-on.';
comment on column public.platform_packages.settings is 'Impostazioni commerciali/operative del piano o add-on in JSON.';

insert into public.platform_packages (
  name,
  slug,
  description,
  package_kind,
  min_package_slug,
  price_monthly,
  price_yearly,
  currency,
  modules,
  is_active,
  sort_order,
  marketing_name,
  tagline,
  marketing_description,
  price_monthly_billing,
  setup_from,
  marketing_items,
  cta_label,
  settings
)
values (
  'ai-phone',
  'ai-phone',
  'Assistente IA al telefono disponibile 24/7.',
  'addon',
  'prenotazioni',
  60,
  720,
  'EUR',
  array[]::text[],
  true,
  100,
  'Assistente vocale AI',
  'IA al telefono · 24/7',
  'Assistente IA al telefono disponibile 24/7. Risponde con la voce e il tono del tuo locale, prende prenotazioni e le scrive in agenda, accetta ordini d''asporto, suggerisce i piatti del giorno e gestisce le richieste fuori orario.',
  60,
  null,
  array[
    'Risponde al telefono 24/7 con la voce del locale',
    'Prenotazioni autonome direttamente in agenda',
    'Ordini d''asporto e gestione richieste fuori orario',
    'Suggerisce piatti del giorno e promozioni',
    'Cloning vocale opzionale',
    'Multilingua nativa: IT, EN, FR, ES, DE'
  ],
  'Scopri l''integrazione IA',
  '{"includedMinutes":120,"overageMode":"cost","voiceCloning":true,"channels":["phone"],"languages":["it","en","fr","es","de"]}'::jsonb
)
on conflict (slug) do update set
  package_kind = excluded.package_kind,
  min_package_slug = excluded.min_package_slug,
  price_monthly = excluded.price_monthly,
  price_yearly = excluded.price_yearly,
  marketing_name = excluded.marketing_name,
  tagline = excluded.tagline,
  marketing_description = excluded.marketing_description,
  price_monthly_billing = excluded.price_monthly_billing,
  marketing_items = excluded.marketing_items,
  cta_label = excluded.cta_label,
  settings = excluded.settings,
  updated_at = now();

insert into public.platform_package_market_prices (
  package_id,
  package_slug,
  country_code,
  currency,
  price_monthly,
  price_monthly_billing,
  setup_from
)
select p.id, x.package_slug, x.country_code, x.currency, x.price_monthly, x.price_monthly_billing, x.setup_from
from (
  values
    -- Italia
    ('presenza', 'IT', 'EUR', 39, 49, 'da €690'),
    ('prenotazioni', 'IT', 'EUR', 89, 99, 'da €1.190'),
    ('operativita', 'IT', 'EUR', 169, 199, 'da €1.990'),
    -- Francia
    ('presenza', 'FR', 'EUR', 49, 59, 'da €790'),
    ('prenotazioni', 'FR', 'EUR', 99, 119, 'da €1.390'),
    ('operativita', 'FR', 'EUR', 189, 229, 'da €2.290'),
    -- Germania
    ('presenza', 'DE', 'EUR', 49, 59, 'da €790'),
    ('prenotazioni', 'DE', 'EUR', 109, 129, 'da €1.490'),
    ('operativita', 'DE', 'EUR', 199, 239, 'da €2.390'),
    -- Spagna
    ('presenza', 'ES', 'EUR', 39, 49, 'da €690'),
    ('prenotazioni', 'ES', 'EUR', 89, 109, 'da €1.190'),
    ('operativita', 'ES', 'EUR', 169, 199, 'da €1.990'),
    -- Portogallo
    ('presenza', 'PT', 'EUR', 35, 45, 'da €590'),
    ('prenotazioni', 'PT', 'EUR', 79, 95, 'da €1.090'),
    ('operativita', 'PT', 'EUR', 149, 179, 'da €1.790'),
    -- Paesi Bassi
    ('presenza', 'NL', 'EUR', 49, 59, 'da €790'),
    ('prenotazioni', 'NL', 'EUR', 109, 129, 'da €1.490'),
    ('operativita', 'NL', 'EUR', 199, 239, 'da €2.390'),
    -- Belgio
    ('presenza', 'BE', 'EUR', 45, 55, 'da €750'),
    ('prenotazioni', 'BE', 'EUR', 99, 119, 'da €1.390'),
    ('operativita', 'BE', 'EUR', 189, 229, 'da €2.290'),
    -- Austria
    ('presenza', 'AT', 'EUR', 45, 55, 'da €750'),
    ('prenotazioni', 'AT', 'EUR', 99, 119, 'da €1.390'),
    ('operativita', 'AT', 'EUR', 189, 229, 'da €2.290'),
    -- Svizzera
    ('presenza', 'CH', 'CHF', 59, 69, 'da CHF 890'),
    ('prenotazioni', 'CH', 'CHF', 129, 149, 'da CHF 1.690'),
    ('operativita', 'CH', 'CHF', 249, 289, 'da CHF 2.790'),
    -- Irlanda
    ('presenza', 'IE', 'EUR', 49, 59, 'da €790'),
    ('prenotazioni', 'IE', 'EUR', 109, 129, 'da €1.490'),
    ('operativita', 'IE', 'EUR', 199, 239, 'da €2.390'),
    -- Danimarca
    ('presenza', 'DK', 'DKK', 399, 499, 'fra DKK 5.900'),
    ('prenotazioni', 'DK', 'DKK', 849, 999, 'fra DKK 10.900'),
    ('operativita', 'DK', 'DKK', 1599, 1899, 'fra DKK 17.900'),
    -- Svezia
    ('presenza', 'SE', 'SEK', 549, 649, 'från SEK 8.900'),
    ('prenotazioni', 'SE', 'SEK', 1190, 1390, 'från SEK 15.900'),
    ('operativita', 'SE', 'SEK', 2190, 2590, 'från SEK 25.900'),
    -- Norvegia
    ('presenza', 'NO', 'NOK', 590, 690, 'fra NOK 9.900'),
    ('prenotazioni', 'NO', 'NOK', 1290, 1490, 'fra NOK 17.900'),
    ('operativita', 'NO', 'NOK', 2390, 2790, 'fra NOK 29.900'),
    -- Finlandia
    ('presenza', 'FI', 'EUR', 49, 59, 'da €790'),
    ('prenotazioni', 'FI', 'EUR', 109, 129, 'da €1.490'),
    ('operativita', 'FI', 'EUR', 199, 239, 'da €2.390'),
    -- Polonia
    ('presenza', 'PL', 'PLN', 199, 249, 'od PLN 3.490'),
    ('prenotazioni', 'PL', 'PLN', 449, 549, 'od PLN 5.990'),
    ('operativita', 'PL', 'PLN', 849, 999, 'od PLN 9.990'),
    -- Repubblica Ceca
    ('presenza', 'CZ', 'CZK', 990, 1190, 'od CZK 17.900'),
    ('prenotazioni', 'CZ', 'CZK', 2190, 2590, 'od CZK 29.900'),
    ('operativita', 'CZ', 'CZK', 4190, 4990, 'od CZK 49.900'),
    -- Australia
    ('presenza', 'AU', 'AUD', 79, 95, 'from A$1,190'),
    ('prenotazioni', 'AU', 'AUD', 179, 209, 'from A$2,190'),
    ('operativita', 'AU', 'AUD', 329, 389, 'from A$3,690')
) as x(package_slug, country_code, currency, price_monthly, price_monthly_billing, setup_from)
join public.platform_packages p on p.slug = x.package_slug
on conflict (package_slug, country_code) do update set
  package_id = excluded.package_id,
  currency = excluded.currency,
  price_monthly = excluded.price_monthly,
  price_monthly_billing = excluded.price_monthly_billing,
  setup_from = excluded.setup_from,
  updated_at = now();

insert into public.platform_package_market_prices (
  package_id,
  package_slug,
  country_code,
  currency,
  price_monthly,
  price_monthly_billing,
  setup_from
)
select p.id, x.package_slug, x.country_code, x.currency, x.price_monthly, x.price_monthly_billing, null
from (
  values
    ('ai-phone', 'IT', 'EUR', 60, 60),
    ('ai-phone', 'FR', 'EUR', 69, 69),
    ('ai-phone', 'DE', 'EUR', 75, 75),
    ('ai-phone', 'ES', 'EUR', 60, 60),
    ('ai-phone', 'PT', 'EUR', 55, 55),
    ('ai-phone', 'NL', 'EUR', 75, 75),
    ('ai-phone', 'BE', 'EUR', 69, 69),
    ('ai-phone', 'AT', 'EUR', 69, 69),
    ('ai-phone', 'CH', 'CHF', 89, 89),
    ('ai-phone', 'IE', 'EUR', 75, 75),
    ('ai-phone', 'DK', 'DKK', 549, 549),
    ('ai-phone', 'SE', 'SEK', 790, 790),
    ('ai-phone', 'NO', 'NOK', 849, 849),
    ('ai-phone', 'FI', 'EUR', 75, 75),
    ('ai-phone', 'PL', 'PLN', 299, 299),
    ('ai-phone', 'CZ', 'CZK', 1490, 1490),
    ('ai-phone', 'AU', 'AUD', 119, 119)
) as x(package_slug, country_code, currency, price_monthly, price_monthly_billing)
join public.platform_packages p on p.slug = x.package_slug
on conflict (package_slug, country_code) do update set
  package_id = excluded.package_id,
  currency = excluded.currency,
  price_monthly = excluded.price_monthly,
  price_monthly_billing = excluded.price_monthly_billing,
  setup_from = excluded.setup_from,
  updated_at = now();
