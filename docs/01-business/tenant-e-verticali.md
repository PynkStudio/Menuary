# Tenant e verticali

> Fonte: `src/lib/tenant-registry.ts`, `src/lib/vertical.ts`. **Dedotto dal codice** allo stato attuale della repo.

## Tenant registrati

Estratti da `TENANTS[]` in `src/lib/tenant-registry.ts` (campi `id`, `name`, `vertical`, `status`):

| ID | Nome | Verticale | Status |
|---|---|---|---|
| `bepork` | ThePork | food | active |
| `faak` | FAAK | food | trial |
| `cascina-errante` | Cascina Errante | food | active |
| `doca` | Doca | food | trattativa |
| `nom-sushi` | Nøm sushi | food | trattativa |
| `junior-food` | Junior Food | food | trattativa |
| `kimos` | Pizzeria Kimos | food | trattativa |
| `libritech` | LibriTech | services | trial |
| `valentina-orciuoli` | Valentina Orciuoli | creative | trattativa |
| `studioaranzulla` | Studio Legale Aranzulla | services | trattativa |
| `officinakam` | Officina KAM | services | trattativa |
| `pynkstudio` | PynkStudio | services | active |
| `casabramanti` | Casa Bramanti | services | trial |
| `orpheo-demo` | Orpheo Demo | creative | trial |

> Nota: il tenant `bepork` ha `name: "ThePork"` nel codice; il `package.json` si chiama `thepork-website`. è stato anonimizzato per poterlo usare come esempio per altri senza fare rirefimento diretto al ristorante BePork di Bari che non ha acquistato il servizio.

## Note per tenant

- **`valentina-orciuoli`** — il sito pubblico è reso come un libro sfogliabile: ogni
  route pubblica corrisponde a una doppia pagina, la copertina si apre scorrendo entrando
  dalla home. L'ordine delle pagine vive in
  `src/components/tenants/valentina-orciuoli/book/book-map.ts`. Vedi
  [[adr-0002-valentina-book-shell]]. `/autrice` non è una pagina ma la **quarta di
  copertina**: il volume si chiude e si rigira per mostrarla. La pagina `/link` (linktree)
  resta fuori dal libro. **Le opere non hanno più una pagina a testa**: il volume le
  raccoglie per collana in `/trilogia` (i due volumi usciti più l'annuncio del terzo) e
  `/thriller`, e l'indice di `/libri` nomina le due collane. I vecchi indirizzi delle opere
  (`/anxiety`, `/fury`, `/tra-fumo-e-ombre`) rimandano alla sezione giusta. Vedi
  [[adr-0009-valentina-opere-per-collana]].
  **Il taccuino è una doppia pagina del volume, oggi spenta**: il modulo `blog` è a
  `false` finché non ci sono appunti da pubblicare, quindi la sezione non esiste nel volume,
  non compare in menu e non entra in sitemap; riaccendendo il flag torna al suo posto
  **dopo gli eventi**, con la voce di menu «Dal taccuino». Da acceso, "Dal taccuino" apre
  `/it/blog` dentro il libro e il singolo appunto (`/it/blog/<slug>`) si legge sulla
  scrivania, con una panoramica di camera invece che con una navigazione — vedi
  [[adr-0006-valentina-taccuino-nel-libro]], che ha ribaltato la §5 di
  [[adr-0005-valentina-blog-fuori-dal-libro]]. Le pagine editoriali autonome nate con la
  0005 (`src/components/tenants/valentina-orciuoli/blog/`) restano nelle route globali
  `src/app/blog/**`, gated sul feature flag `blog` e non sull'id: sono il punto d'ingresso
  già pronto per il prossimo tenant che accende il blog senza avere un libro attorno.
  **Dominio custom**: `valentinaorciuoli.it` (+ `www.`, più l'alias
  `valentinaorciuoli.localhost` per le prove in locale). Il sito completo — libro, taccuino,
  linktree, note legali — è operativo sul dominio: il middleware riscrive `/it/<pagina>`
  dentro l'albero `[previewSlug]` lasciando l'URL nudo nella barra, e il prefisso degli href
  si legge dal pathname (`voRoute`) invece che da una costante. Le stesse route servono due
  superfici con SEO opposta — preview `noindex`, dominio indicizzabile — e a distinguerle è
  `resolvePreviewSurface()`. Vedi [[adr-0007-valentina-dominio-custom]].
  **Note legali**: privacy e cookie policy si compongono sui moduli accesi del tenant, non
  sul modello HORECA — vedi [[adr-0010-informativa-per-moduli-attivi]].
  **404**: una route inesistente del tenant apre il volume sull'errata corrige invece della
  schermata 404 di piattaforma (`not-found.tsx` → `ValentinaOrciuoliBookSite notFound`).
  **Resta da fare l'utente**: puntare il DNS su Vercel e aggiungere il dominio al progetto;
  decidere la nuova copertina del volume (oggi è ancora il cartoncino con il solo nome).

- **`casabramanti`** — maison di moda demo del verticale services, usata per mostrare
  il modulo `shop` e l'integrazione **Slabbby** su un catalogo reale (otto capi in
  ventidue varianti). Nessun dominio proprio: vive solo su `demo.bizery.it/casabramanti`.
  È il primo tenant pubblicato **bilingue dal primo rilascio** (`it`, `en`), con i copy
  in `src/lib/casabramanti-i18n.ts` e il catalogo in `src/lib/casabramanti-catalog.ts`.
  La home segue la grammatica *galleria/catalogo*: nessun hero con claim sopra una
  foto, la navigazione è l'indice degli oggetti, le didascalie dichiarano fatti
  (tessuto, grammatura, origine) e non argomenti di vendita.
  Il carrello **non** usa `shop-cart-store`: ha `src/store/casabramanti-bag-store.ts`
  perché le sue righe hanno variante e taglia, e per non condividere lo spazio di
  persistenza con gli altri tenant shop. Vedi [[casa-bramanti]].

## Stati tenant osservati

Valori di `status` presenti nel registro: `active`, `trial`, `trattativa`. Il significato di business preciso di ciascuno è **da confermare** (vedi `20260518_tenant_vertical_status.sql`).

## Default per verticale

Da `CLAUDE.md` / codice:
- `DEFAULT_FOOD_TENANT_ID = "bepork"`
- `DEFAULT_SERVICES_TENANT_ID = "officinakam"`

## Da confermare

- **Pricing e piani commerciali**: esiste `src/app/pricing/page.tsx` e migration su packages/pricing (`20260514_platform_packages_marketing.sql`, `20260525_multi_country_pricing.sql`). I valori concreti **non sono documentati qui** per evitare di riportare numeri non confermati — vanno letti dalla fonte e validati.
- Modello di revenue, commissioni (`20260606_platform_commission_split.sql`, `20260630120000_ai_addon_commission_menuary_only.sql`): logica presente nel DB, significato di business **da confermare**.
- Flusso contratti/abbonamenti/dunning: presenti API (`/api/admin/contracts`, `/api/admin/subscriptions`) e migration (`20260621_platform_contracts.sql`). Dettagli di processo **da confermare**.

## Collegamenti

- [[panoramica-prodotto]]
- [[integrazioni-attive]]
