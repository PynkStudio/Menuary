# ADR-0014: Accesso alla gestione da un'unica tabella di sezioni e ruoli

- **Stato:** accettata
- **Data:** 2026-10-03
- **Autore:** audit gestione (vedi [[audit-gestione]])

## Contesto

Fino al 2026-10-03 il pannello `gestione` controllava gli accessi in tre posti scollegati:

- la navigazione (`gestione-shell.tsx`) nascondeva le voci in base a moduli e ruolo;
- le pagine controllavano quasi solo il modulo, a volte leggendo il registry statico e a volte il DB;
- le API controllavano solo che l'utente fosse membro del tenant, senza ruolo.

Di conseguenza un cameriere o un account kiosk poteva aprire a mano pagine e API riservate al titolare. Alcune voci di menu portavano a un 404, mentre pagine di moduli spenti restavano raggiungibili. La demo con backend live, inoltre, apriva le API reali a chiunque.

## Decisione

1. **Una sola tabella delle sezioni**: `src/lib/gestione-sections.ts` (`GESTIONE_SECTIONS`). Per ogni sezione indica percorso, gruppo di menu, modulo richiesto e requisito di ruolo. La navigazione e i guard delle pagine leggono da qui.
2. **Requisiti di ruolo espliciti** (`GestioneRequirement`):
   - `member`: qualunque membro, account dispositivo compresi (coda ordini, cucina, stampa);
   - `staff`: membro umano;
   - `admin`: titolare o siteadmin;
   - una capability di `StoreCapabilities` (`can_edit_menu`, `can_cassa`, …).
3. **Un solo controllo lato server**:
   - `requireGestione(tenant, need)` in `src/lib/gestione-auth.ts` per API e server action;
   - `requireGestioneSection(tenant, key)` in `src/lib/gestione-page.ts` per le pagine. Legge il tenant dal DB, poi verifica modulo e ruolo e risponde 404 se manca qualcosa.
4. **Ruoli dispositivo senza capability**: `getEffectiveCapabilities()` non restituisce più accesso pieno per i ruoli `kiosk` e `kitdisplay` né per i ruoli sconosciuti.
5. **Demo pubblica**:
   - in demo pura (fixture) le API non leggono né scrivono dati reali, non caricano file e non chiamano l'AI;
   - la modalità backend live dura 15 minuti (`tenant_demo_controls.backend_live_until`) e poi si spegne da sola;
   - anche in backend live contratti, fatture e iscritti restano esclusi.

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Lasciare i controlli in ogni file | Nessun refactor | Regole divergenti: è la causa dei problemi trovati |
| Policy RLS al posto dei controlli applicativi | Difesa nel DB | Quasi tutta la gestione usa il service role; servirebbe riscrivere l'accesso ai dati |
| Middleware sulle route `/gestione` | Un solo punto | Non conosce modulo e ruolo senza query al DB a ogni richiesta; le API restano scoperte |

## Conseguenze

- Una nuova pagina di gestione va aggiunta a `GESTIONE_SECTIONS` e chiama `requireGestioneSection()`. Una nuova API chiama `requireGestione()` con il requisito minimo e gestisce `auth.isDemo` prima di toccare il DB.
- La navigazione è a gruppi (Oggi, Offerta, Clienti e crescita, Canali, Impostazioni): sidebar su desktop, drawer su mobile. Le etichette stanno in `src/i18n/gestione.ts`, blocco `navigation`.
- La voce "Ordini" apre la coda ordini (stessa pagina del portale operativo); le impostazioni ordini sono "Regole ordini".
- Da verificare: il comportamento con utenti `tenantadmin`/`employee` reali. Al 2026-10-03 nessuno è registrato sul DB.

## Riferimenti

- [[audit-gestione]]
- [[gestione-navigazione]]
- Migration `supabase/migrations/20261003140000_gestione_security_hardening.sql`, `20261003141000_demo_backend_live_expiry.sql`
