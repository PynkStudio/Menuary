---
title: "Componi il piatto"
module: "dish-builder"
roles: ["tenant_admin"]
tags: ["menu", "ordini", "pizza", "burger", "poke", "pasta", "personalizzazione"]
last_updated: "2026-11-10"
owner: ""
---

# Descrizione

**Componi il piatto** permette al cliente di costruire da sé una pizza, un burger, una poke o un piatto di pasta. Tocca gli ingredienti, li vede comparire sul piatto con un'animazione, il prezzo si aggiorna subito e alla fine aggiunge il piatto all'ordine. Serve ai locali che vendono prodotti componibili e vogliono un'esperienza più coinvolgente del classico elenco di extra.

# Funzionalità

- Scelte iniziali del piatto, ad esempio taglia (S/M/L), base rossa o bianca, tipo di pane, formato di pasta. Possono cambiare il prezzo.
- Ingredienti divisi in gruppi (formaggi, salumi, verdure, salse…), ognuno con il proprio prezzo.
- Porzione doppia: toccando due volte lo stesso ingrediente si aggiunge una seconda porzione, segnata «x2».
- Limiti per gruppo (es. «massimo 2 proteine») e gruppi obbligatori (es. «almeno un patty»): se manca qualcosa il pulsante d'ordine lo segnala.
- Pulsanti **Annulla** (torna indietro di un passo) e **Svuota** (toglie tutti gli ingredienti).
- Nel carrello e in comanda il piatto arriva con le scelte e l'elenco degli ingredienti, ad esempio «salame piccante x2, funghi».
- Grafica a colori e font del locale; con le foto ritagliate degli ingredienti il piatto ha un aspetto fotografico.

# Permessi richiesti

- Modulo **Componi il piatto** (`dishBuilder`) attivo nel pannello moduli; le ricette le configura il team Menuary.
- Per ricevere ordini serve un modulo d'ordine attivo (`takeaway`, `tableOrders` o `shop`) e un prodotto «piatto componibile» nel menu del locale.

# Flussi operativi

1. Il cliente apre la pagina «Componi la tua pizza» (o burger, poke, pasta) dal sito del locale.
2. Sceglie taglia e base, poi tocca gli ingredienti; per toglierne uno usa il «−» sulla tessera.
3. Tocca **Aggiungi all'ordine**: il piatto entra nel carrello con il prezzo calcolato.

# Limitazioni

- Ricette, ingredienti e prezzi non sono ancora modificabili dal pannello `gestione`: per cambiarli bisogna chiedere al team Menuary.
- Nel menu online compare il riquadro «Componi la tua pizza» che porta alla pagina di composizione.
- Interfaccia disponibile in italiano, inglese, spagnolo, francese e tedesco (se il sito del locale pubblica quella lingua).
- Toccando la «i» su un ingrediente si vedono dettagli e allergeni.
- Esempio di prova (senza ordini reali): `/componi-demo` sul sito Menuary.

# FAQ correlate

- Da scrivere.
