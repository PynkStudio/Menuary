-- Richiede l'estensione pg_cron (già abilitata su Supabase Pro)
select cron.schedule(
  'expire-novita-tags',
  '0 0 * * *',
  $$
    update public.menu_items
    set
      tags     = array_remove(tags, 'novita'),
      tag_meta = tag_meta - 'novita'
    where
      tags @> array['novita']
      and (tag_meta -> 'novita' ->> 'expiresAt') is not null
      and (tag_meta -> 'novita' ->> 'expiresAt')::date < current_date;
  $$
);
