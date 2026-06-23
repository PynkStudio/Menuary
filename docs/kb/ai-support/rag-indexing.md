---
title: "Indicizzazione RAG della knowledge base"
module: "aiWhatsapp"
roles: ["tenant_admin"]
tags: ["ai-support", "rag", "embeddings", "supabase", "indexing"]
last_updated: "2026-06-23"
owner: ""
---

# Scopo

Descrive **come** la knowledge base in `docs/kb/` viene resa interrogabile dall'assistente AI di supporto via WhatsApp tramite una pipeline RAG (Retrieval-Augmented Generation).

> Questo documento descrive il **disegno** della pipeline. Non implementa codice. I dettagli implementativi concreti (nomi tabella, modello di embedding, schedulazione) sono **da confermare** in fase di sviluppo.

# Pipeline end-to-end

```
docs/kb/ (Markdown + frontmatter)
   │  1. Sincronizzazione dalla repository
   ▼
Documenti normalizzati
   │  2. Chunking
   ▼
Chunk + metadati
   │  3. Embeddings
   ▼
Vettori
   │  4. Salvataggio su Supabase
   ▼
Indice vettoriale
   │  5. Interrogazione dall'assistente WhatsApp
   ▼
Risposta fondata sulla KB (o escalation)
```

# 1. Sincronizzazione dalla repository

- La fonte di verità è la cartella `docs/kb/` versionata in repo.
- Ad ogni aggiornamento della documentazione (vedi la regola di sync in `CLAUDE.md`), la KB va re-indicizzata.
- Si indicizzano i documenti di contenuto (`modules/`, `procedures/`, `troubleshooting/`, `faq/`, `ui/`, `glossary/`) e le policy in `ai-support/`. I file `templates/` sono **esclusi** dall'indice.
- Il frontmatter YAML (`title`, `module`, `roles`, `tags`, `last_updated`, `owner`) viene estratto e conservato come **metadati** del documento.
- **Da confermare**: meccanismo di trigger (CI on push, cron, comando manuale) e gestione del versionamento/diff per re-indicizzare solo ciò che è cambiato.

# 2. Suddivisione in chunk

- Ogni documento viene diviso in chunk coerenti, preferibilmente lungo i confini delle **sezioni standard** (es. `# Scopo`, `# Procedura passo-passo`, `# Sintomo`).
- Ogni chunk eredita i metadati del documento (modulo, ruoli, tag, titolo, percorso file, sezione).
- Obiettivo: chunk autosufficienti, abbastanza piccoli da essere precisi ma con contesto sufficiente a essere utili da soli.
- **Da confermare**: dimensione target del chunk e overlap.

# 3. Conversione in embeddings

- Ogni chunk viene convertito in un vettore tramite un modello di embedding.
- Va fissato un **unico modello** per indicizzazione e query (devono usare lo stesso spazio vettoriale).
- **Da confermare**: provider/modello di embedding e dimensione del vettore.

# 4. Salvataggio su Supabase

- I chunk, i loro metadati e i vettori vengono salvati su **Supabase** (il datastore della piattaforma).
- Ricerca per similarità tramite l'estensione **pgvector** (da abilitare se non presente).
- I metadati permettono filtri a livello di query (es. per `module`, per `roles`).
- **Isolamento**: la KB è documentazione di prodotto condivisa, non dati di tenant. Nessun dato specifico del tenant entra nell'indice. (Coerente con le regole di isolamento dati in `CLAUDE.md`.)
- **Da confermare**: nome tabella/e, schema esatto, indici, eventuale RLS.

# 5. Interrogazione dall'assistente WhatsApp

- L'assistente opera nel modulo `aiWhatsapp`; il canale operativo WhatsApp è documentato in `TENANT_CUSTOMER_SERVICE_WHATSAPP.md` (endpoint `POST /api/webhooks/whatsapp/tenant-support`). **Da verificare** il punto esatto in cui si innesta il retrieval.
- Flusso a runtime:
  1. Il messaggio dell'utente viene convertito in embedding con lo stesso modello del punto 3.
  2. Ricerca dei chunk più simili in Supabase (eventualmente filtrati per `roles`/`module`).
  3. I chunk recuperati vengono forniti come contesto al modello che redige la risposta.
  4. La risposta deve basarsi **solo** sui chunk recuperati (vedi [[escalation-policy]]).
  5. Se il retrieval non restituisce contesto sufficiente, scatta l'**escalation** con generazione ticket ([[ticket-template]]).

# Buone pratiche per documenti ben indicizzabili

- Scrivi sezioni autosufficienti: un chunk deve avere senso anche estratto dal resto.
- Usa le sezioni standard dei template senza rinominarle.
- Tieni il frontmatter completo e aggiornato (`module`, `roles`, `tags`, `last_updated`).
- Formula le FAQ con la domanda nel linguaggio reale dell'utente.
- Evita riferimenti impliciti ("come visto sopra"): preferisci link espliciti `[[...]]`.

# Documentazione correlata

- [[escalation-policy]]
- [[ticket-template]]
- [[integrazioni-attive]]
