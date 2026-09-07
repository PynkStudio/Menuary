# ADR-0009: Il volume raccoglie le opere per collana, non una pagina per libro

- **Stato:** accettata
- **Data:** 2026-09-07
- **Autore:** Massimo Pernozzoli (con Claude)

## Contesto

[[adr-0002-valentina-book-shell]] dava a **ogni opera** una doppia pagina propria, generata
dal catalogo di gestione (`workSpreads` in `book-map.ts`). Sfogliando, il volume presentava
quindi Anxiety, Fury e *Tra fumo e ombre* uno dopo l'altro, tutti con la stessa testatina e
lo stesso occhiello **"The Emotion Dragons"**.

Il difetto è editoriale, non tecnico: *Tra fumo e ombre* è un thriller psicologico e non
appartiene alla saga dei dragoni. Impaginato come quarta scheda di fila sotto l'occhiello
della trilogia, il libro veniva letto come il volume successivo di una serie a cui non
appartiene — l'esatto contrario del posizionamento che l'autrice vuole. Nello stesso elenco
mancava del tutto il terzo volume della trilogia, che non è ancora un libro (non ha ISBN,
copertina né riga in gestione) e quindi non poteva avere una pagina: la trilogia si
presentava con due volumi.

In parallelo il modulo blog è stato spento per questo tenant: il taccuino non ha ancora
appunti da pubblicare, e una sezione vuota in menu vale meno di una sezione assente.

## Decisione

### 1. Due pagine di collana al posto di N pagine di opera

`voSpreads` non genera più una doppia pagina per riga di catalogo. Il volume ha due sezioni
fisse:

| Spread | Path | Contenuto |
|---|---|---|
| `trilogia` | `/trilogia` | i volumi della trilogia, tutti sulla stessa facciata, con le proprie CTA |
| `thriller` | `/thriller` | *Tra fumo e ombre*, con il proprio occhiello «Thriller psicologico · in arrivo» |

Lo smistamento vive in `content.ts` (`valentinaWorkSection()`): dipende dall'opera, quindi
un titolo aggiunto domani in gestione sa da sé in quale delle due sezioni finisce.

L'indice (`/libri`) nomina le **collane**, non i titoli: due voci con il proprio folio.

### 2. Il terzo volume è un annuncio, non una scheda

`valentinaUpcomingVolume` in `content.ts` tiene il posto di *Il Terzo Canto* nella pagina
della trilogia: numerazione romana, titolo, una riga e lo stato «In arrivo», senza copertina
né link. Non è una riga di gestione perché non è ancora un libro — e una trilogia che ne
mostra due non si capisce.

### 3. I vecchi indirizzi delle opere restano validi

`/anxiety`, `/fury`, `/tra-fumo-e-ombre` sono già stati condivisi. La route
`[previewSlug]/[bookId]` li riconosce e **rimanda** alla sezione giusta, conservando host
(preview o dominio custom) e lingua. Restano fuori dalla sitemap: l'indirizzo canonico è
quello della collana.

### 4. Il taccuino segue il flag del modulo

La doppia pagina del blog esiste in `voSpreads` **solo se** `features.blog` è acceso per il
tenant. Spenta, non si incontra sfogliando, non compare in menu, non entra in sitemap e la
rilegatura si accorcia di un foglio. La voce di menu si chiama ora **«Dal taccuino»**, come
la testatina. Riaccendere il flag rimette la sezione al suo posto, **dopo gli eventi**.

### 5. Due difetti dello sfogliare, con la stessa radice: la profondità del foglio

- **Il lampo di fine giro.** `clearGesture()` riavvolgeva i tre `MotionValue` a zero. Sono
  scritture immediate, mentre lo smontaggio del foglio passa da un render: per un fotogramma
  il foglio appena posato tornava spalancato a destra mostrando il proprio *recto*, cioè la
  pagina da cui si era appena partiti. Il riavvolgimento non serviva — ogni gesto porta il
  suo foglio al capo giusto prima di muoverlo — ed è stato tolto.
- **La pagina precedente che ritagliava il foglio sollevato.** La `z` del foglio andava da
  `+depth` a `-depth`: giusto **andando avanti**, dove il foglio si posa a sinistra sopra
  una pagina che porta lo stesso contenuto. Tornando indietro no: lì il foglio viene
  *sollevato* dalla pila di sinistra e sotto c'è già un'altra pagina, che lo ritagliava per
  metà. `VoLeaf` ha ora `lifted`: nel gesto all'indietro la `z` resta costante e sopra la
  pagina ferma (`depth + LEFT_PAGE_DEPTH`).

### 6. Due reti di sicurezza sugli input del libro

- L'ascoltatore della rotella si riscrive a ogni giro pagina (`beginDrag` dipende dalla
  posizione). Se lo faceva mentre una scorsa era ancora aperta, il timer di guardia moriva
  con lui e `wheelRef` restava pieno per sempre: ogni rotellata successiva finiva dentro un
  gesto che non poteva più concludersi, e il libro sembrava bloccato su quella sezione. La
  pulizia dell'effetto ora chiude il gesto.
- `commit` era appeso solo alla promessa della molla, che una molla interrotta non risolve
  mai: il gesto restava «in corsa» e un gesto in corsa blocca *ogni* input. Un timeout di
  guardia (`RUN_TIMEOUT_MS`) conclude comunque il giro.

### 7. La pagina che non esiste resta dentro il libro

Una route sbagliata del tenant portava alla schermata 404 generica della piattaforma: altro
carattere, altro fondo, un salto fuori dal volume nel momento in cui il lettore ha più
bisogno di un appiglio. Ora `not-found.tsx` riconosce il tenant e rende il libro aperto
sull'**errata corrige** (`voErrata`), una posizione virtuale in fondo al volume come
l'appendice legale — ma non elencata in `voAppendix`, perché a un errata non ci si va, ci si
finisce. Le due facciate portano il perché e due richiami che *sfogliano*: dall'errata si
rientra nel volume senza ricaricare la pagina.

Perché funzionasse servivano due cose: `VoBookShell` accetta `entryAppendix`, così il volume
si **apre** sull'appendice invece di saltarci (l'errata non ha un URL che il libro possa
inseguire); e `renderAppendix` riceve il contesto, come già le facciate normali, perché quei
due richiami devono girare pagina e non navigare.

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Tenere una pagina per opera e cambiare solo l'occhiello | intervento minimo | non risolve la trilogia a due volumi, e il thriller resta il quarto foglio di una fila |
| Redirect 301 dei vecchi path | canonico più netto | struttura ancora in assestamento: un 301 resta nelle cache anche se si torna indietro |
| Sezione blog sempre presente ma vuota | nessun codice condizionale | una voce di menu che porta a una pagina vuota costa più di una voce assente |

## Conseguenze

- `VoSpreadKind` ha un solo valore (`static`): il libro non conosce più il concetto di
  «pagina di opera». `hasSpread()` resta e ora è sempre falso per uno slug di catalogo.
- La gestione continua a governare titolo, testi, copertine e link delle opere: cambia
  **dove** vengono impaginate, non chi le scrive.
- Le etichette dei due pulsanti della trilogia («Leggi la trama», «Porta a casa il libro»)
  sono quelle approvate con l'autrice; il **link** resta quello del catalogo. La tabella
  `tenant_creative_works` ha un solo `cta_label`: il secondo pulsante usa `cta_href` (o
  `secondary_cta_href` quando presente nel fallback di `content.ts`). **Da verificare**: se
  serve una seconda etichetta modificabile da gestione, va aggiunta una colonna.
- I testi delle schede opera visibili sul sito arrivano dal catalogo in gestione, non da
  `content.ts` (che è solo il fallback): i copy approvati vanno riportati anche lì.

## Riferimenti

- [[adr-0002-valentina-book-shell]] — la cerimonia, lo sfogliare, la quarta di copertina
- [[adr-0006-valentina-taccuino-nel-libro]] — navigazione con la cronologia dentro il volume
- [[adr-0010-informativa-per-moduli-attivi]] — le note legali del volume seguono i moduli
