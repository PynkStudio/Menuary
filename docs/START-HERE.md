# Menuary — Documentazione di progetto

Benvenuto nella documentazione della piattaforma Menuary. Questa vault Obsidian raccoglie visione, architettura, decisioni e processi del progetto.

## Da dove iniziare

Ordine di lettura consigliato (i primi tre vivono nella **root** della repo, fonti autorevoli):

1. **`CLAUDE.md`** (root) — regole operative per IA e sviluppatori. Leggilo per primo.
2. **`README.md`** (root) — panoramica, stack, avvio, regole d'oro.
3. **`ARCHITECTURE.md`** (root) — architettura tecnica estesa.

Poi le sintesi navigabili in questa vault:

4. [[panoramica-prodotto]] — cos'è Menuary, verticali, pubblico.
5. [[panoramica-tecnica]] — stack e modello multi-tenant (sintesi di `ARCHITECTURE.md`).
6. [[moduli-piattaforma]] — catalogo moduli.
7. [[integrazioni-attive]] — servizi esterni collegati.

## File compilati (dedotti dal codice)

Documenti già popolati a partire dai file della repo:

- [[panoramica-prodotto]] — `docs/00-vision/`
- [[tenant-e-verticali]] — `docs/01-business/`
- [[panoramica-tecnica]] — `docs/02-architecture/`
- [[moduli-piattaforma]] — `docs/03-features/`
- [[integrazioni-attive]] — `docs/06-integrations/`
- [[endpoint-ia]] — `docs/07-prompts/`
- [[cron-e-processi]] — `docs/08-processes/`

> Ogni file separa esplicitamente ciò che è **dedotto dal codice** da ciò che è **da confermare**.

## Sezioni ancora da popolare

Non compilate perché **non deducibili con certezza** dalla repo (nessun contenuto inventato):

- `04-decisions/` — [[adr-0001-route-module-gating]] (redirect alla home per route di modulo non attivo). Usa [[adr-template]] per i futuri.
- `05-roadmap/` — nessuna roadmap certa nel codice (non inventata).
- `09-meetings/` — nessun verbale presente. Usa [[meeting-template]].

## Mappa delle sezioni

| Cartella | Contenuto |
|---|---|
| [[docs/00-vision/README\|00-vision]] | Visione e obiettivi di prodotto |
| [[docs/01-business/README\|01-business]] | Modello di business, pricing, go-to-market |
| [[docs/02-architecture/README\|02-architecture]] | Architettura tecnica, schema DB, infrastruttura |
| [[docs/03-features/README\|03-features]] | Specifiche delle feature |
| [[docs/04-decisions/README\|04-decisions]] | Architecture Decision Records |
| [[docs/05-roadmap/README\|05-roadmap]] | Roadmap e milestone |
| [[docs/06-integrations/README\|06-integrations]] | Integrazioni con servizi esterni |
| [[docs/07-prompts/README\|07-prompts]] | Prompt e configurazioni agenti IA |
| [[docs/08-processes/README\|08-processes]] | Procedure operative |
| [[docs/09-meetings/README\|09-meetings]] | Verbali e note meeting |
| [[docs/kb/README\|kb]] | Knowledge base per l'assistente AI di supporto (RAG) |

## Knowledge Base per l'assistente AI

La cartella `docs/kb/` è la fonte primaria di conoscenza dell'assistente AI di supporto via WhatsApp. Vedi [[docs/kb/README|kb/README]]. Documenti chiave:

- [[escalation-policy]] — quando l'assistente risponde, chiede chiarimenti o escala.
- [[ticket-template]] — campi del ticket generato in escalation.
- [[rag-indexing]] — pipeline sync → chunk → embeddings → Supabase → query.
- [[gestione-navigazione]] — mappa del pannello Gestione (UI): dove premere per ogni sezione.

## Template disponibili

Per creare nuovi documenti, usa i template in `docs/templates/`:

- [[adr-template]] — Decisione architetturale
- [[feature-template]] — Specifica di una feature
- [[meeting-template]] — Verbale di un meeting
- [[integration-template]] — Documentazione di un'integrazione
- [[process-template]] — Procedura operativa

## Convenzioni

- **Nomi file:** minuscoli, separati da trattini (`nome-del-documento.md`)
- **ADR:** numerati progressivamente (`0001-titolo.md`)
- **Meeting:** con data (`YYYY-MM-DD-argomento.md`)
- **Link:** usa la sintassi `[[nome file]]` di Obsidian per collegare i documenti tra loro
