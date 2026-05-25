-- Modulo add-on WhatsApp AI. In test usa bridge WhatsApp Web; in produzione potra'
-- essere collegato a WhatsApp Business API senza cambiare le azioni operative.

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
  marketing_items,
  cta_label,
  settings
)
values (
  'ai-whatsapp',
  'ai-whatsapp',
  'Assistente IA per conversazioni inbound WhatsApp.',
  'addon',
  'prenotazioni',
  40,
  480,
  'EUR',
  array['aiWhatsapp']::text[],
  true,
  101,
  'Assistente WhatsApp AI',
  'IA su WhatsApp',
  'Risponde ai messaggi WhatsApp, prende ordini, raccoglie dati delivery, propone slot e invia link pagamento.',
  40,
  array[
    'Ordini e prenotazioni via WhatsApp',
    'Delivery con indirizzo e note consegna',
    'Link pagamento Stripe via SMS o WhatsApp',
    'Disponibilita calendario integrata',
    'Test via WhatsApp Web bridge'
  ],
  'Scopri WhatsApp AI',
  '{"channels":["whatsapp"],"languages":["it","en","fr","es","de"],"transport":"whatsapp_web_bridge"}'::jsonb
)
on conflict (slug) do update set
  package_kind = excluded.package_kind,
  min_package_slug = excluded.min_package_slug,
  price_monthly = excluded.price_monthly,
  price_yearly = excluded.price_yearly,
  modules = excluded.modules,
  marketing_name = excluded.marketing_name,
  tagline = excluded.tagline,
  marketing_description = excluded.marketing_description,
  price_monthly_billing = excluded.price_monthly_billing,
  marketing_items = excluded.marketing_items,
  cta_label = excluded.cta_label,
  settings = excluded.settings,
  updated_at = now();

