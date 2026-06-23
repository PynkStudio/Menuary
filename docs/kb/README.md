# Knowledge Base (KB)

Questa cartella è la **fonte primaria di conoscenza** per l'assistente AI di supporto clienti che opera via WhatsApp (modulo `aiWhatsapp`). È progettata per essere leggibile dalle persone e indicizzabile da un sistema RAG.

## Regole della KB

- Ogni documento di contenuto ha **frontmatter YAML** (`title`, `module`, `roles`, `tags`, `last_updated`, `owner`) seguito dalle **sezioni standard** del tipo di documento.
- Usa i template in `templates/` per creare nuovi documenti — non cambiare i nomi delle sezioni standard (servono per il chunking RAG, vedi [[rag-indexing]]).
- **Nessun segreto** e nessun dato specifico di un tenant nella KB: è documentazione di prodotto condivisa.
- Quando non sei certo di un'informazione, scrivila come "Da verificare" anziché inventarla.

## Struttura

| Cartella | Contenuto | Template |
|---|---|---|
| `modules/` | Schede dei moduli della piattaforma | [[kb-module-template]] |
| `procedures/` | Procedure operative passo-passo | [[kb-procedure-template]] |
| `troubleshooting/` | Risoluzione problemi per sintomo | [[kb-troubleshooting-template]] |
| `faq/` | Domande frequenti, una per file | [[kb-faq-template]] |
| `glossary/` | Termini e definizioni della piattaforma | — |
| `templates/` | Modelli riutilizzabili (esclusi dall'indice RAG) | — |
| `ai-support/` | Comportamento dell'assistente: policy, ticket, indicizzazione | — |

## Documenti chiave dell'assistente

- [[escalation-policy]] — quando l'assistente risponde, chiede chiarimenti o escala.
- [[ticket-template]] — campi minimi del ticket generato in escalation.
- [[rag-indexing]] — come la KB diventa interrogabile (sync → chunk → embeddings → Supabase → query).
