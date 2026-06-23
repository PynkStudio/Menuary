---
title: ""
module: ""
roles: ["tenant_admin"]
tags: ["ui"]
route: ""            # es. /gestione/[tenantSlug]/ordini
source: ""           # file/componente che genera la schermata, per manutenzione
last_updated: "YYYY-MM-DD"
owner: ""
---

# A cosa serve la schermata

Cosa permette di fare questa schermata, in una frase orientata all'utente.

# Come arrivarci

Percorso di navigazione **esatto**, come lo vede l'utente:

1. Apri il pannello **Gestione** (`gestione.<dominio-tenant>` o, in demo, `demo.<verticale>/<slug>/gestione`).
2. Nel menu laterale premi **«Etichetta voce di menu»**.
3. (Eventuali tab/sotto-pagine: premi **«…»**.)

> Indica sempre l'etichetta **esatta** come appare nell'interfaccia (lingua predefinita: italiano). Se la voce è visibile solo con un permesso/modulo, dillo qui.

# Elementi della schermata

Descrizione dei blocchi principali che l'utente vede (intestazione, lista, filtri, schede, ecc.), così l'assistente può orientarlo ("in alto a destra", "nella riga dell'ordine", …).

# Pulsanti e azioni

Tabella dei controlli cliccabili. **L'etichetta deve coincidere con quella reale dell'UI.**

| Etichetta UI | Cosa fa | Dove si trova |
|---|---|---|
| «…» | … | … |

# Campi e filtri

Filtri, campi di input e selettori presenti, con i valori possibili.

# Stati possibili

Se la schermata mostra stati (es. di un ordine, di una prenotazione), elencali con l'etichetta esatta e il significato.

# Procedure correlate

- [[slug-procedura]]

# Riferimenti nel codice (manutenzione)

Per chi aggiorna la doc: file che definiscono schermata ed etichette (route page, componente, file i18n). Non per l'utente finale.

- Route: `src/app/...`
- Etichette: `src/i18n/...`
