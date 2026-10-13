---
title: "Le email del beta program PynkStudio finiscono in spam"
module: "pynkstudio-beta"
roles: ["siteadmin"]
tags: ["email", "spam", "resend", "dns", "pynkstudio", "beta"]
last_updated: "2026-10-13"
owner: ""
---

# Sintomo

Le email del beta program di `pynkstudio.eu/beta` — conferma iscrizione, link d'accesso, avviso di nuova beta, approvazione — arrivano nella cartella spam invece che nella posta in arrivo.

# Cause possibili

- **SPF non allineato su `send.pynkstudio.eu`** (dedotto dal DNS il 2026-10-13). Le email partono da Resend con mittente `amministrazione@pynkstudio.eu`; Resend usa `send.pynkstudio.eu` come indirizzo di ritorno e lì si aspetta un MX verso Amazon SES e un TXT `v=spf1 include:amazonses.com ~all`. Il record era invece un CNAME verso `send.forge.rmta.net`, i cui server (`mta1/mta2.forge.rmta.net`) non sono quelli di Resend. Chi gestisca `rmta.net` è **da verificare**: probabilmente un servizio di posta predefinito del registrar (il DNS è su Register.it).
- **Reputazione bassa del dominio**: pochi invii da `pynkstudio.eu`, quindi i primi messaggi sono trattati con più sospetto.
- **DMARC in `p=none`**: corretto per ora, ma non aiuta la reputazione.

La versione testo semplice non è una causa: Resend la genera da sola dall'HTML. Gli avvisi «nuova beta» hanno l'intestazione `List-Unsubscribe` con disiscrizione in un clic (RFC 8058) dal 2026-10-13.

# Verifiche

1. In Gmail apri l'email → menu ⋮ → «Mostra originale»: guarda le righe `SPF`, `DKIM`, `DMARC`. Se SPF è `FAIL` o `SOFTFAIL` la causa è il record di `send`.
2. Controlla il DNS: `send.pynkstudio.eu` deve avere un **MX** verso `feedback-smtp.<regione>.amazonses.com` e un **TXT** `v=spf1 include:amazonses.com ~all`, e **nessun CNAME** (un CNAME impedisce qualunque altro record sullo stesso nome).
3. Nel pannello Resend → Domains → `pynkstudio.eu`: i record SPF devono risultare «Verified».

# Soluzione

Sul pannello DNS di Register.it, sul nome `send`:

1. elimina il CNAME `send → send.forge.rmta.net`;
2. aggiungi l'MX e il TXT mostrati da Resend (Domains → `pynkstudio.eu`, sezione SPF). Copia i valori esatti da lì: la regione nel nome del server MX dipende dalla regione scelta su Resend;
3. in Resend premi «Verify DNS records» e attendi lo stato «Verified»;
4. invia un'email di prova e ricontrolla «Mostra originale».

Lasciare intatti l'MX della radice (`inbound-smtp.eu-west-1.amazonaws.com`, usato per ricevere la posta) e il record `resend._domainkey` (DKIM, già corretto).

# Quando aprire un ticket

Se dopo la correzione del DNS SPF e DKIM risultano `PASS` ma le email continuano a finire in spam per più giorni: è un problema di reputazione o di contenuto, da analizzare con lo staff tecnico (vedi [[escalation-policy]]).
