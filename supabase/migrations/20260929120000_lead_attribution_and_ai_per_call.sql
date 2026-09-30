-- 1. Attribuzione marketing dei lead in arrivo dai siti (UTM, gclid, fbclid,
--    referrer, pagina di atterraggio). Serve a sapere quale campagna ha portato
--    ogni richiesta.
alter table public.platform_leads
  add column if not exists attribution jsonb;

comment on column public.platform_leads.attribution is
  'Fonte della visita che ha generato il lead: utm_*, gclid, gbraid, wbraid, fbclid, msclkid, referrer, landing_path, captured_at.';

-- 2. Assistente vocale AI: € 0,30 a chiamata gestita + 3% sugli ordini ricevuti
--    tramite le chiamate. Il prezzo a chiamata vive in settings.perCallPrice,
--    letto dal sito marketing (fonte unica).
update public.platform_packages
set
  description = 'Add-on IA per chiamate inbound: nessun canone fisso, € 0,30 per chiamata gestita più 3% sugli ordini ricevuti tramite le chiamate.',
  tagline = 'IA al telefono · € 0,30 a chiamata + 3% ordini',
  marketing_description = 'Assistente IA al telefono disponibile 24/7 per Menuary. Risponde con la voce e il tono del tuo locale, prende prenotazioni e le scrive in agenda, accetta ordini d''asporto, suggerisce i piatti del giorno e gestisce le richieste fuori orario. Nessun canone fisso: € 0,30 per ogni chiamata gestita dall''IA più il 3% sugli ordini ricevuti tramite le chiamate.',
  marketing_items = array[
    'Risponde al telefono 24/7 con la voce del locale',
    'Prenotazioni autonome direttamente in agenda',
    'Ordini d''asporto e gestione richieste fuori orario',
    'Nessun canone fisso: € 0,30 a chiamata + 3% sugli ordini ricevuti',
    'Suggerisce piatti del giorno e promozioni',
    'Cloning vocale opzionale',
    'Multilingua nativa: IT, EN, FR, ES, DE'
  ],
  settings = coalesce(settings, '{}'::jsonb) || '{"perCallPrice":0.3,"commissionPct":3}'::jsonb,
  updated_at = now()
where slug = 'ai-phone';
