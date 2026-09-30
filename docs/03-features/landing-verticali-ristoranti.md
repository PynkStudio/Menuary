# Feature: Landing verticali per ristoranti (`menuary.it/ristoranti/*`)

- **Stato:** in sviluppo. 6 landing su 6 pubblicabili e in test; 2 funzioni prodotto completate e 3 ancora da costruire (bacheca in § 6).
- **Codice:** `src/lib/menuary-landings.ts`, `src/components/marketing/landings/`, `src/app/soluzioni-ristoranti/`
- **Data:** 2026-09-30

> **Come leggere questo documento.** § 2 e § 3 sono **dedotti dal codice e dal database di produzione** (verifica del 2026-09-30). § 5 è il **progetto** delle funzioni che vogliamo avere. L'avanzamento reale vive nella bacheca di § 6.

---

## 0. Istruzioni per l'IA che lavora su questo progetto

Questo file è la fonte di verità dell'avanzamento delle landing verticali e delle funzioni che quelle landing promettono.

**Prima di toccare `src/components/marketing/landings/` o `src/lib/menuary-landings.ts`:** leggi la bacheca di § 6 e riparti dal primo lavoro non completato.

**Stati ammessi** (come in [[blog-editoriale]]):

| Stato | Significato |
|---|---|
| ⬜ **da iniziare** | Nessun codice scritto per questa voce |
| 🟡 **in lavorazione** | Codice in corso, non completo o non compilante |
| 🔵 **in test** | Codice completo e compilante, non ancora verificato sul campo |
| ✅ **completata** | Verificata sul campo, documentazione aggiornata |

**Regola dei claim (vedi [[adr-0012-claim-landing-legati-a-funzioni-pronte]]).** Una landing o una frase che promette una funzione va online solo quando la funzione esiste. L'interruttore unico è `MENUARY_FEATURE_READY` in `src/lib/menuary-landings.ts`:

1. Una funzione passa a `true` **solo** quando la sua voce in § 6 è ✅. Nello stesso intervento aggiorna la bacheca.
2. I testi sono già scritti in `landing-content.ts`, con `requires: "<chiave>"` sulle frasi che dipendono dalla funzione. Accendere il flag li pubblica senza toccare altro: pagina, sitemap, footer, ecosistema, FAQ e JSON-LD si aggiornano da soli.
3. Non aggiungere a una landing pubblicata frasi su funzioni non pronte senza `requires`.

Altre regole:

- **tsc e lint puliti portano a 🔵, non a ✅.**
- Le landing sono **solo in italiano**. Non pubblicare varianti in altre lingue finché i testi non sono tradotti davvero (vedi CLAUDE.md, multilingua).
- Le demo nelle pagine sono **esempi con dati di un locale dimostrativo** e lo dicono. Non trasformarle in metriche ("+30% di scontrino"): non abbiamo dati verificati.

---

## 1. Perché

Sei pagine di atterraggio per campagne (ChatGPT Ads in primis), ciascuna costruita su un problema operativo del ristoratore. Sono sei porte d'ingresso allo stesso prodotto: la catena è problema → annuncio → landing → soluzione → demo → contatto. Ogni pagina porta poi il visitatore all'idea che Menuary sia un unico sistema (sezione "Fa parte di Menuary").

| Slug | Intento dell'annuncio | Stato pagina |
|---|---|---|
| `telefonate-prenotazioni-ai` | "Come non perdere le telefonate al ristorante?" | pubblicabile |
| `self-order-ai` | "Come aumentare lo scontrino con il menu digitale?" | pubblicabile |
| `gestionale` | "Software gestionale completo per ristorante?" | pubblicabile |
| `whatsapp` | "Come gestire il ristorante quando non sono presente?" | pubblicabile |
| `menu-delivery` | "Come gestire Deliveroo, Just Eat e Uber Eats insieme?" | pubblicabile |
| `google-maps-recensioni` | "Come gestire le recensioni Google del ristorante?" | pubblicabile |

In più: `/ristoranti` è l'hub con tutte le landing pubblicate.

---

## 2. Architettura (dedotta dal codice)

| Pezzo | File | Nota |
|---|---|---|
| Registro landing e interruttori funzioni | `src/lib/menuary-landings.ts` | Modulo dati puro, importato anche dal middleware |
| Testi (solo IT) | `src/components/marketing/landings/landing-content.ts` | Frasi con `requires` nascoste finché la funzione non è pronta |
| Sezioni condivise | `landing-sections.tsx` | `PainHero`, `ProblemSection`, `SolutionSection`, `HowItWorks`, `ProductDemo`, `Benefits`, `MenuaryEcosystem`, `RelatedSolutions`, `LandingFinalCTA` |
| Pagina, hub, metadata, JSON-LD | `landing-page.tsx` | Canonical auto-referenziante, OG con titolo per pagina, `BreadcrumbList` + `Service` + `FAQPage` |
| Micro-demo (client) | `landings/demos/*.tsx` | Chiamata multilingua, self order, hub moduli e coda servizio, WhatsApp, sync menu interattivo, recensioni e orari |
| Tracking funnel | `landing-tracker.tsx` + `lead-form.tsx` | Vedi § 4 |
| Route | `src/app/soluzioni-ristoranti/` | Path **interno**: `/ristoranti` è già la route del portale clienti `(clienti-portal)` |
| Routing | `src/middleware.ts` → `handleMenuaryLanding` | `/ristoranti/*` → rewrite interno in italiano; `/<lingua>/ristoranti/*` → redirect al path nudo; landing spenta → 404 reale in produzione |
| Sitemap | `menuaryLandingSitemap()` in `src/lib/marketing-seo.ts` | Solo landing pubblicate |
| Navigazione | `marketing-shell.tsx` | Voce "Soluzioni" in header e colonna in footer, solo per la lingua italiana |
| OG image | `src/app/api/og/route.tsx` | Parametro opzionale `title` |
| Stile | `src/styles/marketing.css` § v13 | Solo token del brand Menuary |

**Anteprima delle pagine spente:** fuori dalla produzione (`VERCEL_ENV !== "production"`: locale e preview Vercel) le landing spente sono visibili, sempre `noindex`, e l'hub le elenca tutte. In produzione rispondono 404.

---

## 3. Verifica delle funzioni al 2026-09-30

Dedotto dal codice **e** dal database di produzione (`manuary.it`).

| Funzione | Codice | Produzione | Uso nelle landing |
|---|---|---|---|
| Telefonate IA (Retell): disponibilità, prenotazione (`pending_manual`), ordine asporto/delivery, ricerca menu e allergeni, info locale, passaggio al personale (`handoff_phone`), riconoscimento cliente | `api/retell/inbound`, `lib/retell/*` | Attivo su 1 tenant (kimos, trattativa), lingua `it-IT` | Pubblicato |
| Multilingua al telefono | `set_customer_language`; lingua agente da configurare su Retell | Nessun agente configurato multilingua | Pubblicato su scelta del titolare: **da configurare** alla prima attivazione (§ 6, C1) |
| Modifica/annullo prenotazione al telefono | Assente | — | Dietro `reservationChangesByPhone` |
| Assistente WhatsApp **per i clienti** (ordini e prenotazioni, italiano) | `api/whatsapp/inbound` | — | Citato nell'ecosistema |
| Assistente WhatsApp **per il titolare** | `lib/tenant-support/whatsapp-service.ts`: prenotazioni/coperti, ordini aperti, vendite, piatti più venduti, disponibilità, cambio prezzo e blocco fasce con conferma; più sospensione ordini, import menu e ticket | Pronto; numeri reali da autorizzare per tenant | Pubblicato → `ownerWhatsappAssistant` |
| Chat IA sul menu per il cliente | `api/ai/assistant`: Responses API vincolata al menu attivo, fallback conservativo, lingua cliente, allergeni, indice upsell, profilo Menuary autenticato (preferenze, preferiti locali e storico tenant) e suggerimenti aggiungibili al carrello | Collaudata con menu reale in sito/tavolo e kiosk | Pubblicato → `conversationalMenu` |
| Upselling IA nel carrello | `lib/upselling-engine.ts`, `CartAiUpsell` | Indice `menu_upsell_indexes` vuoto | Base del futuro self order |
| Priorità di vendita del titolare | Assente | — | → `salesPriorities` |
| Menu unico sui canali interni (sito, QR, kiosk, asporto, telefono) | `menu_items.available`, liste per canale | Kiosk: 1 device | Pubblicato |
| Delivery via HubRise (push menu/prezzi/disponibilità, ordini in entrata, stato in uscita) | `lib/hubrise/*`, `api/menu-sync` | **0 collegamenti, mai usato** | Pubblicato su scelta del titolare: **da collaudare** al primo cliente (§ 6, C2) |
| Google Business Profile: orari e chiusure, descrizione, recensioni e risposte, insights | `lib/google/my-business.ts`, `api/gestione/google/*` | **0 account collegati** | Pubblicato su scelta del titolare: **da collaudare** (§ 6, C3) |
| Bozza IA di risposta alle recensioni | Assente | — | → `reviewReplyDrafts` |
| Cassa | `cashRegister`, `cash_sessions`/`cash_movements` | 0 sessioni | Pubblicato (gestionale) |

---

## 4. Tracking e conversioni

Usa il sistema esistente ([[adr-0011-tracciamento-condiviso-con-consenso]]), nessuna piattaforma nuova.

| Evento | Dove | Proprietà |
|---|---|---|
| `landing_view` | `LandingTracker` al mount | `landing` |
| `landing_cta_click` | clic su `[data-landing-cta]` | `landing`, `cta` (`primary`, `secondary`, `demo`, `final`, `final-phone`, `final-email`, `related`, `ecosystem`), `target` |
| `demo_form_open` | `lead-form.tsx` con `?landing=` | `landing` |
| `demo_request_sent` | `lead-form.tsx`, dopo invio riuscito | `landing` |
| conversione `lead` | `trackConversion` esistente | `label: landing:<slug>` |

- Gli eventi vanno a Vercel Analytics (senza cookie) e a GA4 solo con consenso analytics. La conversione `lead` segue le regole di consenso di ADR-0011 (OpenAI Ads, Google Ads, Meta).
- Il lead salva `source = menuary-landing:<slug>` in `platform_leads.source`, più l'attribuzione di sessione (`utm_*`, `oppref`, `landing_path` di atterraggio).
- UTM e click ID **non** vengono ricopiati sui link verso `/contatti`: la pagina contatti li ricattura come nuova campagna e `landing_path` perderebbe la landing d'ingresso.
- `/contatti?landing=…` resta sempre in italiano (middleware), anche per visitatori con mercato o lingua esteri.
- **Prenotazione demo completata:** Menuary non ha un calendario demo. La richiesta dal form *è* la richiesta di demo. Se in futuro si aggiunge un booking, va tracciato come conversione `booking` con `label: landing:<slug>`.

---

## 5. Funzioni da costruire (progetto)

Sono funzioni che vogliamo avere. Toccano moduli condivisi: ogni modifica a un modulo richiede l'autorizzazione esplicita dell'utente (CLAUDE.md) e deve funzionare per tutti i tenant.

### F1 — Assistente WhatsApp del titolare (`ownerWhatsappAssistant`)

Estendere `src/lib/tenant-support/whatsapp-service.ts` (oggi 4 intent) con:

- **Domande:** coperti e prenotazioni di oggi/domani/fascia; ordini aperti.
- **Analisi:** vendite del giorno/periodo (da ordini e cassa), piatti più venduti.
- **Modifiche operative:** piatto (non) disponibile, sospendi/riattiva canali specifici.
- **Operazioni sensibili con conferma:** chiusura fasce di prenotazione, cambio prezzo. Riepilogo esplicito e attesa del "sì", come oggi per i ticket.
- Permessi per ruolo già previsti (`manageMenu`, `manageSettings`, `manageHours`): vanno applicati ai nuovi intent.
- Prerequisito operativo: registrare i numeri `tenantadmin` in `tenant_customer_service_contacts` (oggi vuota).

### F2 — Chat IA sul menu per il cliente (`conversationalMenu`)

Sostituire lo stub `api/ai/assistant` con una conversazione LLM vincolata al menu attivo del canale (ingredienti, allergeni, tag, prezzi, disponibilità), collegata al carrello (`cart-drawer`) su QR, tablet e kiosk. Deve rispondere nella lingua del cliente, riusare l'indice di `upselling-engine` per gli abbinamenti e, per una sessione Menuary autenticata, affinare i suggerimenti con allergeni/preferenze del profilo, preferiti e storico ordini limitato al tenant. I conflitti con allergeni noti devono essere filtrati anche lato server dopo la risposta del modello.

### F3 — Priorità di vendita del titolare (`salesPriorities`)

Il titolare indica piatti da spingere (con scadenza: "stasera", "fino a esaurimento"), dal pannello e, con F1, da WhatsApp. `upselling-engine` e la chat F2 li considerano solo se coerenti con le preferenze del cliente.

### F4 — Bozza IA delle risposte alle recensioni (`reviewReplyDrafts`)

In `reviews-manager.tsx`: bozza generata per recensione, nel tono del locale, modificabile. La pubblicazione resta manuale (`replyToReview`). Mai risposta automatica.

### F5 — Modifica e annullo prenotazioni al telefono (`reservationChangesByPhone`)

Nuove action in `api/retell/inbound` per trovare la prenotazione del chiamante (dal numero) e spostarla o annullarla, con le stesse regole di disponibilità di `create_reservation`, più i tool corrispondenti nel flow Retell.

---

## 6. Bacheca di avanzamento

### Landing

| # | Lavoro | Stato | Note |
|---|---|---|---|
| L1 | Registro, routing middleware, route interne, sitemap, nav | 🔵 in test | Verificato in locale: `/ristoranti/*` 200, `/en/ristoranti/*` 302, slug ignoto 404, path interno 404, sitemap con le 4 pubblicate. Manca la verifica sul dominio di produzione dopo il deploy. |
| L2 | Landing `telefonate-prenotazioni-ai` | 🔵 in test | Aperta nel browser (desktop e mobile), demo multilingua funzionante. Da vedere in produzione. |
| L3 | Landing `gestionale` | 🔵 in test | Come L2. |
| L4 | Landing `menu-delivery` | 🔵 in test | Demo interattiva verificata. |
| L5 | Landing `google-maps-recensioni` | 🔵 in test | Demo in variante manuale (senza bozza IA). |
| L6 | Landing `self-order-ai` | 🔵 in test | Pubblicata con F2; pagina e demo complete. Da vedere sul dominio di produzione dopo il deploy. |
| L7 | Landing `whatsapp` | 🔵 in test | Pubblicata con F1; pagina e demo complete. Da vedere sul dominio di produzione dopo il deploy. |
| L8 | Tracking funnel (`landing_*`, `demo_*`, `source` sul lead) | 🔵 in test | Eventi visti in Vercel Analytics (dev). Lead reale non inviato per non sporcare il DB di produzione: da verificare il primo lead con `source = menuary-landing:*`. |
| L9 | Pixel OpenAI Ads Menuary | ⬜ da iniziare | `TRACKING_MENUARY_OPENAI_PIXEL_ID` da valorizzare su Vercel (utente), vedi [[integrazioni-attive]]. |

### Funzioni prodotto (interruttori in `MENUARY_FEATURE_READY`)

| # | Funzione | Flag | Stato | Note |
|---|---|---|---|---|
| F1 | Assistente WhatsApp del titolare | `ownerWhatsappAssistant` | ✅ completata | Permessi per ruolo, audit, letture operative, disponibilità piatti e conferma per prezzo/fasce. Collaudo reale su webhook e DB il 2026-09-30; dati di test rimossi. |
| F2 | Chat IA sul menu per il cliente | `conversationalMenu` | ✅ completata | Menu attivo per canale, lingua cliente, allergeni, profilo autenticato, preferiti, storico ordini tenant, indice upsell e aggiunta al carrello su sito/tavolo/kiosk. API, isolamento anonimo e flusso E2E mobile verificati il 2026-09-30. |
| F3 | Priorità di vendita del titolare | `salesPriorities` | ⬜ da iniziare | Dipende da F2 per il valore in pagina. |
| F4 | Bozza IA risposte recensioni | `reviewReplyDrafts` | ⬜ da iniziare | |
| F5 | Modifica/annullo prenotazioni al telefono | `reservationChangesByPhone` | ⬜ da iniziare | Richiede anche la modifica del flow su Retell (non editabile via API da pubblicato). |

### Collaudi di funzioni già scritte e già dichiarate nelle landing

Scelta del titolare (2026-09-30): pubblicarle ora e configurarle o correggerle al primo cliente che le chiede.

| # | Lavoro | Stato | Note |
|---|---|---|---|
| C1 | Telefonate in più lingue | ⬜ da iniziare | Configurare lingua multipla sull'agente Retell e provare una chiamata in inglese e tedesco. |
| C2 | Delivery via HubRise | ⬜ da iniziare | Primo collegamento reale: OAuth, push catalogo, ordine di prova, stato di ritorno. Tabella `hubrise_links` vuota. |
| C3 | Google Business Profile | ⬜ da iniziare | Primo collegamento reale: orari speciali, risposta a recensione, insights. Tabella `tenant_google_auth` vuota. |
| C4 | Riepilogo ordine telefonico su WhatsApp | ⬜ da iniziare | I template Twilio erano in approvazione Meta (vedi `handoff.md`): verificare lo stato. |

---

## Collegamenti

- [[adr-0012-claim-landing-legati-a-funzioni-pronte]]
- [[adr-0011-tracciamento-condiviso-con-consenso]]
- [[moduli-piattaforma]]
- [[integrazioni-attive]]
- [[endpoint-ia]]
