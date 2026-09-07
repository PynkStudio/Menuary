# Moduli della piattaforma

> Fonte: chiavi `key:` in `src/lib/tenant-modules.ts`. **Dedotto dal codice.** Etichette e semantica per-verticale sono definite in `verticalCopy` nello stesso file e in `src/lib/vertical.ts`.

I moduli sono abilitati per tenant tramite i feature-flag in `tenant-registry.ts`. Sotto l'elenco delle chiavi modulo presenti nel catalogo.

## Catalogo moduli (chiavi)

| Chiave | Area (dedotta dal nome) |
|---|---|
| `website` | Sito pubblico |
| `pressKit` | Press kit |
| `worksCatalog` | Catalogo opere (creative) |
| `onlineMenu` | Menu / listino online |
| `shop` | Carrello / shop |
| `takeaway` | Ordini asporto |
| `tableOrders` | Ordini al tavolo |
| `orderKiosk` | Kiosk ordini |
| `takeawaySlots` | Slot asporto |
| `deliveryHub` | Delivery |
| `cashRegister` | Cassa |
| `kitchenDisplay` | Schermo cucina |
| `printStations` | Stazioni di stampa |
| `dinerSeparation` | Separazione conto |
| `reservations` | Prenotazioni |
| `creativeBooking` | Booking (creative) |
| `rightsRoyalties` | Diritti / royalties (creative) |
| `tablePlanner` | Gestione sala |
| `productAvailability` | Disponibilità prodotti |
| `upselling` | Upselling |
| `crm` | CRM |
| `analytics` | Analytics |
| `reviews` | Recensioni |
| `reputationReviews` | Reputazione / recensioni |
| `fanbaseCommunity` | Community / fanbase (creative) |
| `gallery` | Galleria |
| `linktree` | Linktree |
| `blog` | Blog — evoluzione in corso di progettazione: [[blog-editoriale]] |
| `favorites` | Preferiti / wishlist |
| `inventoryFoodCost` | Magazzino / food cost |
| `staffRoles` | Staff e ruoli |
| `multiLocation` | Multi-sede |
| `mail` | Mail |
| `slabbby` | Wishlist Slabbby — estensione/widget di terze parti, vedi [[#Nota modulo `slabbby`]] |
| `aiPhone` | Assistente telefonica IA (Retell) |
| `aiWhatsapp` | Assistente WhatsApp IA |
| `hubriseSync` | Sync HubRise (POS) |
| `payments` | Pagamenti |
| `autonomousTableCheckout` | Checkout autonomo al tavolo |
| `presence` | Raggruppamento "Presenza online" (sito, gallery, blog, linktree, press kit) — **non** è la presenza operativa dei portali, vedi [[#Nota modulo `rider` e presenza operativa]] |

> Le voci `catalog`, `commerce`, `operations`, `bookings`, `customers`, `organization`, `integrations` compaiono anch'esse come `key:` in `tenant-modules.ts`: **da verificare** se sono moduli o raggruppamenti/categorie. Vanno lette in contesto nel file.

## Nota modulo `slabbby`

Slabbby è una **wishlist di terze parti fra negozi diversi**: l'utente salva un capo
qui e se lo ritrova nella propria lista insieme a quelli di altri e-commerce.
Il modulo ha due metà, che vanno tenute distinte:

| Pezzo | Dove | Cosa fa |
|---|---|---|
| `SlabbbyScriptGate` | `src/components/core/slabbby-script-gate.tsx` | Carica `https://slabbby.com/widget.js` se `features.slabbby` è attivo. Nel layout globale è montato con `skipInPreview`, quindi **in preview il gate lo monta la pagina del tenant**. |
| `SlabbbyWishlistButton` | `src/components/modules/shop/slabbby-wishlist-btn.tsx` | Bottone della maison/negozio. Va **sotto** il tasto carrello nella scheda prodotto, mai in home/catalogo né sopra il titolo. |

Il widget ha **due modi**, e vanno tenuti distinti (contratto rivisto il 2026-08-27
nella repo `siti/slabbby`, vedi lì `docs/obsidian/09 - Feature Partner B2B.md`):

- **manuale**, per i siti nostri: il sito dichiara dove va il bottone e il widget
  non tocca nient'altro. Si dichiara con un segnaposto
  `<div data-slabbby>` oppure con `Slabbby.mount(el, opts)`. Sulle pagine senza
  segnaposto (home, catalogo) si dichiara una volta sola a livello di documento
  con `data-slabbby-manual` sull'elemento `<html>`.
- **automatico**, per l'estensione Chrome sui siti di terzi: cerca il titolo
  prodotto e si aggancia sotto.

Senza dichiarazione un sito nostro ricade nell'automatico, e allora il bottone
finisce accanto al primo `h1` della pagina: sul marchio in home, e in doppione
con l'eventuale bottone del sito sulla scheda prodotto.

`window.Slabbby` ora esiste (`mount`, `save`, `add`, `on`, `unmountAll`, `ready`).
Prima non c'era: è il motivo per cui il ramo "prova prima l'API JS del widget" di
`SlabbbyWishlistButton` non scattava mai e si cadeva sempre nel fallback URL.

Lo stile del bottone si personalizza con le custom property `--slabbby-*` scritte
sul segnaposto: attraversano lo shadow root chiuso per ereditarietà, quindi non
servono `!important` né selettori dentro lo shadow DOM.

> Le modifiche al widget arrivano ai siti **solo dopo il deploy di slabbby.com**:
> `/widget.js` è servito con cache 1 ora browser e 24 ore CDN.

Tenant con il modulo attivo: `libritech`, `casabramanti`.

## Note modulo `mail`

**Dedotto dal codice.** Il modulo `mail` usa la UI condivisa `MailApp` per:

- inbox globale piattaforma in `/admin/inbox` (`admin.menuary.it/inbox`);
- inbox tenant in `/gestione/[tenantSlug]/mail`, quando il tenant ha accesso al modulo mail;
- vista conversazione in modalita' thread: la lista mostra il messaggio piu' recente della conversazione e il dettaglio mostra tutti i messaggi del thread in ordine cronologico;
- conteggi aggregati per thread: numero messaggi, non lette e allegati;
- allegati visibili direttamente nel corpo del messaggio quando il formato e' renderizzabile: immagini, PDF e testo/JSON; gli altri formati restano apribili/scaricabili.

Scheda UI: [[posta-admin-gestione]].

## Nota modulo `rider` e presenza operativa

**Dedotto dal codice e verificato sul DB di produzione il 2026-08-17.**

Il flag `rider` (app web per le consegne delivery) è dichiarato in `TenantFeatureFlags` (`src/lib/tenant.ts`) ma **non ha una entry nel catalogo `tenant-modules.ts`**: non è quindi selezionabile dal pannello moduli, va impostato direttamente nei `features` del tenant. Richiede `deliveryHub` o `hubriseSync`.

Superficie del modulo:

- gestione rider: `/gestione/[tenantSlug]/rider` (`RiderPanel`), esposta solo se `features.rider` è attivo (`canManageRider` in `gestione-routing.ts`);
- app rider: host `rider.[dominio]` → `PlatformMode` `rider-custom`, riscritto su `/operativo/[tenantSlug]/rider`; auth con `access_code` e cookie `rider-session`, senza account Supabase;
- API: `/api/rider/*` (lato rider) e `/api/gestione/[tenantSlug]/riders*`, `.../orders/[orderId]/assign-rider`, `.../orders/delivery-pending` (lato gestione).

Lo schema DB (`rider_profiles`, colonne rider/delivery su `orders`, valore enum `in_consegna`) e il campo mancia `orders.tip_amount_cents` sono stati applicati alla produzione il **2026-08-17**: la migration era ferma da giugno e mai eseguita. `rider_profiles.access_code` è la credenziale di login del rider, quindi la tabella ha RLS con accesso **solo `service_role`** — tutte le route usano il service client. Non aggiungere policy di lettura per `anon`/`authenticated`.

Stato: **nessun tenant ha `features.rider` attivo** in produzione. Il modulo è quindi presente e pronto ma spento.

Separata e indipendente dal modulo rider è la **presenza operativa**: la tabella `operational_portal_presence` alimentata da `POST /api/operational/presence`, che i portali `/operativo/[tenantSlug]/ordini` e `/cucina` chiamano ogni 10 secondi tramite `OperationalAlertsClient`. Anche questa tabella è stata creata in produzione il 2026-08-17 (prima l'endpoint rispondeva 500 a ogni ping).

## Dipendenze tra moduli

Da `ARCHITECTURE.md`: i moduli dichiarano dipendenze (`requires`, `requiresAny`); un modulo è effettivo solo se anche le sue dipendenze sono abilitate. Le combinazioni esatte sono **da leggere** in `tenant-modules.ts`.

## I moduli attivi compongono le note legali

Privacy e cookie policy non sono un testo fisso: `src/lib/legal/policies.ts` le costruisce
dai moduli davvero accesi per il tenant, che `DynamicPolicyDocument` gli passa leggendo
`useEffectiveFeatures()`. Accendere o spegnere un modulo dal pannello cambia l'informativa
senza toccare il codice.

| Modulo acceso | Cosa aggiunge al documento |
|---|---|
| `favorites` (+ `onlineMenu`) | preferiti e contenuti del menu salvati sul dispositivo |
| `takeaway` / `tableOrders` / `shop` | carrello e sessioni d'ordine |
| `reservations` / `creativeBooking` | dati della richiesta di prenotazione o appuntamento |
| `fanbaseCommunity` / `crm` | sezione «Newsletter»: consenso, doppio opt-in, revoca |
| `blog` | sezione «Commenti agli articoli» e moderazione |
| `analytics` | sezione «Statistiche di visita», aggregate e senza cookie |
| `kitchenDisplay` | monitor di cucina |
| `aiPhone` / `aiWhatsapp` | assistente conversazionale |
| `upselling` | suggerimenti automatici |

Il tenant multilingua aggiunge inoltre la riga sulla lingua ricordata sul dispositivo.

**Quando aggiungi un modulo che raccoglie o memorizza qualcosa, aggiungi anche il suo copy
in `policies.ts`**: senza, l'informativa del tenant descrive un sito diverso da quello che
sta accompagnando. Vedi [[adr-0010-informativa-per-moduli-attivi]].

## Come documentare una singola feature

Per ogni feature da approfondire crea un file usando [[feature-template]] e collega il modulo corrispondente.

## Da confermare

- Mappatura completa modulo → componenti in `src/components/modules/`.
- Quali moduli sono attivi per ciascun tenant (leggibile dai `features` in `tenant-registry.ts`).
- Significato di `slabbby` e delle chiavi-raggruppamento.

## Collegamenti

- [[panoramica-tecnica]]
- [[integrazioni-attive]]
