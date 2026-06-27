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
| `blog` | Blog |
| `favorites` | Preferiti / wishlist |
| `inventoryFoodCost` | Magazzino / food cost |
| `staffRoles` | Staff e ruoli |
| `multiLocation` | Multi-sede |
| `mail` | Mail |
| `slabbby` | **Da verificare** (nome non autoesplicativo) |
| `aiPhone` | Assistente telefonica IA (Retell) |
| `aiWhatsapp` | Assistente WhatsApp IA |
| `hubriseSync` | Sync HubRise (POS) |
| `payments` | Pagamenti |
| `autonomousTableCheckout` | Checkout autonomo al tavolo |
| `presence` | Presenza operativa |

> Le voci `catalog`, `commerce`, `operations`, `bookings`, `customers`, `organization`, `integrations` compaiono anch'esse come `key:` in `tenant-modules.ts`: **da verificare** se sono moduli o raggruppamenti/categorie. Vanno lette in contesto nel file.

## Note modulo `mail`

**Dedotto dal codice.** Il modulo `mail` usa la UI condivisa `MailApp` per:

- inbox globale piattaforma in `/admin/inbox` (`admin.menuary.it/inbox`);
- inbox tenant in `/gestione/[tenantSlug]/mail`, quando il tenant ha accesso al modulo mail;
- vista conversazione in modalita' thread: la lista mostra il messaggio piu' recente della conversazione e il dettaglio mostra tutti i messaggi del thread in ordine cronologico;
- conteggi aggregati per thread: numero messaggi, non lette e allegati;
- allegati visibili direttamente nel corpo del messaggio quando il formato e' renderizzabile: immagini, PDF e testo/JSON; gli altri formati restano apribili/scaricabili.

Scheda UI: [[posta-admin-gestione]].

## Dipendenze tra moduli

Da `ARCHITECTURE.md`: i moduli dichiarano dipendenze (`requires`, `requiresAny`); un modulo è effettivo solo se anche le sue dipendenze sono abilitate. Le combinazioni esatte sono **da leggere** in `tenant-modules.ts`.

## Come documentare una singola feature

Per ogni feature da approfondire crea un file usando [[feature-template]] e collega il modulo corrispondente.

## Da confermare

- Mappatura completa modulo → componenti in `src/components/modules/`.
- Quali moduli sono attivi per ciascun tenant (leggibile dai `features` in `tenant-registry.ts`).
- Significato di `slabbby` e delle chiavi-raggruppamento.

## Collegamenti

- [[panoramica-tecnica]]
- [[integrazioni-attive]]
