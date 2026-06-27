# UI — KB

Documentazione delle **schermate dell'interfaccia**, pensata perché l'assistente AI possa dire all'utente *quale pulsante premere e dove trovarlo*.

Ogni scheda descrive una schermata: come arrivarci (percorso di navigazione), cosa contiene, e la tabella **«Pulsanti e azioni»** con le etichette **esatte** dell'interfaccia.

- Template: [[kb-ui-screen-template]]
- Pannello principale documentato: **Gestione** (il back-office del tenant). Mappa generale: [[gestione-navigazione]].

## Regole specifiche per la doc UI

- Le **etichette** dei pulsanti/menu devono coincidere parola per parola con quelle reali dell'interfaccia. La lingua predefinita è l'**italiano**; il pannello è multilingua, quindi indica che le etichette possono variare per lingua.
- Includi sempre il blocco **«Riferimenti nel codice»** con i file che generano la schermata e le etichette (`src/app/...`, `src/i18n/...`): è ciò che permette di tenere la doc allineata quando l'UI cambia.
- Documenta solo ciò che esiste nel codice. Se un controllo dipende da un permesso o da un feature-flag, dillo.

## Manutenzione

Quando cambia un'etichetta, una route o un pulsante nel codice (es. in `src/i18n/gestione.ts` o nelle pagine `src/app/gestione/...`), **aggiorna la scheda UI corrispondente nello stesso intervento** — vedi la regola di sincronizzazione in `CLAUDE.md`.

## Schede disponibili

- [[gestione-navigazione]] — mappa completa del menu del pannello Gestione.
- [[gestione-ordini]] — schermata Ordini (esempio completo).
- [[posta-admin-gestione]] — schermata Posta per admin piattaforma e tenant.
- [[gestione-stampanti-comande]] — schermata Stampanti comande (in Cassa).
