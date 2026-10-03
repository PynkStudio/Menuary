# Audit: pannello `gestione` e backend dei tenant

- **Stato:** audit completato il 2026-10-03; correzioni P0–P2 applicate lo stesso giorno, in test (bacheca in § 7).
- **Perimetro:** `src/app/gestione/[tenantSlug]/**`, `src/components/gestione/**`, `src/app/api/gestione/**`, `src/lib/gestione-*.ts`, `src/lib/store-roles.ts`, `src/lib/data/tenant.ts`, tabelle Supabase usate dal pannello (progetto `manuary.it`).
- **Metodo:** lettura del codice, interrogazioni in sola lettura sul DB di produzione, advisor di sicurezza Supabase, navigazione del pannello in locale (`next dev`, host `demo.menuary.localhost` e `demo.bizery.localhost`) su BePork, Kimos, Libritech e Casa Bramanti.

> **Come leggere questo documento.** Ogni problema dice se è **verificato** (riprodotto o letto nel DB) oppure **dedotto dal codice** o **da verificare**. Le priorità vanno da P0 (da chiudere subito) a P3 (rifinitura). L'avanzamento sta nella bacheca di § 7.

---

## 0. Istruzioni per l'IA che lavora su questo progetto

- Prima di toccare il pannello `gestione` o le API `api/gestione`, leggi la bacheca di § 7 e riparti dalla prima voce P0/P1 non completata.
- Stati ammessi: ⬜ **da iniziare**, 🟡 **in lavorazione**, 🔵 **in test**, ✅ **completata**. `tsc` e `lint` puliti portano a 🔵, non a ✅. Il passaggio a ✅ richiede una verifica sul campo: richiesta HTTP rifatta, advisor Supabase rieseguito o pagina aperta.
- Le correzioni di sicurezza su DB vanno applicate con MCP `apply_migration`, mai con `supabase db push` (vedi memoria "migration history disallineata"). Dopo ogni migration verifica l'oggetto sul DB.
- I moduli condivisi non si modificano senza autorizzazione esplicita dell'utente (CLAUDE.md). Le voci che toccano un modulo lo segnalano.
- Ogni cambio a schermate, route o etichette del pannello va riportato nelle schede `docs/kb/ui/` nello stesso intervento.

---

## 1. Sintesi

Il pannello ha tre problemi strutturali. Tutti gli altri problemi derivano da questi:

1. **Il controllo di accesso c'è solo in superficie.** Il layout fa il login, la nav nasconde le voci, ma le pagine e le API controllano raramente il ruolo. Sul DB 14 tabelle sono senza RLS e scrivibili con la chiave pubblica. Sull'host demo, con `backend_live` acceso, le API rispondono senza login con dati reali.
2. **Ci sono due fonti di verità per i tenant, e divergono.** Alcune pagine leggono il `TENANTS` statico in `tenant-registry.ts`, altre leggono la tabella `tenants` tramite `getTenantById()`. Sul DB i flag, il verticale e lo stato sono diversi dal registry per quasi tutti i tenant.
3. **Non esiste un'architettura dell'informazione.** C'è una barra piatta fino a 21 voci, senza gruppi e con etichette in parte non tradotte. Le funzioni sono sparse tra la nav, il menu ingranaggio, le scorciatoie della dashboard e il portale `operativo`. Convivono tre sistemi visivi: le classi `ga-*`, Tailwind `pork-*` e gli stili inline.

In più nessun tenant ha utenti reali: `tenantadmin` ed `employee` sono **vuote** su tutti i tenant (verificato). Ruoli, permessi, inviti staff e multi-sede per staff non sono mai stati esercitati in produzione. Oggi entrano solo i 3 siteadmin.

---

## 2. P0 — Sicurezza (da chiudere prima di dare accesso a un cliente)

### 2.1 Demo con `backend_live`: API reali senza login — **verificato**

`authorizeGestione()` (`src/lib/gestione-auth.ts`), quando trova un host demo e `tenant_demo_controls.backend_live = true`, restituisce `{ isAdmin: true, isPlatformAdmin: true }` **senza alcun utente**. Il layout fa lo stesso con `skipAuthGate`.

- `backend_live` è acceso su 6 tenant: cascina-errante, doca, kimos, libritech, valentina-orciuoli e pynkstudio.
- Riprodotto in locale: `GET /api/gestione/ai-phone?tenantId=kimos` con host demo e senza cookie restituisce la configurazione reale dell'assistente telefonico (numero, id agente Retell, system prompt). Anche `GET /api/gestione/order-settings?tenantId=kimos` risponde con i dati reali.
- Dedotto dal codice: le stesse rotte accettano anche `PATCH`/`PUT`. Chiunque apra la demo pubblica può quindi modificare impostazioni reali (assistente AI, ordini, stampanti, risposte alle recensioni Google). Non ho eseguito scritture per verificarlo.

**Direzione:** `backend_live` deve richiedere comunque un utente autenticato (siteadmin o admin del tenant). In alternativa va limitato alle sole letture e alle tabelle demo.

### 2.2 Tabelle senza RLS esposte con la chiave pubblica — **verificato (advisor + grant)**

Su 14 tabelle RLS è disattivata e `anon`/`authenticated` hanno tutti i permessi, `TRUNCATE` compreso: `tenant_google_auth`, `tenant_google_locations`, `google_sync_log`, `tenant_special_hours`, `staff_locations`, `shifts`, `cash_sessions`, `cash_movements`, `kiosk_devices`, `siteadmin_email_aliases`, `tenant_order_sequences`, `hubrise_links`, `hubrise_menu_sync_log`, `hubrise_inbound_log`.

- `tenant_google_auth` contiene i token OAuth Google. Oggi ha 0 righe, quindi il rischio è latente: si attiva al primo collegamento Google di un cliente.
- `siteadmin_email_aliases` (6 righe) è leggibile e scrivibile da chiunque abbia la chiave anon, che è pubblica nel bundle.

### 2.3 Funzioni `SECURITY DEFINER` eseguibili da `anon` — **verificato (advisor + definizione)**

- `create_tenant_with_location(...)`: dalla definizione non risulta alcun controllo sul chiamante. Chiunque può creare un tenant con domini e flag arbitrari.
- `revoke_tenant_access(p_employee_id, p_revoker_user_id)`: si fida del parametro `p_revoker_user_id` invece di `auth.uid()`. Basta passare l'id di un siteadmin per disattivare qualsiasi dipendente.
- `platform_suspend_overdue_tenants()`: chiamabile da anonimo.
- Altre 9 funzioni segnalate dall'advisor (`can_admin_tenant`, `is_siteadmin`, …) sono di sola lettura; vanno rivalutate comunque.

### 2.4 Permessi per ruolo non applicati lato server — **dedotto dal codice**

- `getEffectiveCapabilities()` (`src/lib/store-roles.ts`) restituisce **`FULL_ACCESS`** per qualsiasi ruolo non in `EMPLOYEE_ROLES`. Gli account dispositivo `kitdisplay` e `kiosk` vedono quindi tutto il pannello.
- `authorizeGestione()` ammette ogni `employee` abilitato. Delle 37 rotte `api/gestione` solo poche controllano `isAdmin` o il ruolo: un cameriere, o un account kiosk, può chiamare `ai-phone`, `order-settings`, `printers`, `google/*`, `hours`, `location-profile`.
- Le pagine controllano il flag del modulo ma quasi mai la capability: `turni`, `staff`, `impostazioni`, `cassa` e `analytics` sono aperte a ogni dipendente se si scrive l'URL a mano. La nav le nasconde, il server no.
- La dashboard mostra l'incasso del giorno a ogni ruolo e non controlla `can_view_financials`.

### 2.5 Quattro tabelle di identità, regole diverse — **dedotto dal codice**

`siteadmin`, `tenantadmin`, `employee` e `admin_users` vengono interrogate in combinazioni diverse a seconda del file:

- il layout ignora `admin_users` per l'accesso;
- `api/gestione/profile` e la pagina `impostazioni` la accettano;
- `billing/*` accetta solo `tenantadmin`, quindi un siteadmin non scarica le fatture;
- `linktree` accetta siteadmin e tenantadmin;
- `invite-staff` accetta anche il manager.

Serve un'unica funzione `requireGestioneRole(tenant, capability)` usata da layout, pagine e API.

---

## 3. P1 — Funzionalità rotte o dati incoerenti

### 3.1 Registry e DB divergono — **verificato**

`getTenantById()` usa i `features` del DB se non vuoti, altrimenti quelli del registry. Lo stesso vale per nome, verticale e stato. Confronto al 2026-10-03:

| Tenant | Registry | DB | Effetto |
|---|---|---|---|
| bepork | `active`, set completo di moduli | `offline`, `enabled=false`, 6 flag | la gestione demo di BePork mostra solo "Cucina" e "Fatturazione" e dice "Nessun modulo attivato" |
| libritech | `services` | `food`, nessun flag | la gestione mostra "Menu online", "Piatti non disponibili", "del tuo locale" su un tenant Bizery |
| valentina-orciuoli | `creative` | `food` | `rowToProfile` forza il registry solo per i creative: c'è una patch dedicata |
| officinakam | `services` | flag `tablePlanner` e `inventoryFoodCost` (moduli food) | moduli fuori verticale |
| casabramanti, studioaranzulla | presenti | **assenti dal DB** | fallback silenzioso sul registry |
| kimos, doca, faak, … | `trattativa`/`trial` | `offline` | — |

In più le pagine scelgono a caso la fonte. `attivita`, `ordini/impostazioni`, `sedi` e `tavoli` usano `TENANTS`, mentre le altre pagine e la shell usano `getTenantById()`. Un modulo acceso solo sul DB compare quindi in nav, ma la pagina risponde 404. Vale anche il caso inverso.

**Direzione:** il DB diventa l'unica fonte e il registry serve solo come seed o fallback in sviluppo. Va aggiunto un controllo, script o test, che segnali le divergenze.

### 3.2 Voci di navigazione che portano nel posto sbagliato — **verificato**

- **"Ordini" apre le impostazioni ordini, non gli ordini.** `/ordini` fa redirect a `/ordini/impostazioni`. La coda ordini vera vive nel portale `operativo` o su `ordini.<dominio>`, raggiungibile solo dalla scorciatoia in dashboard.
- **"Dati attività" non è in nav.** La pagina `/attivita` funziona, ma ci si arriva solo dalla scorciatoia in dashboard. Il menu ingranaggio porta a `impostazioni#dati-attivita`, una pagina diversa.
- **`/sedi`** reindirizza alla dashboard, quindi la gestione sedi non ha una pagina propria.
- **`/info`** e **`/cucina`** sono alias o re-export di altre route (`attivita`, `operativo/.../cucina`).
- **Menu ingranaggio in demo `backend_live`:** 5 voci su 7 puntano a `/impostazioni`. Lì la pagina fa redirect al login reale (`login.menuary.it`), mentre il resto del pannello è aperto.

### 3.3 Pagine raggiungibili per moduli non attivi — **verificato**

`/turni` e `/tavoli` controllano solo l'autenticazione e non il flag del modulo. Su Kimos, senza `staffRoles` e senza `tablePlanner`, rispondono con la pagina piena.

### 3.4 Pagine segnaposto presentate come funzioni — **verificato**

- **Cassa:** il blocco "Setup cassa" contiene tre card decorative (Metodi, Fiscale, Ricevute) senza azione, più la scritta interna "Fondazione sede-aware" visibile al cliente. Su Kimos la voce "Cassa" esiste solo per le stampanti (`printStations`).
- **Patrimoniale** (PynkStudio): componente di 46 righe senza dati.
- **Listino creative non Valentina:** "Configura un editor tenant-specifico".

### 3.5 Dati finti in modalità `backend_live` — **verificato**

`fatturazione` mostra a Kimos il piano "PRO € 49", sei fatture di esempio e moduli inclusi ("Prenotazioni", "Staff") che Kimos non ha, sotto l'etichetta "Demo: dati di esempio". Il resto del pannello, nello stesso momento, scrive sul DB reale. Il cliente in trattativa vede un pannello metà vero e metà finto.

### 3.6 Testi e KPI che non seguono i moduli attivi — **verificato**

- Il testo della dashboard food è fisso: "Da qui gestisci ordini, menu, prenotazioni, staff…". Compare anche su Kimos, che non ha prenotazioni né staff.
- Analytics mostra "Prenotazioni 30gg" a un tenant senza prenotazioni.
- Su Casa Bramanti (maison moda) la voce si chiama "Fedeltà".

### 3.7 Fuso orario dei KPI — **dedotto dal codice, da verificare in produzione**

La dashboard calcola "oggi" con `new Date()` nel fuso del server (`page.tsx`, `loadKpis`). Su Vercel il fuso è UTC, quindi tra le 00:00 e le 02:00 ora italiana ordini e prenotazioni finiscono sul giorno sbagliato. Va usato `Europe/Rome` o il fuso della sede.

---

## 4. P2 — UX e architettura dell'informazione

### 4.1 Navigazione — **verificato**

- La barra orizzontale ha fino a 21 voci (`gestione-shell.tsx`) senza gruppi. Su mobile (375 px) va a capo su 4 righe e occupa un terzo dello schermo. L'header esce dal viewport e l'icona ingranaggio viene tagliata.
- Non c'è distinzione tra il **lavoro quotidiano** (ordini, prenotazioni, cucina, disponibilità piatti) e la **configurazione** (orari, stampanti, assistente AI, Google, fatturazione).
- Esistono tre punti d'ingresso con logiche diverse: la barra, il menu ingranaggio (dove "Blog" è duplicato) e le scorciatoie della dashboard. Non c'è una regola su cosa stia dove.
- Etichette non tradotte e cablate in `gestione-shell.tsx`: "Cucina", "Linktree", "Agenda call", "Patrimoniale", "Rider" e tutte le voci del menu ingranaggio. Per il resto il pannello passa da `src/i18n/gestione.ts`.

**Proposta di struttura** (da validare con l'utente, vedi § 6):

```
Oggi          → Dashboard, Ordini (coda), Prenotazioni/Appuntamenti, Cucina
Offerta       → Menu/Listino/Catalogo, Disponibilità, Liste aggiunte
Clienti       → Fedeltà/CRM, Recensioni Google, Newsletter, Blog, Linktree
Canali        → Assistente AI, Kiosk, Google Business, Rider
Impostazioni  → Dati attività e orari, Ordini, Cassa e stampanti, Sedi, Staff e turni
Account       → Profilo, Abbonamento e fatture, Password, Esci
```

Su desktop va una sidebar a sinistra con gruppi comprimibili, su mobile un bottom sheet o un drawer. Le voci si filtrano per modulo **e** per capability, con la stessa funzione usata dal server.

### 4.2 Dashboard — **verificato**

- La sezione "Funzionalità attive" è un elenco diagnostico di gruppi di moduli, non cliccabile. Al cliente non serve, a noi sì. Va spostata in admin o resa cliccabile.
- I KPI arrivano a 4 e vengono tagliati con `slice(0, 4)`, senza alcuna priorità per verticale.
- In assenza di dati non c'è uno stato vuoto guidato (es. "Nessun ordine oggi: il link ordini è attivo? →").

### 4.3 Moduli — **verificato a campione**

- **Orari** (`attivita`): una card alta per ogni giorno, 7 card per la sola settimana tipo. La frase "Questi orari compaiono sulla tua scheda Google Maps" è vera solo se la sincronizzazione Google è attiva. Quella vive in un'altra pagina, `google/orari`.
- **Menu online:** l'impaginazione, i titoli serif e i bottoni sono diversi dalla dashboard. Sembra un'altra applicazione.
- Il salvataggio usa pattern diversi da pagina a pagina: un bottone "Salva" fisso in basso (`attivita`), "Pubblica" in alto (`listino`), "Salva programma" in fondo al form (`fidelity`). Non c'è un indicatore unico di modifiche non salvate.

---

## 5. P3 — UI e coerenza visiva

### 5.1 Tre sistemi visivi nello stesso pannello — **verificato**

| Sistema | Dove |
|---|---|
| Classi `ga-*` (`src/styles/admin.css`) | shell, dashboard, cassa, attivita, ordini, staff |
| Tailwind `pork-*` + `headline`/`btn-primary`/`impact-title` | `app/admin/menu/page.tsx` (137 occorrenze, è l'editor menu di **tutti** i tenant food), fatturazione (56), ai-phone (47), tutto `google/*` |
| `style={{…}}` inline | 165 occorrenze in `gestione` |

I token `pork-*` puntano alle variabili `--tenant-*`, quindi il colore segue il tenant. Font, raggi e componenti però restano quelli di BePork.

### 5.2 Temi gestione per tenant — **verificato, corretto il 2026-10-03**

La prima stesura dell'audit dava doca, kimos, nom-sushi e junior-food senza tema: in realtà il loro tema gestione c'era, ma stava in `src/styles/admin.css` (file condiviso) invece che nel CSS del tenant. Il 2026-10-03 i quattro blocchi sono stati spostati nei rispettivi `src/styles/tenants/(slug).css`.

Restano con un blocco minimo, ereditato dai token `--tenant-*`: bepork, faak, libritech, studioaranzulla, officinakam. Il loro tema completo (form, tabelle, stati) è lavoro di design da fare tenant per tenant.

### 5.3 Isolamento tenant nel codice comune — **verificato**

- `gestione/[tenantSlug]/listino/page.tsx` importa `ValentinaWorksCatalogAdmin` da `components/tenants/valentina-orciuoli/` e ha un `if (tenant.id === "valentina-orciuoli")`.
- `agenda` e `patrimoniale` importano da `components/admin-pynkstudio/`.
- `/gestione` (pagina root) usa i colori `pork-*` con il marchio "Menuary" anche per i tenant Bizery.

---

## 5b. Problemi emersi durante le correzioni (2026-10-03)

- **API Google senza controllo tenant** — *verificato nel codice*: `google/connect`, `insights`, `locations`, `special-hours`, `status`, `sync-hours` controllavano solo che l'utente fosse loggato. Qualunque account, anche un cliente di un altro sito, poteva collegare o sincronizzare Google di qualsiasi tenant. Ora richiedono il titolare.
- **Demo pura che legge dati reali** — *verificato via HTTP*: anche senza backend live, `ai-phone`, `order-settings`, `ai-voice`, `whatsapp-session`, rider, newsletter e la pagina Iscritti leggevano dal DB reale. Gli iscritti sono dati personali. Upload su storage e chiamate AI erano aperti a chiunque sulla demo.
- **Impostazioni sito solo nel browser** — *verificato nel codice*: social, link email del footer, "Lavora con noi", prezzi menu, finestre prenotazione, valuta e lingue si salvavano solo nel localStorage del gestore. Il sito pubblico li leggeva dal browser del visitatore, quindi i clienti non vedevano mai le modifiche. Valuta e lingue non erano lette da nessuna parte.
- **Abbonamento in Impostazioni sempre vuoto** — *dedotto dal codice*: la lettura usava la sessione utente su tabelle senza policy RLS.
- **Orari Google** — *dedotto dal codice*:
  - "Sync ora" era un `onClick` dentro un Server Component: la pagina andava in errore appena c'erano eccezioni non sincronizzate;
  - "Sincronizza tutto" portava l'utente su una pagina di JSON grezzo;
  - la pagina era protetta dal modulo prenotazioni invece che da Google, quindi su Kimos dava 404.
- **Fedeltà** — *verificato nel browser*:
  - pagine senza stile;
  - il form premi/regole non cambiava i campi al cambio del tipo;
  - il premio "prodotto gratis" chiedeva un UUID da incollare;
  - Iscritti mostrava solo un pezzo dell'ID utente;
  - i link interni erano scritti a mano con `/gestione/...` e si rompevano sui domini custom.
- **Recensioni e Insights Google** ignoravano la sede attiva.
- **Hydration mismatch** nelle scorciatoie della dashboard (stato iniziale diverso tra server e browser).
- **Input con `color-scheme: dark` fisso** in `admin.css`: date e menu a tendina nativi scuri sui temi chiari.

## 6. Decisioni prese (2026-10-03)

1. **Demo backend live**: resta, ma dura **15 minuti** dall'attivazione e poi si spegne da sola. Serve a far provare la gestione ai clienti prima dell'attivazione di sito e login. Il design definitivo è ancora da fare (vedi voce 1).
2. **Fonte di verità tenant**: il DB. Le pagine leggono tutte da `getTenantById()`. Le divergenze si vedono con `npm run tenants:drift`.
3. **Navigazione**: a gruppi, con sidebar su desktop e drawer su mobile.
4. **Ordini**: la voce "Ordini" apre la coda (stessa pagina del portale operativo); le impostazioni diventano "Regole ordini" nel gruppo Impostazioni.
5. **Design system**: le pagine convergono su `ga-*`. Le classi BePork ancora presenti sono rivestite con i token `--ga-*` dentro `.gestione-admin`.

## 7. Bacheca di avanzamento

| # | Priorità | Lavoro | Stato | Note |
|---|---|---|---|---|
| 1 | P0 | Demo backend live: finestra di 15 minuti con spegnimento automatico | 🔵 | Colonna `backend_live_until` (migration `20261003141000`), countdown in admin e nella sidebar gestione. Le 6 demo accese sono state spente. Il design definitivo resta da fare (decisione 6.1) |
| 2 | P0 | RLS e revoca grant `anon`/`authenticated` sulle 14 tabelle esposte | ✅ | Migration `20261003140000` applicata e verificata su DB: RLS attiva, `anon` senza SELECT; `staff_locations` leggibile solo per le proprie righe |
| 3 | P0 | Funzioni SECURITY DEFINER: revoca `EXECUTE`, `revoke_tenant_access` con `auth.uid()` | ✅ | Verificato con `has_function_privilege` su DB |
| 4 | P0 | Ruoli dispositivo e ruoli sconosciuti senza capability | 🔵 | `getEffectiveCapabilities()`; manca la prova con un account kiosk reale |
| 5 | P0 | `requireGestione(tenant, requisito)` su tutte le API e server action della gestione | 🔵 | Verificato via HTTP: 401 senza sessione su host reale. Google ora richiede il titolare. Manca la prova con ruoli staff reali (voce 22) |
| 6 | P1 | Guard di pagina con modulo + ruolo da tabella unica | 🔵 | `gestione-sections.ts` + `requireGestioneSection()`. Verificato su Kimos: Turni, Tavoli, Staff, Prenotazioni e Kiosk danno 404, Google › Orari funziona |
| 7 | P1 | Tutte le pagine leggono il tenant dal DB; script registry↔DB | 🔵 | `npm run tenants:drift` (32 divergenze al 2026-10-03, quasi tutte stati e flag) |
| 8 | P1 | Riallineare i dati `tenants` sul DB | 🟡 | Corretti i verticali di libritech (`services`) e valentina-orciuoli (`creative`). Da decidere con l'utente: stati/enabled, flag BePork (oggi `takeaway` acceso senza `onlineMenu`, quindi niente Ordini), righe mancanti per casabramanti e studioaranzulla |
| 9 | P1 | "Ordini" apre la coda; "Regole ordini" in Impostazioni | 🔵 | Verificato via HTTP su Kimos demo |
| 10 | P1 | Fatturazione senza dati finti in backend live | 🔵 | In backend live mostra un avviso, non dati di esempio né reali |
| 11 | P1 | Testo dashboard e KPI derivati da moduli e ruolo | 🔵 | Il testo elenca le voci realmente visibili; incasso solo con `can_view_financials` |
| 12 | P1 | KPI giornalieri nel fuso `Europe/Rome` | 🔵 | `businessDayRange()` nella dashboard; da verificare dopo mezzanotte con dati reali |
| 13 | P1 | Cassa senza card decorative; "Stampanti" se manca il modulo cassa | 🔵 | |
| 14 | P2 | Navigazione a gruppi (sidebar desktop, drawer mobile), etichette i18n | 🔵 | Verificato nel browser via DOM: sidebar 248 px su desktop; drawer a 375 px che si apre e si chiude (X, sfondo, Esc), nessuno scroll orizzontale. Screenshot non fatti (pannello browser non visibile) |
| 15 | P2 | Dashboard: stati vuoti guidati, rimossa "Funzionalità attive" | 🔵 | |
| 16 | P2 | Pattern unico di salvataggio e modifiche non salvate | ⬜ | Non affrontato: ogni pannello ha ancora il suo bottone |
| 17 | P2 | Orari: editor compatto e stato reale della sincronizzazione Google | 🟡 | Pagina Orari rifatta con `GoogleSyncButton` (esito visibile, niente JSON grezzo, niente crash); editor settimanale ancora a 7 card |
| 18 | P3 | Pagine `google/*`, fatturazione e ai-phone su `ga-*` | 🟡 | Pagine Google convertite. Fatturazione e ai-phone ancora su classi BePork, ma rivestite con `--ga-*` |
| 19 | P3 | Editor menu su `ga-*` | 🟡 | Rivestito con `--ga-*`; conversione completa da fare (modulo condiviso, 137 occorrenze) |
| 20 | P3 | Temi gestione completi per i tenant | 🟡 | Spostati i 4 temi da `admin.css` ai CSS tenant; temi completi per bepork, faak, libritech, studioaranzulla e officinakam da disegnare |
| 21 | P3 | Editor tenant-specifici nelle route comuni | ✅ | Valutato: la route comune che smista verso il componente del tenant (listino → Valentina, agenda/patrimoniale → PynkStudio) è lo stesso schema dei dispatcher in `src/app/`. Nessun import tra tenant, quindi nessuna modifica |
| 22 | — | Test end-to-end con un vero `tenantadmin` e un vero `employee` per ruolo | ⬜ | Sul DB non esiste nessun utente tenant: tocca all'utente crearne uno di prova per ruolo |
| 23 | P1 | Impostazioni sito sul server (`tenant_site_settings`) | 🔵 | Migration `20261003142000`, API pubblica in lettura e API gestione in scrittura, sync automatico dal layout. Da verificare: modifica dal pannello reale e lettura dal sito pubblico in un altro browser. La riga non si crea per casabramanti/studioaranzulla finché mancano in `tenants` |
| 24 | P0 | Demo pura senza accesso ai dati reali | 🔵 | Verificato via HTTP: `ai-phone` e `order-settings` restituiscono i default. Bloccati upload e AI in demo pura; nascosti iscritti fedeltà e newsletter |
| 25 | P2 | Fedeltà su `ga-*`, campi per tipo, nomi clienti negli iscritti | 🔵 | Verificato nel browser: il form premi cambia campi al cambio tipo |
