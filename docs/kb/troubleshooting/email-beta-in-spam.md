---
title: "Le email del beta program PynkStudio finiscono in spam"
module: "pynkstudio-beta"
roles: ["siteadmin"]
tags: ["email", "spam", "resend", "tracking", "pynkstudio", "beta"]
last_updated: "2026-10-13"
owner: ""
---

# Sintomo

Le email del beta program di `pynkstudio.eu/beta` — conferma iscrizione, link d'accesso, avviso di nuova beta, approvazione — arrivano nella cartella spam invece che nella posta in arrivo.

# Cause possibili

- **Tracciamento di aperture e clic attivo sul dominio** (Resend → Domains → `pynkstudio.eu` → «Enable Tracking», verificato il 2026-10-13). Il tracciamento è per dominio: vale per ogni email inviata da `pynkstudio.eu`. Il link d'accesso viene riscritto su `links.pynkstudio.eu` e l'email riceve un pixel di apertura. Resend sconsiglia il tracciamento per le email di accesso e verifica perché peggiora il recapito.
- **Reputazione bassa del dominio**: pochi invii da `pynkstudio.eu`, quindi i primi messaggi sono trattati con più sospetto.
- **DMARC in `p=none`**: corretto per ora, ma non aiuta la reputazione.

Non sono cause:
- **DNS di invio**: `send` e `rsend` puntano a `*.forge.rmta.net`, che è l'infrastruttura di Resend; DKIM, SPF, MX e tracking risultano tutti «Verified» su Resend (2026-10-13).
- **Versione testo semplice**: Resend la genera da sola dall'HTML.
- **Disiscrizione**: gli avvisi «nuova beta» hanno `List-Unsubscribe` con disiscrizione in un clic (RFC 8058) dal 2026-10-13.

# Verifiche

1. In Gmail apri l'email → menu ⋮ → «Mostra originale»: `SPF`, `DKIM` e `DMARC` devono essere `PASS`. Se lo sono, la causa non è l'autenticazione.
2. Nell'email, passa il mouse sul bottone: se il link inizia con `links.pynkstudio.eu` il tracciamento dei clic è attivo.
3. Resend → Domains → `pynkstudio.eu` → sezione tracking: stato dei tracciamenti aperture e clic.

# Soluzione

Disattivare il tracciamento di aperture e clic per le email transazionali. Poiché in Resend è un'impostazione **per dominio**, le strade sono due:

1. **Disattivarlo su `pynkstudio.eu`**: risolve subito, ma spegne anche le statistiche di apertura/clic per tutto ciò che parte da quel dominio (incluse eventuali campagne della posta che le usano — **da verificare** se `email_tracking_events` viene usato).
2. **Separare gli invii**: un sottodominio dedicato alle transazionali (es. `mail.pynkstudio.eu`) verificato su Resend senza tracciamento, e il codice del beta program che invia da lì; il tracciamento resta su `pynkstudio.eu` per il marketing.

# Quando aprire un ticket

Se senza tracciamento e con SPF/DKIM/DMARC in `PASS` le email continuano a finire in spam per più giorni: è un problema di reputazione o di contenuto, da analizzare con lo staff tecnico (vedi [[escalation-policy]]).
