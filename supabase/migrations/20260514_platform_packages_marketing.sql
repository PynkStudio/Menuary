-- Aggiunta campi marketing/commerciali a platform_packages.
-- Permette di gestire il contenuto della pricing page direttamente dall'admin.

alter table public.platform_packages
  add column if not exists marketing_name        text,
  add column if not exists tagline               text,
  add column if not exists marketing_description text,
  add column if not exists price_monthly_billing numeric(10, 2),  -- prezzo con fatturazione mensile (più alto)
  add column if not exists setup_from            text,            -- es. "da € 690"
  add column if not exists marketing_items       text[] not null default '{}',
  add column if not exists is_featured           boolean not null default false,
  add column if not exists cta_label             text;

-- Aggiornamento seed con i dati di presentazione commerciale
-- (price_monthly = canone annuale/mese, price_monthly_billing = canone mensile effettivo)
update public.platform_packages set
  marketing_name        = 'Vetrina',
  tagline               = 'Solo il sito',
  marketing_description = 'Per chi vuole essere scelto meglio online. La forma minima: identità, menu e contatti curati.',
  price_monthly         = 39,
  price_monthly_billing = 49,
  setup_from            = 'da € 690',
  marketing_items       = array[
    'Sito su misura, dominio personalizzato',
    'Menu digitale aggiornabile',
    'Recensioni, foto, orari, contatti',
    'Hosting, SSL, backup inclusi',
    'Aggiornamenti tecnici continui'
  ]
where slug = 'vetrina';

update public.platform_packages set
  marketing_name        = 'Operatività',
  tagline               = 'Sito + gestionale',
  marketing_description = 'Per locali che vogliono trasformare il sito in uno strumento di lavoro.',
  price_monthly         = 82,
  price_monthly_billing = 99,
  setup_from            = 'da € 1.490',
  is_featured           = true,
  cta_label             = 'Inizia con Operatività',
  marketing_items       = array[
    'Tutto di Vetrina',
    'Prenotazioni · ordini · delivery',
    'Magazzino con alert sotto soglia',
    'Food cost & margini in tempo reale',
    'CRM clienti e analytics',
    'Pannello staff, cucina, cassa'
  ]
where slug = 'operativita';

-- Rinomina slug Growth → Operatività se necessario
update public.platform_packages set slug = 'operativita'
where slug = 'growth';

update public.platform_packages set
  marketing_name        = 'Autopilota',
  tagline               = 'Gestionale + IA',
  marketing_description = 'Per chi vuole un'assistente IA che risponde al telefono 24/7.',
  price_monthly         = 249,
  price_monthly_billing = 299,
  setup_from            = 'da € 1.990',
  marketing_items       = array[
    'Tutto di Operatività',
    'IA al telefono 24/7',
    'Prenotazioni e ordini autonomi',
    'Cloning vocale opzionale',
    'Multilingua nativa (IT, EN, FR, ES, DE)',
    'Supporto prioritario dedicato'
  ]
where slug = 'autopilota';

-- Rinomina slug Pro → Autopilota se necessario
update public.platform_packages set slug = 'autopilota'
where slug = 'pro';

comment on column public.platform_packages.price_monthly         is 'Canone mensile con fatturazione annuale (IVA esclusa) — esposto sul sito.';
comment on column public.platform_packages.price_monthly_billing is 'Canone mensile con fatturazione mensile (IVA esclusa) — più alto.';
comment on column public.platform_packages.marketing_items       is 'Bullet list di funzionalità per la pricing page pubblica.';
