---
title: "Template ticket di supporto (generato in escalation)"
module: "aiWhatsapp"
roles: ["tenant_admin"]
tags: ["ai-support", "ticket", "escalation"]
last_updated: "2026-06-23"
owner: ""
---

# Scopo

Definisce i **campi minimi** che l'assistente AI deve compilare quando, in base alla [[escalation-policy]], genera automaticamente un ticket di supporto da consegnare a un operatore umano.

# Quando si genera

Un ticket viene creato ogni volta che scatta una condizione di escalation descritta in [[escalation-policy]].

# Campi minimi del ticket

| Campo | Descrizione | Obbligatorio |
|---|---|---|
| `tenant` | Identificativo del tenant (es. `bepork`) | Sì |
| `utente` | Identità dell'utente che ha scritto (nome/ID `tenant_admin`) | Sì |
| `contatto` | Recapito per il follow-up (numero WhatsApp, email) | Sì |
| `categoria` | Classificazione del problema (vedi sotto) | Sì |
| `priorità` | Livello di urgenza (vedi sotto) | Sì |
| `riepilogo_problema` | Sintesi chiara del problema in linguaggio naturale | Sì |
| `cronologia_conversazione` | Trascrizione dei messaggi scambiati con l'assistente | Sì |
| `documentazione_consultata` | Elenco dei documenti `docs/kb/` usati dall'assistente nel tentativo di risposta | Sì |
| `motivazione_escalation` | Quale condizione di [[escalation-policy]] ha attivato l'escalation | Sì |

# Categorie suggerite

Allineate alle condizioni di escalation:

- `documentazione_mancante`
- `bug`
- `fatturazione`
- `integrazioni_esterne`
- `accesso_dati_tenant`
- `richiesta_umana`
- `altro`

# Priorità suggerite

- `urgente` — il tenant è bloccato nell'operatività (es. non riceve ordini/prenotazioni, pagamenti non funzionanti).
- `alta` — funzionalità importante non disponibile, ma esiste un workaround.
- `media` — problema non bloccante.
- `bassa` — domanda informativa o miglioria.

> Le soglie precise di priorità sono **da confermare** con il team di supporto.

# Esempio di ticket compilato (illustrativo)

```yaml
tenant: bepork
utente: "Mario Rossi (tenant_admin)"
contatto: "+39 333 1234567"
categoria: integrazioni_esterne
priorità: alta
riepilogo_problema: "I pagamenti online non vengono accettati al checkout."
cronologia_conversazione: "<trascrizione messaggi>"
documentazione_consultata:
  - "docs/kb/troubleshooting/<slug>.md"
  - "docs/kb/modules/<slug>.md"
motivazione_escalation: "Il problema riguarda un'integrazione esterna (pagamenti)."
```

# Documentazione correlata

- [[escalation-policy]]
- [[rag-indexing]]
