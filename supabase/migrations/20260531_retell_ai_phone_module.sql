-- Collega l'add-on Assistente vocale AI al modulo tecnico riusabile `aiPhone`.
-- Serve per ambienti dove 20260525_multi_country_pricing.sql era gia stata applicata
-- prima dell'introduzione del nuovo feature flag.

update public.platform_packages
set
  modules = (
    select array_agg(distinct module_key)
    from unnest(coalesce(modules, '{}'::text[]) || array['aiPhone']) as module_key
  ),
  updated_at = now()
where slug = 'ai-phone';

