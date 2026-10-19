# Audit go-live Kimos: ordini telefonici → stampa

- **Data:** 2026-10-19
- **Ambito:** tenant `kimos` e la catena completa *chiamata Retell → `create_order` → finalizzazione → stampa comanda SUNMI*.
- **Metodo:** lettura del codice, query in sola lettura sul DB di produzione (`tagymkqywjlrqwduxvcw`), log Vercel del progetto `menuary`. **Non verificato**: configurazione live dell'agente Retell (la `RETELL_API_KEY` non è nei file env locali) e stato del dispositivo SUNMI (servono le credenziali SUNMI).
- Collegati: [[audit-gestione]], [[stampanti-comande]], [[integrazioni-attive]].

## Istruzioni per l'IA

Stati ammessi: ⬜ da iniziare, 🟡 in lavorazione, 🔵 in test, ✅ completata. `tsc`/`lint` puliti portano a 🔵; ✅ solo dopo una **chiamata di prova reale che fa uscire la comanda dalla stampante di Kimos**. Aggiorna la bacheca nello stesso intervento in cui cambi il codice. I file in `src/lib/retell/`, `src/lib/orders/` e `src/lib/printing/` sono moduli condivisi: ogni modifica deve restare valida per tutti i tenant e va autorizzata dall'utente.

## Verdetto

**Oggi la catena non funziona end-to-end.** La parte telefonica (risposta, menu, creazione ordine) ha funzionato nei test di giugno. La stampa automatica di un ordine telefonico invece **non è mai avvenuta**: nessuno degli 11 ordini Retell di Kimos ha `comanda_printed_at` valorizzato. Ci sono almeno tre blocchi indipendenti, ognuno sufficiente da solo a impedire la stampa.

Dati di fatto (DB, 2026-10-19):

- 11 ordini Retell in tutto, l'ultimo il 2026-06-24. Tutti con `location_id = NULL`.
- Ultima chiamata ricevuta (`channel_webhook_events`): 2026-06-24, agente versione 33. Nessuna chiamata negli ultimi 4 mesi, quindi tutto quello che è cambiato dopo (sede, stampante, nuovo menu, refactor gestione) non è mai stato provato con una telefonata.
- Stampante Kimos: `sunmi_cloud`, SN `N411246600954`, legata alla sede `dd696b5f…` (Milano Santa Giulia).
- Nessuna riga `tenant_order_settings` per Kimos (valgono i default). Zero `push_subscriptions` per Kimos.

## Blocchi critici (P0): senza questi la stampa non parte

### P0-1. Il cron che finalizza gli ordini non stampa

Un ordine telefonico nasce `pending_confirmation` con scadenza a 2 minuti (`createRetellOrder`, `src/lib/retell/inbound-orchestrator.ts`). Se il cliente non apre il link WhatsApp (il caso normale al telefono), l'ordine viene finalizzato dal job **pg_cron** `expire-pending-orders` (ogni minuto), che esegue la funzione SQL `public.expire_pending_orders()`. Quella funzione fa solo `UPDATE status='nuovo'`: **non chiama `dispatchComandaForOrder` e non manda la notifica push**.

La route Next `src/app/api/cron/expire-pending-orders/route.ts`, che invece usa `finalizePendingOrder` e stampa, **non è schedulata da nessuna parte** (non è in `vercel.json` né in `cron.job`).

Effetto: l'ordine diventa "nuovo" in silenzio. La comanda non esce. La stampa SUNMI cloud è solo server-side, quindi nessun watcher client la recupera.

**Fix proposto:** sostituire il comando del job pg_cron con una chiamata HTTP a `/api/cron/expire-pending-orders` (stesso schema degli altri job: `net.http_get` + `Authorization: Bearer CRON_SECRET`), oppure aggiungere la route a `vercel.json`. Lasciare la funzione SQL come fallback solo se la route risulta irraggiungibile.

### P0-2. Ordine senza sede, stampante legata alla sede

Retell crea gli ordini con `location_id = NULL` (il flow non passa `locationId`; se lo passasse non UUID viene azzerato). `loadPrinters()` (`src/lib/printing/config.ts`) con `locationId = null` considera **solo** le stampanti con `location_id IS NULL`. L'unica stampante Kimos è legata alla sede → `dispatchComandaForOrder` risponde `no_active_printer`. Questo vale anche per la conferma dal link di checkout.

**Fix proposto (uno dei due):**
- in `createRetellOrder`, se `locationId` è nullo usa la sede `is_default` del tenant quando esiste (Kimos ne ha una sola);
- oppure in `loadPrinters`, con `locationId` nullo, ripiegare sulla stampante della sede di default.

La prima è più pulita: allinea anche operativo, menu e orari, che lato sede sono già configurati.

### P0-3. SUNMI: dispositivo non ancora associato all'account

Al 2026-10-13 SUNMI aveva associato all'account Pynk Studio la SN sbagliata (`…1006`); l'etichetta fisica è `…0954` (quella nel DB). Finché SUNMI non associa la `…0954`, `pushContent` e `bindShop` rispondono `10071704`. **Da verificare** con «Collega e stampa prova» in Gestione → Cassa → Stampanti, con «Backend live» attivo. Lato codice non si può risolvere: tocca a chi gestisce il rapporto con SUNMI.

### P0-4. Due menu sovrapposti con prezzi diversi

Nel DB Kimos ci sono due set di prodotti:

| Set | Creato | Prodotti | Sede | Nella lista "Menu completo" |
|---|---|---|---|---|
| Codici `pizza-03-…`, `kebab-01-…` | 2026-07-11 | 165 (84 pizze) | nessuna | no |
| Codici `kimos-…` | 2026-10-03 | 41 (7 pizze) | Santa Giulia | **sì, tutti e 41** |

L'unica `menu_lists` attiva contiene solo i 41 `kimos-…`. L'agente quindi **può vendere solo 41 prodotti**, e i prezzi differiscono dall'altro set (Margherita 7 € contro 6 €, Diavola 9 € contro 8 €, Mix fritti 12,50 € contro 9,50 €). 18 nomi sono duplicati tra i due set.

**Da confermare con il cliente:** quale dei due è il menu e il listino reale. Poi disattivare o eliminare l'altro set e ricostruire la lista. Senza questo, il cliente al telefono può sentirsi dire "non lo abbiamo" su piatti presenti nel menu cartaceo, o pagare un prezzo diverso da quello del volantino.

## Problemi gravi (P1): la comanda esce, ma sbagliata o incompleta

### P1-1. La comanda non dice quando consegnare né a che citofono

`buildComandaEscPos` (`src/lib/printing/comanda.ts`) stampa solo `pickup_time`. Retell salva l'orario in `desired_time` e i dati di consegna in `delivery_doorbell`, `delivery_floor` e `delivery_notes`. Nessuno di questi campi è nelle colonne lette da `dispatch.ts`, né in `dbRowToOrder`. Esempio reale: l'ordine R014 ha `desired_time = 18:00` e `delivery_doorbell = "Mina Mina"`, ma sulla carta non comparirebbero.

### P1-2. Orario sulla comanda in UTC

`createdAt.toLocaleTimeString("it-IT", …)` è chiamato senza `timeZone`. Sul server (UTC) l'ora stampata è indietro di 1 ora (CET, dal 25 ottobre) o di 2 (CEST). Serve `timeZone: "Europe/Rome"`.

### P1-3. Formato e impasto si perdono

- `create_order` accetta `priceOption` ma in `order_lines` non salva l'etichetta (`variant_label` resta NULL). Una "Gigante" esce in comanda come pizza senza formato.
- Se l'agente passa l'etichetta ("gigante") invece del codice (`large`), `resolveNumericPrice` ripiega in silenzio sul default: il cliente ordina la Gigante e paga la Normale.
- Le varianti obbligatorie (impasto) non hanno un campo in `create_order`: finiscono nella nota libera, senza sovrapprezzo. Esempio reale: R010 "doppia pasta" a 7 €.

### P1-4. Errori di stampa silenziosi, nessun retry

`dispatchComandaForOrder` è chiamato con `void … .catch(() => {})`. Se SUNMI risponde errore, il claim viene annullato ("riproveremo al prossimo evento/cron"), ma **non esiste un retry**: nessun job ripassa sugli ordini `nuovo` con `comanda_printed_at IS NULL` e una stampante cloud. Nessun `recordPlatformError`, nessun avviso allo staff.

In più, la chiamata è un `void` dentro route handler serverless (`/api/orders/[id]/confirm`, `finalizePendingOrder`): senza `after()`/`waitUntil` la funzione può essere congelata dopo la risposta, prima che la richiesta a SUNMI parta.

**Fix proposto:** `after(() => dispatch…)` nelle route, più un job ogni minuto che ritenta gli ordini accettati, non stampati e recenti (es. creati da meno di 2 ore) per i tenant con stampante `sunmi_cloud`. Ogni fallimento va loggato in `platform_error_events`.

### P1-5. Rischio ordini doppi

In `createRetellOrder`, dopo l'insert dell'ordine, possono ancora lanciare: l'insert di `order_lines`, `recordCustomerEvent` e `createChannelPaymentRequest` (WhatsApp/Stripe). In quel caso la route risponde 500, l'agente dice "c'è stato un problema" e il cliente riordina, ma il primo ordine esiste già e tra 2 minuti verrà finalizzato. Non c'è chiave di idempotenza (es. `call_id` di Retell). Il caso si è già visto in giugno (vedi memoria Retell: bug `order_code`).

**Fix proposto:** invio link e CRM in `try/catch` best-effort dopo la creazione. Se `order_lines` fallisce, cancellare l'ordine appena creato. Dedupe su `call_id` (passato dal flow come costante) per 10 minuti.

### P1-6. Nessuna rete di sicurezza per lo staff

Kimos ha zero `push_subscriptions` e l'ultima presenza sul portale ordini risale al 2026-10-03. Se la stampa fallisce nessuno se ne accorge. Inoltre la finalizzazione via pg_cron (P0-1) non manda push. Prima del go-live serve almeno un dispositivo in negozio con il portale Operativo → Ordini aperto e le notifiche attive.

## Rischi da gestire (P2)

- **Tutto gira sull'host demo.** Kimos non ha `domains`, è `trattativa`, i tool Retell puntano a `https://demo.menuary.it/api/retell/inbound` e i link di checkout escono su `demo.menuary.it/kimos/…`. La conferma da `/api/orders/[id]/confirm` su host demo stampa solo con «Backend live», che **scade dopo 15 minuti** (`backend_live_until`). Il percorso principale (`/api/checkout/[code]/confirm` e il cron) non ha questo gate, ma per un cliente pagante va deciso: dominio dedicato oppure host di produzione per tool e checkout, e `status` del tenant aggiornato.
- **Webhook `call_inbound` senza try/catch** (`src/app/api/webhooks/retell/route.ts`): se `buildInboundDynamicVariables` lancia (DB lento, Supabase giù), Retell riceve 500 e la chiamata parte senza variabili. Il welcome della v33 dipende da `{{welcome_greeting}}`. Serve un fallback con variabili minime e un tempo massimo.
- **Segreto nelle variabili dinamiche:** `retell_webhook_secret` è iniettato come variabile della chiamata. Finisce nei payload salvati in `channel_webhook_events` e nei log Retell, ed è teoricamente estraibile dall'LLM con prompt injection vocale. Meglio usare la firma `x-retell-signature` (già supportata) e togliere il segreto dalle variabili.
- **Segreti in chiaro nei job pg_cron:** `CRON_SECRET` e la service-role key sono scritti nel testo dei comandi di `cron.job`. Spostarli in Supabase Vault.
- **`/api/orders/[id]/confirm` senza autenticazione:** basta l'UUID dell'ordine per confermarlo. Rischio basso (UUID non indovinabile), da chiudere comunque.
- **Allergeni:** 48 prodotti su 206 senza allergeni. Va verificato quanti sono nel set attivo. Il prompt dice di passare al locale per gli allergeni; `handoff_phone` è `02 513404`, da confermare che risponda qualcuno.
- **Configurazione Retell non verificata:** da controllare dalla dashboard Retell che il numero `+390281279366` punti all'agente `agent_29fe02fd86f1c81e2f08ec1a9d` all'ultima versione pubblicata, che le URL dei tool e del webhook siano quelle di produzione e che il timeout dei tool sia di almeno 10 s.
- **Testata comanda "MENUARY"** invece del nome del locale: cosmetico, ma in cucina con più canali aiuta.

## Bacheca di avanzamento

| # | Pri | Lavoro | Stato | Note |
|---|---|---|---|---|
| 1 | P0 | Finalizzazione a scadenza che stampa (pg_cron → route Next) | 🔵 | 2026-10-19: migration `20261019_expire_pending_orders_via_route.sql` applicata in prod (job `expire-pending-orders-http`, Vault). Funzione SQL ridotta a fallback dopo 3 min. Manca il collaudo con un ordine reale |
| 2 | P0 | Ordini Retell sulla sede di default / stampante di fallback | 🔵 | `resolveOrderLocationId` in `createRetellOrder`: sede `is_default`, o l'unica sede. Codice non ancora deployato |
| 3 | P0 | SUNMI associa la SN `N411246600954` all'account | ⬜ | Azione esterna, tocca a chi segue SUNMI |
| 4 | P0 | Scegliere il menu reale, ripulire l'altro set, rifare la lista | ⬜ | Serve la conferma del cliente sul listino |
| 5 | P1 | Comanda: orario richiesto, citofono, piano, note consegna | 🔵 | Verificato con rendering locale della comanda. Da vedere su carta |
| 6 | P1 | Comanda: ora in Europe/Rome | 🔵 | 17:05 UTC → 19:05 nel rendering di prova |
| 7 | P1 | Formato/impasto salvati in `variant_label` e prezzati | 🟡 | Backend fatto: `priceOption` accetta codice o etichetta, salva `variant_label` e mette il formato nel nome; formato sconosciuto → 422 `price_option_required:<item>:<etichette>`. Nuovo campo opzionale `lines[].variantOptions` (impasto) → `added_extras` con sovrapprezzo. **Manca:** aggiungere `variantOptions` al tool `create_order` del flow Retell |
| 8 | P1 | Retry stampa + log errori + `after()` | 🔵 | `retryPendingComande` nel cron (ordini `nuovo`/`in_preparazione`, ≤ 120 min), errori in `platform_error_events` con fingerprint per ordine. Dispatch atteso in `finalizePendingOrder` e conferma staff, `after()` in `/api/orders`. Conferma staff su demo spenta marca la comanda come gestita |
| 9 | P1 | Idempotenza `create_order` e side effect best-effort | 🔵 | Doppione = stesso telefono, stesso tipo, stesse righe entro 10 min → restituisce l'ordine esistente (`duplicate: true`). Righe fallite → ordine cancellato. CRM e link WhatsApp non bloccanti (errore loggato; online senza link → scade come pagamento alla consegna) |
| 10 | P1 | Dispositivo in negozio con Operativo aperto + push | ⬜ | Azione del cliente/onboarding |
| 11 | P2 | Host di produzione per tool, webhook e checkout | ⬜ | |
| 12 | P2 | Fallback webhook `call_inbound` | ⬜ | |
| 13 | P2 | Segreti fuori da variabili dinamiche e `cron.job` | ⬜ | |
| 14 | — | **Collaudo:** 10 chiamate reali (asporto, consegna, Gigante, extra, orario futuro, fuori orario, cliente noto/nuovo, riaggancio a metà, ordine doppio) con comanda stampata | ⬜ | Condizione per dichiarare il go-live |
