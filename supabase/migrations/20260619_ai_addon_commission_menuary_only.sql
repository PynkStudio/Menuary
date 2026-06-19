-- Assistente vocale AI: add-on Menuary food-only, senza canone fisso.
-- Il corrispettivo è la commissione sugli ordini confermati gestiti dall'IA.

update public.platform_packages
set
  vertical = 'food',
  description = 'Add-on IA per chiamate inbound: nessun canone fisso, 3% sugli ordini confermati gestiti dall''IA.',
  price_monthly = 0,
  price_yearly = 0,
  price_monthly_billing = 0,
  tagline = 'IA al telefono · 3% sugli ordini confermati',
  marketing_description = 'Assistente IA al telefono disponibile 24/7 per Menuary. Risponde con la voce e il tono del tuo locale, prende prenotazioni e le scrive in agenda, accetta ordini d''asporto, suggerisce i piatti del giorno e gestisce le richieste fuori orario. Nessun canone fisso: si applica il 3% sugli ordini confermati gestiti dall''IA.',
  marketing_items = array[
    'Risponde al telefono 24/7 con la voce del locale',
    'Prenotazioni autonome direttamente in agenda',
    'Ordini d''asporto e gestione richieste fuori orario',
    'Nessun canone fisso mensile: 3% sugli ordini confermati',
    'Suggerisce piatti del giorno e promozioni',
    'Cloning vocale opzionale',
    'Multilingua nativa: IT, EN, FR, ES, DE'
  ],
  settings = coalesce(settings, '{}'::jsonb)
    || '{"commissionPct":3,"availableVerticals":["food"],"overageMode":"cost","voiceCloning":true,"channels":["phone"],"languages":["it","en","fr","es","de"]}'::jsonb,
  updated_at = now()
where slug = 'ai-phone';

delete from public.platform_package_market_prices
where package_slug = 'ai-phone';
