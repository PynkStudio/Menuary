# Product

## Register

brand

## Users

Titolari e gestori di attività HORECA (ristoranti, pizzerie, trattorie, bar, bistrot, cocktail bar) in Italia e, in prospettiva multi-mercato, in Europa. Persone che vivono in sala e in cucina, non davanti a un gestionale: poco tempo, diffidenti verso le agenzie e i "template", attente al margine. Visitano menuary.it per capire in pochi secondi se questa piattaforma fa sembrare il loro locale *se stesso* e gli toglie lavoro operativo, non per leggere uno spec sheet.

## Product Purpose

Menuary è la piattaforma multi-tenant che dà a ogni locale un sito su misura più un gestionale modulare (menu digitale, prenotazioni, ordini sala/asporto, delivery, magazzino, food cost, CRM) e un'assistente IA che risponde al telefono 24/7. menuary.it è la pagina marketing del verticale food: deve convertire un titolare scettico in una richiesta di demo/contatto, comunicando artigianato e identità (non un template di sistema) e profondità operativa reale. Successo = il visitatore percepisce "questo è fatto per il MIO locale" e arriva alla CTA.

## Brand Personality

Caldo, concreto, sicuro di sé. Voce da artigiano competente, non da reparto marketing: frasi brevi, sostantivi specifici del mestiere ("food cost", "copertura piena", "comande in cucina"), zero buzzword. Editoriale e curato (serif Fraunces + DM Sans, palette rame/oro/salvia su carta), ma con orgoglio di categoria: il tono dice "lavoriamo a ristoranti, uno alla volta", non "soluzione enterprise". Tre parole: artigianale, schietto, fiducioso.

## Anti-references

- Template SaaS generici (hero-metric, card identiche a icona+titolo+testo ripetute all'infinito, gradienti viola-blu).
- L'estetica "AI-editorial slop": eyebrow minuscolo maiuscolo tracciato sopra OGNI sezione, stesso ritmo di titolo su ogni blocco, fade-on-scroll uniforme. Il sito ha già questo difetto e va corretto, non amplificato.
- Costruttori di siti tuttofare impersonali (Wix/un template ristorante qualsiasi): la promessa di Menuary è l'opposto dell'identità intercambiabile.
- Freddezza fintech (navy/oro, densità da dashboard) sulla pagina marketing: qui design È il prodotto, deve scaldare.

## Design Principles

- **Pratica ciò che predichi.** La pagina promette "niente template, identità su misura": deve essere essa stessa distintiva, non un layout riconoscibilmente generico.
- **Mostra il prodotto, non aggettivi.** I mockup concreti (menu live, food cost, trascrizione chiamata IA) convincono più di claim. Tienili reali e specifici.
- **Gerarchia decisa, non piatta.** Pochi momenti grandi che comandano attenzione, molto respiro intorno; evita la scala uniforme "tutto medio".
- **Ritmo, non monotonia.** Alterna pacing (beat chiari/scuri, layout asimmetrici) invece di nove sezioni crema in fila con la stessa griglia di card.
- **Identità prima della moda.** Rame/oro/salvia + Fraunces sono il brand: si amplificano, non si sostituiscono con il trend del momento.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Testo body ≥4.5:1 (attenzione al muted `#69726c` su carta e al testo chiaro su `--menuary-ink`/rame). Ogni animazione deve avere alternativa `prefers-reduced-motion: reduce` e i reveal non devono mai nascondere contenuto di default (la pagina è server-rendered e SEO-critica: il contenuto è visibile senza JS). Sito predisposto multilingua: l'attributo `lang`, i copy e i metadata restano localizzati.
