# Decisioni Architetturali (ADR)

Registro delle decisioni tecniche e architetturali significative, con contesto, alternative valutate e motivazioni.

## Cosa inserire qui

- Architecture Decision Records (ADR)
- Decisioni tecniche rilevanti con motivazione
- Trade-off valutati e alternative scartate

## Convenzione

Usa il template [[adr-template]] per ogni nuova decisione. Numera i file progressivamente: `0001-titolo-decisione.md`.

## Registro

| ADR | Titolo |
|---|---|
| 0001 | [[adr-0001-route-module-gating]] |
| 0002 | [[adr-0002-valentina-book-shell]] — il sito `valentina-orciuoli` è un libro sfogliabile (parzialmente sostituita da 0005) |
| 0003 | [[adr-0003-blog-contenuto-tiptap-multilingua]] — contenuto del blog come documento Tiptap per lingua |
| 0004 | [[adr-0004-mcp-tenant-blog]] — server MCP per tenant per la redazione del blog |
| 0005 | [[adr-0005-valentina-blog-fuori-dal-libro]] — il blog di valentina-orciuoli vive fuori dal libro, sullo stesso dominio *(§5 superata dalla 0006)* |
| 0006 | [[adr-0006-valentina-taccuino-nel-libro]] — il taccuino torna una pagina del volume; dentro il libro si naviga con la cronologia, non col router |
| 0007 | [[adr-0007-valentina-dominio-custom]] — il sito-libro su `valentinaorciuoli.it`: le route `[previewSlug]` servono due superfici, il prefisso si legge dal pathname *(chiude la coda della 0005)* |
| 0008 | [[adr-0008-ownership-proprieta-seo-ads]] — ownership PynkStudio/cliente per SEO e Ads, multi-piattaforma *(proposta, elenco tenant e forma del registro da confermare)* |
| 0009 | [[adr-0009-valentina-opere-per-collana]] — il volume raccoglie le opere per collana; il taccuino segue il flag del modulo *(rivede l'impaginazione delle opere della 0002)* |
| 0010 | [[adr-0010-informativa-per-moduli-attivi]] — privacy e cookie policy si compongono sui moduli accesi del tenant |
