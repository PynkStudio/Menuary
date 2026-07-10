-- Sostituisce integralmente il menu DB di Pizzeria Kimos.
-- Scope intenzionale: solo tenant_id = 'kimos'.

create or replace function public._kimos_menu_allergens(p_ingredients text)
returns text[]
language sql
immutable
as $$
  with src as (
    select lower(coalesce(p_ingredients, '')) as v
  ),
  hits(allergen) as (
    select 'glutine' from src
    where v ~ '(farina|impasto|pizza|pane|panino|piadina|focaccia|calzone|millefoglie|torta|pasta|crocchette|nuggets|anelli|arancini|chele|falafel|patatine|cotolet|hamburger|wurstel|würstel|kebab|birra)'
    union
    select 'crostacei' from src
    where v ~ '(gamber|gamberetti|granchio|frutti di mare)'
    union
    select 'uova' from src
    where v ~ '(uovo|uova|maionese|tiramis|millefoglie|torta|tartufo|cotolet|hamburger|nuggets|arancini|crocchette)'
    union
    select 'pesce' from src
    where v ~ '(acciug|salmone|tonno|frutti di mare)'
    union
    select 'soia' from src
    where v ~ '(hamburger|wurstel|würstel|kebab|sottilette|tartufo|cioccolato|nuggets)'
    union
    select 'latte' from src
    where v ~ '(mozz|bufala|burrata|stracciatella|scamorza|ricotta|grana|parmigiano|brie|zola|gorgonzola|caprino|stracchino|fontina|panna|salsa yogurt|sottilette|nutella|tiramis|millefoglie|torta|tartufo|cioccolato)'
    union
    select 'frutta_guscio' from src
    where v ~ '(nutella|torta della nonna|tartufo|cioccolato)'
    union
    select 'senape' from src
    where v ~ '(maionese|hamburger|cotolet|wurstel|würstel|kebab|salsa)'
    union
    select 'sesamo' from src
    where v ~ '(kebab|falafel|panino|piadina)'
    union
    select 'solfiti' from src
    where v ~ '(vino|birra|salame|speck|prosciutto|cotto|crudo|pancetta|bresaola|salsiccia|wurstel|würstel|nduja|olive|carciofi|peperoni|funghi|tonno|bibita)'
  )
  select coalesce(array_agg(allergen order by array_position(array[
    'glutine','crostacei','uova','pesce','arachidi','soia','latte',
    'frutta_guscio','sedano','senape','sesamo','solfiti','lupini','molluschi'
  ], allergen)), '{}'::text[])
  from hits;
$$;

delete from public.menu_list_items
where item_id in (select id from public.menu_items where tenant_id = 'kimos');

delete from public.menu_item_translations
where menu_item_id in (select id from public.menu_items where tenant_id = 'kimos');

delete from public.menu_items where tenant_id = 'kimos';

delete from public.menu_categories where tenant_id = 'kimos';

with cats as (
  insert into public.menu_categories (tenant_id, code, title, subtitle, description, position)
  values
    ('kimos', 'pizze', 'Le nostre pizze', 'Normale e gigante', 'Pizze dal menu Kimos con formato normale e gigante.', 0),
    ('kimos', 'calzoni', 'Calzoni', null, 'Calzoni ripieni al forno.', 1),
    ('kimos', 'panini', 'Panini', null, 'Panini classici, kebab e panino gigante.', 2),
    ('kimos', 'focacce', 'Focacce', null, 'Focacce farcite e speciali.', 3),
    ('kimos', 'doner-kebab', 'Doner kebab', null, 'Panino, piadina e piatti kebab.', 4),
    ('kimos', 'piatti', 'Piatti', null, 'Piatti caldi e box.', 5),
    ('kimos', 'dolci', 'Dolci', null, 'Dessert al cucchiaio e semifreddi.', 6),
    ('kimos', 'sfizioserie', 'Sfizioserie', null, 'Fritti e snack.', 7),
    ('kimos', 'insalatone', 'Insalatone con pane', null, 'Insalatone servite con pane.', 8),
    ('kimos', 'bevande', 'Bevande', null, 'Acqua, bibite, birre e vino.', 9),
    ('kimos', 'menu-completi', 'Menu completi', 'Con bibita 33cl', 'Menu completi promozionali dal cartaceo Kimos.', 10),
    ('kimos', 'supplementi', 'Supplementi e impasti', null, 'Supplementi, impasti speciali e aggiunte.', 11)
  returning id, code
),
items(category_code, code, name, ingredients, price_kind, price, tags, piccante_level, position) as (
  values
    ('pizze','pizza-01-focaccia-liscia','Focaccia liscia','Sale, olio, origano','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',4.00),'large',jsonb_build_object('label','Gigante','price',12.00),'defaultKey','small'),array[]::text[],null::int,1),
    ('pizze','pizza-02-marinara','Marinara','Pomodoro, aglio, origano','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',5.00),'large',jsonb_build_object('label','Gigante','price',16.00),'defaultKey','small'),array[]::text[],null,2),
    ('pizze','pizza-03-margherita','Margherita','Pomodoro, mozzarella','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',6.00),'large',jsonb_build_object('label','Gigante','price',19.00),'defaultKey','small'),array[]::text[],null,3),
    ('pizze','pizza-04-americana','Americana','Pomodoro, mozzarella, wurstel, patatine fritte','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,4),
    ('pizze','pizza-05-affumicata','Affumicata','Pomodoro, mozzarella, scamorza, rucola','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,5),
    ('pizze','pizza-06-abruzzese','Abruzzese','Pomodoro, mozzarella, peperoni, prosciutto cotto, cipolla','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,6),
    ('pizze','pizza-07-al-pesto','Al pesto','Mozzarella, pesto, pomodorini','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,7),
    ('pizze','pizza-08-bismark','Bismark','Pomodoro, mozzarella, prosciutto cotto, uovo','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,8),
    ('pizze','pizza-09-brie','Brie','Pomodoro, mozzarella, brie','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,9),
    ('pizze','pizza-10-braccio-di-ferro','Braccio di ferro','Pomodoro, mozzarella, spinaci, ricotta','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',23.50),'defaultKey','small'),array[]::text[],null,10),
    ('pizze','pizza-11-biancaneve','Biancaneve','Mozzarella, ricotta, grana','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,11),
    ('pizze','pizza-12-carciofi','Carciofi','Pomodoro, mozzarella, carciofi al naturale','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,12),
    ('pizze','pizza-13-caprino','Caprino','Pomodoro, mozzarella, caprino, peperoni','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,13),
    ('pizze','pizza-14-caprino-e-speck','Caprino e speck','Pomodoro, mozzarella, caprino, speck','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,14),
    ('pizze','pizza-15-california','California','Pomodoro, mozzarella, salame piccante, patatine fritte','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array['piccante']::text[],1,15),
    ('pizze','pizza-16-carbonara','Carbonara','Pomodoro, mozzarella, pancetta, uovo, panna','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',27.00),'defaultKey','small'),array[]::text[],null,16),
    ('pizze','pizza-17-capricciosa','Capricciosa','Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi, olive, origano, capperi, acciughe','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,17),
    ('pizze','pizza-18-cotto-e-porcini','Cotto e porcini','Pomodoro, mozzarella, prosciutto cotto, porcini','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,18),
    ('pizze','pizza-19-cotto-e-stracchino','Cotto e stracchino','Pomodoro, mozzarella, prosciutto cotto, stracchino','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,19),
    ('pizze','pizza-20-diavola','Diavola','Pomodoro, mozzarella, salame piccante','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array['piccante']::text[],1,20),
    ('pizze','pizza-21-famosa','Famosa','Pomodoro, mozzarella, fagioli, cipolle, salame piccante','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array['piccante']::text[],1,21),
    ('pizze','pizza-22-friarelli','Friarelli','Pomodoro, mozzarella, salsiccia, cime di rapa','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,22),
    ('pizze','pizza-23-frutti-di-mare','Frutti di mare','Pomodoro, frutti di mare, aglio','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,23),
    ('pizze','pizza-24-formaggi-misti','Formaggi misti','Pomodoro, mozzarella, brie, scamorza, zola, grana','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,24),
    ('pizze','pizza-25-funghi','Funghi','Pomodoro, mozzarella, funghi freschi','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',23.00),'defaultKey','small'),array[]::text[],null,25),
    ('pizze','pizza-26-gamberetti-e-rucola','Gamberetti e rucola','Pomodoro, mozzarella, gamberetti, rucola','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,26),
    ('pizze','pizza-27-gustosa','Gustosa','Pomodoro, mozzarella, wurstel, salame, prosciutto cotto','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,27),
    ('pizze','pizza-28-genovese','Genovese','Pomodoro, mozzarella, pesto','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,28),
    ('pizze','pizza-29-ilaria','Ilaria','Mozzarella di bufala, scamorza, pomodorini, salmone','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.50),'large',jsonb_build_object('label','Gigante','price',27.00),'defaultKey','small'),array[]::text[],null,29),
    ('pizze','pizza-30-gorgonzola','Gorgonzola','Pomodoro, mozzarella, gorgonzola','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,30),
    ('pizze','pizza-31-kiro','Kiro','Mozzarella, gamberetti, zucchine, panna','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,31),
    ('pizze','pizza-32-mare-monti','Mare monti','Pomodoro, mozzarella, porcini, gamberetti','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',10.00),'large',jsonb_build_object('label','Gigante','price',27.00),'defaultKey','small'),array[]::text[],null,32),
    ('pizze','pizza-33-messicana','Messicana','Pomodoro, mozzarella, fagioli borlotti, peperoncino, origano, salame piccante','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array['piccante']::text[],2,33),
    ('pizze','pizza-34-melanzane','Melanzane','Pomodoro, mozzarella, melanzane grigliate','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',7.50),'large',jsonb_build_object('label','Gigante','price',23.00),'defaultKey','small'),array[]::text[],null,34),
    ('pizze','pizza-35-mela-e-zola','Mela e zola','Mozzarella, mela, zola','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',27.00),'defaultKey','small'),array[]::text[],null,35),
    ('pizze','pizza-36-mozzarella-di-bufala','Mozzarella di bufala','Pomodoro, mozzarella, mozzarella di bufala, basilico','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,36),
    ('pizze','pizza-37-nordica','Nordica','Pomodoro, mozzarella, scamorza, gamberetti','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,37),
    ('pizze','pizza-38-napoli','Napoli','Pomodoro, mozzarella, origano, acciughe','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',7.00),'large',jsonb_build_object('label','Gigante','price',22.00),'defaultKey','small'),array[]::text[],null,38),
    ('pizze','pizza-39-nduja-e-zola','Nduja e zola','Pomodoro, mozzarella, nduja, zola, cipolla','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array['piccante']::text[],2,39),
    ('pizze','pizza-40-nduja-e-scamorza','Nduja e scamorza','Pomodoro, mozzarella, nduja, scamorza, zucchine','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.50),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array['piccante']::text[],2,40),
    ('pizze','pizza-41-parmigiano-reggiano','Parmigiano reggiano','Pomodoro, mozzarella, parmigiano a scaglie','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,41),
    ('pizze','pizza-42-parmigiana','Parmigiana','Pomodoro, mozzarella, melanzane grigliate, grana','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,42),
    ('pizze','pizza-43-panna-e-salmone','Panna e salmone','Mozzarella, salmone affumicato, panna','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,43),
    ('pizze','pizza-44-pazza','Pazza','Pomodoro, mozzarella, tonno, cipolle, olive, peperoni','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,44),
    ('pizze','pizza-45-patatosa','Patatosa','Pomodoro, mozzarella, patatine fritte','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,45),
    ('pizze','pizza-46-peperoni','Peperoni','Pomodoro, mozzarella, peperoni grigliati','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',7.50),'large',jsonb_build_object('label','Gigante','price',23.00),'defaultKey','small'),array[]::text[],null,46),
    ('pizze','pizza-47-pizza-egiziana','Pizza egiziana','Pomodoro, mozzarella, falafel, rucola, pomodoro fresco','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array['veg']::text[],null,47),
    ('pizze','pizza-48-prosciutto-cotto','Prosciutto cotto','Pomodoro, mozzarella, prosciutto cotto','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',7.50),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,48),
    ('pizze','pizza-49-pugliese','Pugliese','Pomodoro, mozzarella, cipolla, origano','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',7.00),'large',jsonb_build_object('label','Gigante','price',20.00),'defaultKey','small'),array[]::text[],null,49),
    ('pizze','pizza-50-porrina','Porrina','Pomodoro, mozzarella, gorgonzola, porri','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,50),
    ('pizze','pizza-51-porcina','Porcina','Pomodoro, mozzarella, funghi porcini','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,51),
    ('pizze','pizza-52-pizza-kebab','Pizza kebab','Pomodoro, mozzarella, kebab, insalata, salsa bianca e piccante, cipolla','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',10.00),'large',jsonb_build_object('label','Gigante','price',27.00),'defaultKey','small'),array['piccante']::text[],1,52),
    ('pizze','pizza-53-pizza-kimos','Pizza Kimos','Pomodoro, mozzarella, scamorza, ricotta','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,53),
    ('pizze','pizza-54-pizza-italiana','Pizza italiana','Pomodoro, mozzarella, bresaola, grana, rucola','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.50),'large',jsonb_build_object('label','Gigante','price',27.00),'defaultKey','small'),array[]::text[],null,54),
    ('pizze','pizza-55-piacentina','Piacentina','Pomodoro, mozzarella, pancetta, grana','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,55),
    ('pizze','pizza-56-principessa','Principessa','Crema di tartufo, mozzarella, pomodorini, salame piccante','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.50),'large',jsonb_build_object('label','Gigante','price',27.00),'defaultKey','small'),array['piccante']::text[],1,56),
    ('pizze','pizza-57-prosciutto-crudo','Prosciutto crudo','Pomodoro, mozzarella, prosciutto crudo','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,57),
    ('pizze','pizza-58-quattro-stagioni','Quattro stagioni','Pomodoro, mozzarella, prosciutto, funghi, carciofi, olive','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,58),
    ('pizze','pizza-59-quattro-salumi','Quattro salumi','Pomodoro, mozzarella, pancetta, prosciutto cotto, prosciutto crudo, salame piccante','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array['piccante']::text[],1,59),
    ('pizze','pizza-60-radicchio','Radicchio','Pomodoro, mozzarella, radicchio','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',7.50),'large',jsonb_build_object('label','Gigante','price',23.00),'defaultKey','small'),array[]::text[],null,60),
    ('pizze','pizza-61-regina','Regina','Pomodoro, mozzarella, funghi freschi, prosciutto cotto','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,61),
    ('pizze','pizza-62-romana','Romana','Pomodoro, mozzarella, origano, acciughe, olive, capperi','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',23.00),'defaultKey','small'),array[]::text[],null,62),
    ('pizze','pizza-63-rucola','Rucola','Pomodoro, mozzarella, rucola','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',22.00),'defaultKey','small'),array[]::text[],null,63),
    ('pizze','pizza-64-salsiccia','Salsiccia','Pomodoro, mozzarella, origano, salsiccia','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',7.50),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,64),
    ('pizze','pizza-65-santa-giulia','Santa Giulia','Pomodoro, mozzarella, salsiccia, cipolla, peperoni, zola','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,65),
    ('pizze','pizza-66-salsiccia-e-zola','Salsiccia e zola','Pomodoro, mozzarella, salsiccia, zola','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,66),
    ('pizze','pizza-67-salsiccia-porcini','Salsiccia porcini','Pomodoro, mozzarella, salsiccia, porcini','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,67),
    ('pizze','pizza-68-super-diavola','Super diavola','Pomodoro, mozzarella, salame piccante, zola','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array['piccante']::text[],2,68),
    ('pizze','pizza-69-speck-e-scamorza','Speck e scamorza','Pomodoro, mozzarella, speck, scamorza','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,69),
    ('pizze','pizza-70-sciue','Sciue''','Pomodoro, mozzarella di bufala, acciughe, basilico','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',10.00),'large',jsonb_build_object('label','Gigante','price',27.00),'defaultKey','small'),array[]::text[],null,70),
    ('pizze','pizza-71-sole','Sole','Pomodoro, mozzarella, asparagi, uovo, grana','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,71),
    ('pizze','pizza-72-siciliana','Siciliana','Pomodoro, origano, acciughe, olive, capperi','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',7.50),'large',jsonb_build_object('label','Gigante','price',19.00),'defaultKey','small'),array[]::text[],null,72),
    ('pizze','pizza-73-sky','Sky','Mozzarella, speck, zucchine, panna','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,73),
    ('pizze','pizza-74-tirolese','Tirolese','Pomodoro, mozzarella, funghi, salame piccante, scamorza','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array['piccante']::text[],1,74),
    ('pizze','pizza-75-tedesca','Tedesca','Pomodoro, mozzarella, salsiccia, patatine','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',26.00),'defaultKey','small'),array[]::text[],null,75),
    ('pizze','pizza-76-tre-colori','Tre colori','Pomodoro, mozzarella, mozzarella di bufala, pomodorini, basilico','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.50),'large',jsonb_build_object('label','Gigante','price',27.00),'defaultKey','small'),array[]::text[],null,76),
    ('pizze','pizza-77-torre','Torre','Pomodoro, mozzarella, salame dolce, olive','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,77),
    ('pizze','pizza-78-tonno','Tonno','Pomodoro, mozzarella, tonno','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array[]::text[],null,78),
    ('pizze','pizza-79-tonno-e-cipolla','Tonno e cipolla','Pomodoro, mozzarella, tonno, cipolla','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',23.00),'defaultKey','small'),array[]::text[],null,79),
    ('pizze','pizza-80-tartufona','Tartufona','Pomodoro, mozzarella, grana, olio tartufato, pepe','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.00),'large',jsonb_build_object('label','Gigante','price',25.00),'defaultKey','small'),array[]::text[],null,80),
    ('pizze','pizza-81-vegetariana','Vegetariana','Pomodoro, mozzarella, verdure miste grigliate','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.50),'large',jsonb_build_object('label','Gigante','price',24.00),'defaultKey','small'),array['veg']::text[],null,81),
    ('pizze','pizza-82-viennese','Viennese','Pomodoro, mozzarella, wurstel','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',8.00),'large',jsonb_build_object('label','Gigante','price',23.00),'defaultKey','small'),array[]::text[],null,82),
    ('pizze','pizza-83-zucchine','Zucchine','Pomodoro, mozzarella, zucchine grigliate','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',7.50),'large',jsonb_build_object('label','Gigante','price',22.00),'defaultKey','small'),array[]::text[],null,83),
    ('pizze','pizza-84-giovanni','Giovanni','Pomodoro, mozzarella, rucola, grana, pomodorini','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Normale','price',9.50),'large',jsonb_build_object('label','Gigante','price',27.00),'defaultKey','small'),array['novita']::text[],null,84),
    ('calzoni','calzone-01-liscio','Calzone liscio','Pomodoro, mozzarella, prosciutto cotto','single',jsonb_build_object('kind','single','value',7.50),array[]::text[],null,1),
    ('calzoni','calzone-02-farcito','Calzone farcito','Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi','single',jsonb_build_object('kind','single','value',9.00),array[]::text[],null,2),
    ('calzoni','calzone-03-ortolano','Calzone ortolano','Pomodoro, mozzarella, verdure grigliate','single',jsonb_build_object('kind','single','value',8.00),array['veg']::text[],null,3),
    ('calzoni','calzone-04-kimos','Calzone Kimos','Pomodoro, mozzarella, prosciutto cotto, ricotta','single',jsonb_build_object('kind','single','value',8.50),array[]::text[],null,4),
    ('calzoni','calzone-05-quattro-formaggi','Calzone quattro formaggi','Mozzarella, zola, fontina, grana','single',jsonb_build_object('kind','single','value',9.00),array[]::text[],null,5),
    ('calzoni','calzone-06-kebab','Calzone kebab','Pomodoro, mozzarella, carne di kebab, insalata, pomodoro fresco, cipolla, salse yogurt e piccante','single',jsonb_build_object('kind','single','value',10.00),array['piccante']::text[],1,6),
    ('calzoni','calzone-07-peppina','Calzone Peppina','Pomodoro fresco, mozzarella, prosciutto crudo, rucola, mozzarella di bufala','single',jsonb_build_object('kind','single','value',10.00),array[]::text[],null,7),
    ('calzoni','calzone-08-cotto-e-stracchino','Cotto e stracchino','Mozzarella, prosciutto cotto, stracchino','single',jsonb_build_object('kind','single','value',9.00),array[]::text[],null,8),
    ('panini','panino-01-al-cotto','Al cotto','Prosciutto cotto, pomodoro, mozzarella, insalata','single',jsonb_build_object('kind','single','value',5.50),array[]::text[],null,1),
    ('panini','panino-02-al-crudo','Al crudo','Prosciutto crudo, pomodoro, mozzarella, insalata','single',jsonb_build_object('kind','single','value',6.00),array[]::text[],null,2),
    ('panini','panino-03-egiziano','Egiziano','Falafel, rucola, pomodoro fresco','single',jsonb_build_object('kind','single','value',5.50),array['veg']::text[],null,3),
    ('panini','panino-04-kimos','Kimos','Rucola, bresaola, grana','single',jsonb_build_object('kind','single','value',6.00),array[]::text[],null,4),
    ('panini','panino-05-salamella-grigliata','Salamella grigliata','Salamella, cipolla, peperoni, maionese','single',jsonb_build_object('kind','single','value',6.50),array[]::text[],null,5),
    ('panini','panino-06-hamburger','Hamburger','Hamburger, cipolla, peperoni, maionese, sottilette','single',jsonb_build_object('kind','single','value',6.50),array[]::text[],null,6),
    ('panini','panino-07-hot-dog','Hot dog','Wurstel, insalata, maionese','single',jsonb_build_object('kind','single','value',6.50),array[]::text[],null,7),
    ('panini','panino-08-cotoletta','Cotoletta','Cotoletta, insalata, maionese','single',jsonb_build_object('kind','single','value',6.50),array[]::text[],null,8),
    ('panini','panino-09-panino-gigante','Panino gigante','Impasto di pizza e 4 ingredienti a scelta','single',jsonb_build_object('kind','single','value',7.50),array[]::text[],null,9),
    ('focacce','focaccia-01-estate','Estate','Pomodoro fresco, rucola, grana','single',jsonb_build_object('kind','single','value',7.00),array[]::text[],null,1),
    ('focacce','focaccia-02-della-casa','Della casa','Rucola, speck, grana','single',jsonb_build_object('kind','single','value',7.50),array[]::text[],null,2),
    ('focacce','focaccia-03-bomba','Bomba','Rucola, bresaola, limone affettato, grana','single',jsonb_build_object('kind','single','value',9.50),array[]::text[],null,3),
    ('focacce','focaccia-04-con-nutella','Focaccia con Nutella','Nutella','single',jsonb_build_object('kind','single','value',6.00),array[]::text[],null,4),
    ('focacce','focaccia-05-rossa','Focaccia rossa','Pomodoro, origano, olio','single',jsonb_build_object('kind','single','value',5.00),array['veg']::text[],null,5),
    ('focacce','focaccia-06-bufalina','Bufalina','Mozzarella di bufala, pomodorini, rucola','single',jsonb_build_object('kind','single','value',9.00),array[]::text[],null,6),
    ('focacce','focaccia-07-ortolana','Ortolana','Verdura grigliata','single',jsonb_build_object('kind','single','value',8.00),array['veg']::text[],null,7),
    ('focacce','focaccia-08-delicata','Delicata','Pomodorini freschi, acciughe, bufala, basilico','single',jsonb_build_object('kind','single','value',9.00),array[]::text[],null,8),
    ('focacce','focaccia-09-burrata-di-bufala','Focaccia burrata di bufala','Pomodorini freschi, burrata di bufala, basilico','single',jsonb_build_object('kind','single','value',9.00),array[]::text[],null,9),
    ('focacce','focaccia-10-stracciatella-di-bufala','Focaccia stracciatella di bufala','Pomodorini, acciughe, stracciatella di bufala, basilico','single',jsonb_build_object('kind','single','value',9.50),array[]::text[],null,10),
    ('focacce','focaccia-11-sottocoperta','Sottocoperta','Prosciutto cotto, stracchino','single',jsonb_build_object('kind','single','value',9.00),array[]::text[],null,11),
    ('focacce','focaccia-12-lardo-rosmarino','Lardo rosmarino','Lardo, rosmarino','single',jsonb_build_object('kind','single','value',7.00),array[]::text[],null,12),
    ('doner-kebab','kebab-01-panino-kebab','Panino kebab','Carne di kebab, insalata, pomodoro, salsa yogurt e piccante, cipolla','single',jsonb_build_object('kind','single','value',6.00),array['piccante']::text[],1,1),
    ('doner-kebab','kebab-02-piadina-kebab','Piadina kebab','Carne di kebab, insalata, pomodoro, salsa yogurt e piccante, cipolla','single',jsonb_build_object('kind','single','value',6.50),array['piccante']::text[],1,2),
    ('doner-kebab','kebab-03-piadina-kebab','Piadina kebab','Carne di kebab, insalata, pomodoro, salsa yogurt e piccante, cipolla','single',jsonb_build_object('kind','single','value',7.50),array['piccante']::text[],1,3),
    ('doner-kebab','kebab-05-piatto-kebab-con-riso','Piatto di kebab con riso','Carne di kebab, verdura grigliata, salse yogurt e piccante','single',jsonb_build_object('kind','single','value',10.00),array['piccante']::text[],1,5),
    ('doner-kebab','kebab-06-vaschetta-grande-patatine','Vaschetta grande + patatine','Carne di kebab, patatine fritte','single',jsonb_build_object('kind','single','value',10.00),array[]::text[],null,6),
    ('piatti','piatto-01-shish-tavuk-patatine','Shish tavuk + patatine','Shish tavuk, patatine fritte','single',jsonb_build_object('kind','single','value',10.00),array[]::text[],null,1),
    ('piatti','piatto-02-cotoletta-patatine','Piatto cotoletta + patatine','Cotoletta, patatine fritte','single',jsonb_build_object('kind','single','value',10.00),array[]::text[],null,2),
    ('piatti','piatto-03-falafel-patatine','Piatto falafel + patatine','Falafel, patatine fritte','single',jsonb_build_object('kind','single','value',10.00),array['veg']::text[],null,3),
    ('piatti','piatto-04-box-kebab','Box kebab','Carne di kebab','volume',jsonb_build_object('kind','volume','small',jsonb_build_object('label','Piccola','price',7.50),'large',jsonb_build_object('label','Grande','price',10.00),'defaultKey','small'),array[]::text[],null,4),
    ('dolci','dolce-01-millefoglie','Millefoglie','Millefoglie','single',jsonb_build_object('kind','single','value',4.50),array[]::text[],null,1),
    ('dolci','dolce-02-tiramisu','Tiramisù','Tiramisù','single',jsonb_build_object('kind','single','value',5.00),array[]::text[],null,2),
    ('dolci','dolce-03-torta-della-nonna','Torta della nonna','Torta della nonna','single',jsonb_build_object('kind','single','value',4.50),array[]::text[],null,3),
    ('dolci','dolce-04-tartufo-bianco-o-nero','Tartufo bianco o nero','Tartufo bianco o nero','single',jsonb_build_object('kind','single','value',3.00),array[]::text[],null,4),
    ('sfizioserie','sfizio-01-patatine-fritte-piccole','Patatine fritte piccole','Patatine fritte','single',jsonb_build_object('kind','single','value',4.00),array['veg']::text[],null,1),
    ('sfizioserie','sfizio-02-patatine-fritte-grandi','Patatine fritte grandi','Patatine fritte','single',jsonb_build_object('kind','single','value',5.00),array['veg']::text[],null,2),
    ('sfizioserie','sfizio-03-crocchette-di-patate','Crocchette di patate 7 pezzi','Crocchette di patate','single',jsonb_build_object('kind','single','value',5.00),array['veg']::text[],null,3),
    ('sfizioserie','sfizio-04-olive-ascolane','Olive ascolane 10 pezzi','Olive ascolane','single',jsonb_build_object('kind','single','value',5.50),array[]::text[],null,4),
    ('sfizioserie','sfizio-05-chele-di-granchio','Chele di granchio 8 pezzi','Chele di granchio','single',jsonb_build_object('kind','single','value',7.50),array[]::text[],null,5),
    ('sfizioserie','sfizio-06-arancini-di-riso','Arancini di riso 1 pezzo','Arancini di riso','single',jsonb_build_object('kind','single','value',4.00),array[]::text[],null,6),
    ('sfizioserie','sfizio-07-alette-di-pollo','Alette di pollo 6 pezzi','Alette di pollo','single',jsonb_build_object('kind','single','value',6.00),array[]::text[],null,7),
    ('sfizioserie','sfizio-08-crocchette-di-pollo','Crocchette di pollo 10 pezzi','Crocchette di pollo','single',jsonb_build_object('kind','single','value',6.00),array[]::text[],null,8),
    ('sfizioserie','sfizio-09-vaschetta-falafel','Vaschetta falafel 6 pezzi','Falafel','single',jsonb_build_object('kind','single','value',6.00),array['veg']::text[],null,9),
    ('sfizioserie','sfizio-10-mozzarelline','Mozzarelline 10 pezzi','Mozzarelline','single',jsonb_build_object('kind','single','value',5.50),array['veg']::text[],null,10),
    ('sfizioserie','sfizio-11-anelli-di-cipolla','Anelli di cipolla 10 pezzi','Anelli di cipolla','single',jsonb_build_object('kind','single','value',5.50),array['veg']::text[],null,11),
    ('sfizioserie','sfizio-12-panzerottini-fritti','Panzerottini fritti 6 pezzi','Panzerottini fritti','single',jsonb_build_object('kind','single','value',5.50),array[]::text[],null,12),
    ('sfizioserie','sfizio-13-mix-fritti','Mix fritti','2 olive ascolane, 2 mozzarelline, 2 alette, 2 crocchette, 2 anelli di cipolla, 2 nuggets','single',jsonb_build_object('kind','single','value',9.50),array[]::text[],null,13),
    ('sfizioserie','sfizio-14-fagottino','Fagottino','Fagottino','single',jsonb_build_object('kind','single','value',1.50),array[]::text[],null,14),
    ('insalatone','insalata-01-caprese','Caprese','Bufala, pomodoro fresco, basilico, origano','single',jsonb_build_object('kind','single','value',7.50),array[]::text[],null,1),
    ('insalatone','insalata-02-estiva','Estiva','Lattuga, rucola, mozzarella di bufala, tonno, mais','single',jsonb_build_object('kind','single','value',7.50),array[]::text[],null,2),
    ('insalatone','insalata-03-primavera','Primavera','Rucola, trevisana, lattuga, gamberetti, tonno, mais','single',jsonb_build_object('kind','single','value',7.50),array[]::text[],null,3),
    ('insalatone','insalata-04-tonno','Tonno','Lattuga, tonno, pomodoro','single',jsonb_build_object('kind','single','value',7.50),array[]::text[],null,4),
    ('insalatone','insalata-05-insalata-mista','Insalata mista','Lattuga, insalata, rucola, pomodoro fresco, trevisana','single',jsonb_build_object('kind','single','value',5.50),array['veg']::text[],null,5),
    ('insalatone','insalata-06-kimos','Kimos','Pomodoro, insalata, acciughe, olive, prosciutto cotto, mais','single',jsonb_build_object('kind','single','value',7.50),array[]::text[],null,6),
    ('insalatone','insalata-07-sky','Insalata Sky','Insalata verde, patate lesse, olive, acciughe, tonno, peperoni, uovo sodo','single',jsonb_build_object('kind','single','value',9.00),array[]::text[],null,7),
    ('insalatone','insalata-08-insalatona-di-pollo','Insalatona di pollo','Pomodoro, petto di pollo grigliato, pomodoro, carote, grana','single',jsonb_build_object('kind','single','value',8.00),array[]::text[],null,8),
    ('bevande','bevanda-01-acqua-mezzo-litro','Acqua naturale/frizzante 1/2 litro','Acqua naturale o frizzante 1/2 litro','single',jsonb_build_object('kind','single','value',1.00),array[]::text[],null,1),
    ('bevande','bevanda-02-acqua-litro-e-mezzo','Acqua naturale/frizzante 1,5 litri','Acqua naturale o frizzante 1,5 litri','single',jsonb_build_object('kind','single','value',2.00),array[]::text[],null,2),
    ('bevande','bevanda-03-bibita-bottiglia-mezzo-litro','Bibita in bottiglia 1/2 litro','Bibita in bottiglia 1/2 litro','single',jsonb_build_object('kind','single','value',2.00),array[]::text[],null,3),
    ('bevande','bevanda-04-bibita-lattina-33cl','Bibita in lattina 33cl','Bibita in lattina 33cl','single',jsonb_build_object('kind','single','value',2.00),array[]::text[],null,4),
    ('bevande','bevanda-05-bibita-bottiglia-litro-e-mezzo','Bibita in bottiglia 1,5 litri','Bibita in bottiglia 1,5 litri','single',jsonb_build_object('kind','single','value',4.00),array[]::text[],null,5),
    ('bevande','bevanda-06-birra-bottiglia-33cl','Birra in bottiglia 33cl','Heineken, Moretti, Beck''s','single',jsonb_build_object('kind','single','value',2.50),array[]::text[],null,6),
    ('bevande','bevanda-07-birra-bottiglia-33cl-speciale','Birra in bottiglia 33cl speciale','Corona, Ceres, Tennent''s','single',jsonb_build_object('kind','single','value',4.00),array[]::text[],null,7),
    ('bevande','bevanda-08-birra-bottiglia-66cl','Birra in bottiglia 66cl','Moretti, Peroni, Nastro Azzurro','single',jsonb_build_object('kind','single','value',3.50),array[]::text[],null,8),
    ('bevande','bevanda-09-vino-rosso-bianco','Vino rosso/bianco','Vino rosso o bianco','single',jsonb_build_object('kind','single','value',8.50),array[]::text[],null,9),
    ('menu-completi','menu-01-panino-falafel','Menu panino falafel','Panino falafel, patatine fritte, bibita 33cl','single',jsonb_build_object('kind','single','value',9.00),array['veg']::text[],null,1),
    ('menu-completi','menu-02-panino-kebab','Menu panino kebab','Panino kebab, patatine fritte, bibita 33cl','single',jsonb_build_object('kind','single','value',9.50),array['piccante']::text[],1,2),
    ('menu-completi','menu-03-panino-burger','Menu panino burger','Panino burger, patatine fritte, bibita 33cl','single',jsonb_build_object('kind','single','value',10.00),array[]::text[],null,3),
    ('menu-completi','menu-04-piadina-kebab','Menu piadina kebab','Piadina kebab, patatine fritte, bibita 33cl','single',jsonb_build_object('kind','single','value',9.50),array['piccante']::text[],1,4),
    ('supplementi','supplemento-01-pizza-integrale','Pizza con farina integrale','Supplemento farina integrale','single',jsonb_build_object('kind','single','value',1.00),array[]::text[],null,1),
    ('supplementi','supplemento-02-pizza-kamut','Pizza con farina kamut','Supplemento farina kamut','single',jsonb_build_object('kind','single','value',1.50),array[]::text[],null,2),
    ('supplementi','supplemento-03-bufala-crudo-porcini-bresaola','Bufala, crudo, porcini o bresaola','Supplemento bufala, prosciutto crudo, porcini o bresaola','single',jsonb_build_object('kind','single','value',2.00),array[]::text[],null,3),
    ('supplementi','supplemento-04-panino-piadina-integrale-kamut','Panino o piadina con farina integrale o kamut','Supplemento panino o piadina con farina integrale o kamut','single',jsonb_build_object('kind','single','value',0.50),array[]::text[],null,4)
),
inserted as (
  insert into public.menu_items (
    tenant_id, category_id, code, name, description, price_kind, price,
    tags, piccante_level, allergens, available, position
  )
  select
    'kimos',
    cats.id,
    items.code,
    items.name,
    items.ingredients,
    items.price_kind::public.price_kind,
    items.price,
    items.tags,
    items.piccante_level,
    public._kimos_menu_allergens(items.ingredients),
    true,
    items.position
  from items
  join cats on cats.code = items.category_code
  returning id, description
)
insert into public.menu_item_ingredients (item_id, code, name, position)
select distinct on (item_id, code)
  item_id,
  code,
  name,
  position
from (
  select
    inserted.id as item_id,
    lower(regexp_replace(trim(ingredient), '[^a-zA-Z0-9]+', '-', 'g')) as code,
    trim(ingredient) as name,
    ordinality::int as position
  from inserted
  cross join lateral unnest(string_to_array(inserted.description, ',')) with ordinality as parts(ingredient, ordinality)
  where trim(ingredient) <> ''
) parsed_ingredients
order by item_id, code, position;

drop function public._kimos_menu_allergens(text);
