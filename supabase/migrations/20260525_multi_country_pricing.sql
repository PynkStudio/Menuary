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
    ('prenotazioni', 'IT', 'EUR', 89, 109, 'da €1.190'),
    ('operativita', 'IT', 'EUR', 169, 209, 'da €1.990'),
    -- Francia
    ('presenza', 'FR', 'EUR', 49, 59, 'da €890'),
    ('prenotazioni', 'FR', 'EUR', 109, 129, 'da €1.590'),
    ('operativita', 'FR', 'EUR', 209, 249, 'da €2.490'),
    -- Germania
    ('presenza', 'DE', 'EUR', 55, 65, 'da €990'),
    ('prenotazioni', 'DE', 'EUR', 119, 139, 'da €1.690'),
    ('operativita', 'DE', 'EUR', 229, 269, 'da €2.690'),
    -- Spagna
    ('presenza', 'ES', 'EUR', 39, 49, 'da €690'),
    ('prenotazioni', 'ES', 'EUR', 85, 99, 'da €1.190'),
    ('operativita', 'ES', 'EUR', 159, 189, 'da €1.890'),
    -- Portogallo
    ('presenza', 'PT', 'EUR', 35, 45, 'da €590'),
    ('prenotazioni', 'PT', 'EUR', 75, 89, 'da €990'),
    ('operativita', 'PT', 'EUR', 139, 169, 'da €1.590'),
    -- Paesi Bassi
    ('presenza', 'NL', 'EUR', 55, 65, 'da €990'),
    ('prenotazioni', 'NL', 'EUR', 119, 139, 'da €1.690'),
    ('operativita', 'NL', 'EUR', 229, 269, 'da €2.690'),
    -- Belgio
    ('presenza', 'BE', 'EUR', 49, 59, 'da €890'),
    ('prenotazioni', 'BE', 'EUR', 109, 129, 'da €1.490'),
    ('operativita', 'BE', 'EUR', 209, 249, 'da €2.390'),
    -- Austria
    ('presenza', 'AT', 'EUR', 49, 59, 'da €890'),
    ('prenotazioni', 'AT', 'EUR', 109, 129, 'da €1.490'),
    ('operativita', 'AT', 'EUR', 209, 249, 'da €2.390'),
    -- Svizzera
    ('presenza', 'CH', 'CHF', 69, 79, 'da CHF 1.090'),
    ('prenotazioni', 'CH', 'CHF', 149, 179, 'da CHF 1.990'),
    ('operativita', 'CH', 'CHF', 289, 339, 'da CHF 3.290'),
    -- Irlanda
    ('presenza', 'IE', 'EUR', 49, 59, 'da €890'),
    ('prenotazioni', 'IE', 'EUR', 109, 129, 'da €1.590'),
    ('operativita', 'IE', 'EUR', 209, 249, 'da €2.490'),
    -- Danimarca
    ('presenza', 'DK', 'DKK', 399, 499, 'fra DKK 6.900'),
    ('prenotazioni', 'DK', 'DKK', 899, 1099, 'fra DKK 11.900'),
    ('operativita', 'DK', 'DKK', 1699, 1999, 'fra DKK 19.900'),
    -- Svezia
    ('presenza', 'SE', 'SEK', 590, 690, 'från SEK 9.900'),
    ('prenotazioni', 'SE', 'SEK', 1290, 1490, 'från SEK 17.900'),
    ('operativita', 'SE', 'SEK', 2490, 2890, 'från SEK 29.900'),
    -- Norvegia
    ('presenza', 'NO', 'NOK', 649, 749, 'fra NOK 10.900'),
    ('prenotazioni', 'NO', 'NOK', 1390, 1590, 'fra NOK 19.900'),
    ('operativita', 'NO', 'NOK', 2690, 3090, 'fra NOK 32.900'),
    -- Finlandia
    ('presenza', 'FI', 'EUR', 49, 59, 'da €890'),
    ('prenotazioni', 'FI', 'EUR', 109, 129, 'da €1.590'),
    ('operativita', 'FI', 'EUR', 209, 249, 'da €2.490'),
    -- Polonia
    ('presenza', 'PL', 'PLN', 179, 229, 'od PLN 2.990'),
    ('prenotazioni', 'PL', 'PLN', 399, 499, 'od PLN 5.490'),
    ('operativita', 'PL', 'PLN', 749, 899, 'od PLN 8.990'),
    -- Repubblica Ceca
    ('presenza', 'CZ', 'CZK', 990, 1190, 'od CZK 16.900'),
    ('prenotazioni', 'CZ', 'CZK', 2190, 2590, 'od CZK 29.900'),
    ('operativita', 'CZ', 'CZK', 3990, 4790, 'od CZK 49.900'),
    -- Slovenia
    ('presenza', 'SI', 'EUR', 35, 45, 'da €590'),
    ('prenotazioni', 'SI', 'EUR', 79, 95, 'da €1.090'),
    ('operativita', 'SI', 'EUR', 149, 179, 'da €1.690'),
    -- Croazia
    ('presenza', 'HR', 'EUR', 35, 45, 'da €590'),
    ('prenotazioni', 'HR', 'EUR', 79, 95, 'da €1.090'),
    ('operativita', 'HR', 'EUR', 149, 179, 'da €1.690'),
    -- Albania
    ('presenza', 'AL', 'ALL', 2900, 3900, 'nga ALL 49.000'),
    ('prenotazioni', 'AL', 'ALL', 6900, 8500, 'nga ALL 89.000'),
    ('operativita', 'AL', 'ALL', 12900, 15900, 'nga ALL 149.000'),
    -- Grecia
    ('presenza', 'GR', 'EUR', 35, 45, 'da €590'),
    ('prenotazioni', 'GR', 'EUR', 75, 89, 'da €990'),
    ('operativita', 'GR', 'EUR', 139, 169, 'da €1.590'),
    -- Brasile
    ('presenza', 'BR', 'BRL', 199, 249, 'a partir de R$ 3.490'),
    ('prenotazioni', 'BR', 'BRL', 449, 549, 'a partir de R$ 5.990'),
    ('operativita', 'BR', 'BRL', 849, 999, 'a partir de R$ 9.900'),
    -- Australia
    ('presenza', 'AU', 'AUD', 89, 109, 'from A$1,390'),
    ('prenotazioni', 'AU', 'AUD', 199, 239, 'from A$2,490'),
    ('operativita', 'AU', 'AUD', 379, 449, 'from A$4,190')
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
    ('ai-phone', 'FR', 'EUR', 75, 75),
    ('ai-phone', 'DE', 'EUR', 85, 85),
    ('ai-phone', 'ES', 'EUR', 60, 60),
    ('ai-phone', 'PT', 'EUR', 55, 55),
    ('ai-phone', 'NL', 'EUR', 85, 85),
    ('ai-phone', 'BE', 'EUR', 75, 75),
    ('ai-phone', 'AT', 'EUR', 75, 75),
    ('ai-phone', 'CH', 'CHF', 109, 109),
    ('ai-phone', 'IE', 'EUR', 79, 79),
    ('ai-phone', 'DK', 'DKK', 599, 599),
    ('ai-phone', 'SE', 'SEK', 890, 890),
    ('ai-phone', 'NO', 'NOK', 990, 990),
    ('ai-phone', 'FI', 'EUR', 79, 79),
    ('ai-phone', 'PL', 'PLN', 249, 249),
    ('ai-phone', 'CZ', 'CZK', 1290, 1290),
    ('ai-phone', 'SI', 'EUR', 55, 55),
    ('ai-phone', 'HR', 'EUR', 55, 55),
    ('ai-phone', 'AL', 'ALL', 4500, 4500),
    ('ai-phone', 'GR', 'EUR', 55, 55),
    ('ai-phone', 'BR', 'BRL', 299, 299),
    ('ai-phone', 'AU', 'AUD', 139, 139)
) as x(package_slug, country_code, currency, price_monthly, price_monthly_billing)
join public.platform_packages p on p.slug = x.package_slug
on conflict (package_slug, country_code) do update set
  package_id = excluded.package_id,
  currency = excluded.currency,
  price_monthly = excluded.price_monthly,
  price_monthly_billing = excluded.price_monthly_billing,
  setup_from = excluded.setup_from,
  updated_at = now();
