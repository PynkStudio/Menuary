-- Kimos: un solo menu, quello reale, sulla sede.
--
-- Il 2026-10-03 Kimos ha ricevuto la sua prima sede. L'editor menu (/api/menu-sync)
-- legge per sede, non ha trovato categorie della sede e ha seminato il menu di esempio
-- hardcoded (41 voci `kimos-…`, prezzi e lista aggiunte inventati), lasciando il menu
-- reale (165 voci, importato il 2026-07-11) a livello tenant e fuori dalla lista attiva.
-- Questa migration:
--   1. elimina il menu di esempio e la sua lista aggiunte;
--   2. sposta il menu reale sulla sede di default;
--   3. trasforma la categoria "Supplementi e impasti" in opzioni dei piatti, così al
--      telefono e sul sito il supplemento entra nella riga del piatto (e in comanda)
--      invece di diventare una riga a sé: farina integrale/kamut come variante, bufala,
--      crudo, porcini e bresaola come aggiunte delle pizze, ai prezzi del menu reale;
--   4. rimette nella lista "Menu completo" tutte le voci del menu reale.
-- Il codice che seminava (ensureSeeded + seed `kimosMenu`) è corretto nello stesso commit.

do $$
declare
  loc uuid;
  supplementi uuid;
  lista uuid;
begin
  select id into loc from public.locations where tenant_id = 'kimos' and is_default limit 1;
  if loc is null then
    raise exception 'kimos: sede di default non trovata';
  end if;

  -- 1. Menu di esempio (seed) e lista aggiunte inventata.
  delete from public.menu_items where tenant_id = 'kimos' and location_id = loc;
  delete from public.menu_categories where tenant_id = 'kimos' and location_id = loc;
  delete from public.extra_lists where tenant_id = 'kimos' and code = 'kimos-lista-pizze';

  -- 2. Menu reale sulla sede.
  update public.menu_categories set location_id = loc, updated_at = now()
   where tenant_id = 'kimos' and location_id is null;
  update public.menu_items set location_id = loc, updated_at = now()
   where tenant_id = 'kimos' and location_id is null;
  update public.extra_lists set location_id = loc, updated_at = now()
   where tenant_id = 'kimos' and location_id is null;

  -- 3a. Farina per le pizze: Normale / Integrale +1 € / Kamut +1,50 €.
  update public.menu_items mi
     set variant_groups = jsonb_build_array(jsonb_build_object(
           'id', 'farina-pizza',
           'name', 'Farina',
           'required', false,
           'defaultOptionId', 'farina-normale',
           'options', jsonb_build_array(
             jsonb_build_object('id', 'farina-normale', 'name', 'Normale', 'price', 0),
             jsonb_build_object('id', 'farina-integrale', 'name', 'Integrale', 'price', 1),
             jsonb_build_object('id', 'farina-kamut', 'name', 'Kamut', 'price', 1.5)
           ))),
         updated_at = now()
    from public.menu_categories c
   where c.id = mi.category_id and mi.tenant_id = 'kimos' and c.code = 'pizze'
     and coalesce(jsonb_array_length(case when jsonb_typeof(mi.variant_groups) = 'array' then mi.variant_groups end), 0) = 0;

  -- 3b. Farina per panini e piadine: Normale / Integrale +0,50 € / Kamut +0,50 €.
  update public.menu_items mi
     set variant_groups = jsonb_build_array(jsonb_build_object(
           'id', 'farina-pane',
           'name', 'Farina',
           'required', false,
           'defaultOptionId', 'farina-pane-normale',
           'options', jsonb_build_array(
             jsonb_build_object('id', 'farina-pane-normale', 'name', 'Normale', 'price', 0),
             jsonb_build_object('id', 'farina-pane-integrale', 'name', 'Integrale', 'price', 0.5),
             jsonb_build_object('id', 'farina-pane-kamut', 'name', 'Kamut', 'price', 0.5)
           ))),
         updated_at = now()
    from public.menu_categories c
   where c.id = mi.category_id and mi.tenant_id = 'kimos'
     and (c.code = 'panini' or (c.code = 'doner-kebab' and (mi.name ilike 'panino%' or mi.name ilike 'piadina%')))
     and coalesce(jsonb_array_length(case when jsonb_typeof(mi.variant_groups) = 'array' then mi.variant_groups end), 0) = 0;

  -- 3c. Supplementi pizza: bufala, crudo, porcini o bresaola, 2 € l'uno.
  insert into public.extra_lists (tenant_id, code, name, location_id)
  values ('kimos', 'supplementi-pizza', 'Supplementi pizza', loc)
  on conflict do nothing;
  select id into lista from public.extra_lists where tenant_id = 'kimos' and code = 'supplementi-pizza';
  delete from public.extra_list_items where list_id = lista;
  insert into public.extra_list_items (list_id, code, name, price, position) values
    (lista, 'bufala', 'Bufala', 2, 0),
    (lista, 'prosciutto-crudo', 'Prosciutto crudo', 2, 1),
    (lista, 'porcini', 'Porcini', 2, 2),
    (lista, 'bresaola', 'Bresaola', 2, 3);
  update public.menu_items mi set extra_list_id = lista, updated_at = now()
    from public.menu_categories c
   where c.id = mi.category_id and mi.tenant_id = 'kimos' and c.code = 'pizze' and mi.extra_list_id is null;

  -- 3d. Le quattro voci "supplemento" ora sono opzioni dei piatti.
  select id into supplementi from public.menu_categories where tenant_id = 'kimos' and code = 'supplementi';
  if supplementi is not null then
    delete from public.menu_items where category_id = supplementi;
    delete from public.menu_categories where id = supplementi;
  end if;

  -- 4. Lista "Menu completo" = tutte le voci del menu reale, nell'ordine della carta.
  select id into lista from public.menu_lists where tenant_id = 'kimos' and code = 'menu-completo';
  if lista is null then
    insert into public.menu_lists (tenant_id, code, name, description, position, enabled, visibility, location_id)
    values ('kimos', 'menu-completo', 'Menu completo', 'Tutte le voci pubblicate.', 0, true, '{}'::jsonb, loc)
    returning id into lista;
  end if;
  delete from public.menu_list_items where list_id = lista;
  insert into public.menu_list_items (list_id, item_id, position)
  select lista, mi.id, (row_number() over (order by c.position, mi.position, mi.name) - 1)::int
    from public.menu_items mi
    join public.menu_categories c on c.id = mi.category_id
   where mi.tenant_id = 'kimos';
end;
$$;
