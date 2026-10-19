---
title: "Pannello Gestione — schermata Ordini"
module: "takeaway"
roles: ["tenant_admin"]
tags: ["ui", "gestione", "ordini"]
route: "/gestione/[tenantSlug]/ordini"
source: "src/app/gestione/[tenantSlug]/ordini/page.tsx, src/i18n/gestione.ts (orders), src/components/gestione/order-cancel-form.tsx"
last_updated: "2026-10-19"
owner: ""
---

# A cosa serve la schermata

Mostra la **coda live degli ordini** (sala, asporto e kiosk) e permette di cambiarne lo stato con un click; il cliente vede la conferma. Intestazione: «Ordini» — sottotitolo «Coda live di sala, asporto e kiosk. Cambia stato con un click: il cliente vede la conferma.»

# Come arrivarci

1. Apri il pannello **Gestione** (`gestione.<dominio-tenant>` o, in demo, `demo.<verticale>/<slug>/gestione`).
2. Nel menu laterale premi **«Ordini»**.
3. La voce è visibile solo se il modulo ordini è attivo per il tenant (vedi [[gestione-navigazione]]).

# Elementi della schermata

- **Intestazione** con titolo «Ordini» e pulsante **«Impostazioni»**, visibile solo al titolare (apre **Regole ordini**, `/ordini/impostazioni`, che si trova anche nel menu sotto **Impostazioni**).
- **Barra filtri** («Filtra ordini») per restringere la coda.
- **Lista ordini**: ogni riga mostra il **cliente** («Cliente»), il **tipo** (Asporto / Sala / Mangia qui / Delivery), l'orario di ritiro/consegna, i **dati cliente** (Telefono, Indirizzo) e i pulsanti azione.
- Sugli ordini in attesa può comparire un **timer** («{n}s al timeout»).
- Se non ci sono ordini nell'intervallo: «Nessun ordine in questo intervallo.»

# Pulsanti e azioni

Etichette esatte dell'interfaccia (italiano):

| Etichetta UI | Cosa fa | Dove si trova |
|---|---|---|
| **Impostazioni** | Apre le impostazioni degli ordini | In alto nell'intestazione |
| **Conferma** | Accetta un ordine «Da confermare» | Sulla riga dell'ordine |
| **Rifiuta** | Rifiuta un ordine in arrivo | Sulla riga dell'ordine |
| **In preparazione** | Segna l'ordine come in preparazione | Sulla riga dell'ordine |
| **Pronto** *(Marca pronto)* | Segna l'ordine come pronto | Sulla riga dell'ordine |
| **Consegnato** | Segna l'ordine come consegnato | Sulla riga dell'ordine |
| **Annulla ordine** | Apre il riquadro di annullamento: **Motivo (facoltativo)** tra «Fuori area di consegna», «Ordine finto», «Prodotti esauriti», «Richiesta del cliente», «Altro», una **Nota (facoltativa)** e il pulsante **«Conferma annullamento»** («Indietro» per chiudere) | Sulla riga degli ordini Nuovo, In preparazione e Pronto |

## Annullare un ordine

- Se il locale ha un tempo limite per annullare (es. Kimos: **5 minuti** dalla ricezione), sul pulsante compare il tempo rimasto (es. «Annulla ordine · 3:42»). Allo scadere il pulsante sparisce e compare «Tempo per annullare scaduto».
- Il motivo non è obbligatorio, ma aiuta: lo vede anche il team Menuary per migliorare l'assistente telefonico, e un ordine telefonico annullato dal locale non fa pagare la chiamata.
- Il cliente riceve il messaggio di annullamento, tranne quando il motivo è «Ordine finto». Con «Fuori area di consegna» o «Prodotti esauriti» il messaggio spiega il perché.
- Nello **Storico** gli ordini annullati mostrano «Annullato: <motivo> · <nota>».

# Campi e filtri

Filtri disponibili sulla coda: **Coda live**, **Da confermare**, **Nuovi**, **In preparazione**, **Pronti**, **Asporto**, **Sala**, **Storico**, **Tutti**.

Tipi di ordine mostrati: **Asporto**, **Sala**, **Mangia qui**, **Delivery**.

# Stati possibili

| Stato (UI) | Significato |
|---|---|
| **Da confermare** | In attesa di accettazione |
| **Nuovo** | Accettato, non ancora avviato |
| **In preparazione** | In lavorazione |
| **Pronto** | Pronto per ritiro/consegna |
| **Consegnato** | Completato |
| **Annullato** | Annullato manualmente |
| **Scaduto** | Timeout di conferma superato |

# Procedure correlate

- [[gestione-navigazione]]

# Riferimenti nel codice (manutenzione)

- Pagina: `src/app/gestione/[tenantSlug]/ordini/page.tsx` (mostra la stessa coda di `src/app/operativo/[tenantSlug]/ordini/page.tsx`, sulla sede attiva della gestione)
- Impostazioni: `src/app/gestione/[tenantSlug]/ordini/impostazioni/page.tsx`
- Etichette, filtri, stati e azioni: `src/i18n/gestione.ts` → oggetto `orders`
- API ordini: `src/app/api/orders/*`
