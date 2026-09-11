# ADR-0002: Il sito del tenant valentina-orciuoli è un libro sfogliabile

- **Stato:** accettata — **parzialmente sostituita da [[adr-0005-valentina-blog-fuori-dal-libro]]**
- **Data:** 2026-08-14
- **Autore:** Massimo Pernozzoli

> **Nota (2026-09-01):** la parte di questo ADR sulla scrivania (`VoDesk`, la panoramica di
> camera, "il blog non sta nel libro: sta sulla scrivania") è superata da [[adr-0005-valentina-blog-fuori-dal-libro]].
> Il blog oggi non ha più alcuna pagina nel volume: "Blog" in nav è un link che esce dal
> libro verso `/it/blog`, una sezione a sé con testatina propria. Il resto di questo
> documento — cerimonia d'apertura, sfogliare, quarta di copertina, appendice legale —
> resta invariato e valido.

> **Nota (2026-09-02):** dentro il volume non si naviga più con `router.push` ma con
> l'API nativa della cronologia — vedi [[adr-0006-valentina-taccuino-nel-libro]] §1. Il
> libro non si rimonta più a ogni giro pagina, ed è da lì che venivano il lampo della
> pagina precedente a fine giro, le foto che saltavano e le pagine saltate. Nello stesso
> intervento il blog è tornato una pagina del libro.

> **Nota (2026-09-01):** il foglio in volo **non è più spezzato in doghe**. La curvatura
> geometrica della carta è stata sostituita da una curvatura *di luce* su un piano solo:
> vedi "La carta si incurva, ma di luce" più sotto. Il costo per fotogramma e la
> compenetrazione fra pagine che questo ADR lasciava "da verificare sul campo" sono stati
> misurati e risolti lì.

> **Nota (2026-09-11) — lo sfogliare diventa a prova di gesto.** Il motore dei gesti
> perdeva colpi e ogni tanto si piantava del tutto. Le cause erano quattro, tutte
> strutturali e non di regolazione, e sono state tolte alla radice:
>
> 1. **Ascoltatori nativi stabili.** `wheel` e `touch` vivevano in effetti che
>    dipendevano dalle funzioni chiamate; una di quelle cambiava identità a *ogni
>    render*, perché in fondo alla catena c'è una prop scritta come arrow inline.
>    L'ascoltatore veniva smontato e rimontato in continuazione e la sua pulizia
>    chiude la scorsa in corso: bastava un ridisegno col trackpad in movimento per
>    uccidere il gesto. Ora si registrano una volta sola e leggono le funzioni di
>    adesso da uno sportello (`latestRef`).
> 2. **Nessuna presa può sopravvivere al dito.** Il rilascio si ascolta sulla
>    *finestra*, non sull'elemento catturato, più una resa alla `visibilitychange`.
>    Se la cattura si perde — il browser decide di scorrere lui, un ridisegno
>    sostituisce l'elemento — il trascinamento si chiude comunque. Era questo il
>    "si blocca e non fa più scorrere da nessuna parte".
> 3. **Una scorsa di rotella vale un giro.** La sessione resta aperta finché gli
>    eventi arrivano e assorbe la coda d'inerzia del trackpad, invece di lasciarle
>    aprire giri nuovi. Un flick = una pagina, misurato.
> 4. **Libro e URL sono un invariante, non un evento.** Un cambio d'indirizzo che
>    arrivava mentre un foglio era in volo — o che veniva consumato a libro chiuso —
>    era perso per sempre, e da lì URL e pagina restavano in disaccordo. Ora a
>    volume fermo e aperto la coerenza viene ripristinata sfogliando fin lì.
>
> Nello stesso intervento la telecamera è diventata continua. Il fuoco durante un
> giro era un **gradino** (`p < 0.5 ? 1 : 0`) che prendeva a calci la molla che lo
> insegue: da lì lo scatto d'inquadratura in fondo a ogni giro e le scale fuori
> misura con due sfogliate ravvicinate. Adesso è una carrellata (`1 - p0`), valida
> in tutti e due i versi, con il passaggio di consegne fatto a mano in `commit`. La
> conca dello zoom è un seno e non più una V, perché una molla non scende in uno
> spigolo: misurata, si fermava a metà strada. **Su schermo largo esiste ora una
> telecamera** (`--vo-flip-t`): tre centesimi di scala mentre il foglio è in piedi,
> prima il giro pagina era una ripresa fissa.
>
> Sul telefono resta fermo il patto: **una sfogliata vale un passo solo**. La
> lettura procede sinistra → destra → pagina nuova → sinistra, e ognuno di quei
> momenti è un gesto a sé. Per un attimo il gesto si era rimesso l'origine sotto
> il dito, per incatenare carrellata e giro pagina in un movimento unico: sembrava
> più fluido e invece *saltava la facciata destra*, cioè metà del libro. Il tocco
> sul margine resta l'eccezione — è un comando esplicito e gira la pagina subito.
>
> **Due difetti di profondità, non di logica** (stesso giorno). In una scena
> `preserve-3d` l'ordine di disegno fra fratelli lo decide la **profondità**, non
> lo `z-index` — e su questo il libro sbagliava due volte:
>
> - `.vo-page-left` sta a `translateZ(2px)` e le prese sul taglio stavano a zero,
>   con un inutile `z-index: 60`. La presa di **destra** funzionava (la pagina
>   destra è a zero, lì lo `z-index` decide davvero) e quella di **sinistra** era
>   sepolta sotto la pagina: `elementFromPoint` al centro del taglio sinistro
>   rispondeva `.vo-page-body`, mai il pulsante. Da fuori, "il libro va solo in
>   avanti" — accenno, presa e clic all'indietro non arrivavano nemmeno a partire,
>   su desktop come su telefono. Le prese ora stanno a `translateZ(3px)`: davanti
>   alla pagina, molto dietro al piatto.
> - Il foglio in volo, andando avanti, scendeva fino a `-depth`, cioè finiva
>   **dietro** la pila di sinistra. La giustificazione in commento era che a quel
>   punto le due portano lo stesso contenuto; non è vero — la pagina sinistra
>   ferma porta ancora la sezione di *partenza*, quella d'arrivo sta sul retro del
>   foglio. Misurato a fine corsa: foglio a z −2.26 contro pagina a +2, pagina che
>   mostra `libri` e retro del foglio che mostra `trilogia`. Da lì il lampo della
>   pagina precedente per tutta la coda della molla. Ora la rampa **sale**: si
>   parte davanti alla pila di destra e si arriva davanti a quella di sinistra.
>
> Lezione di metodo: i test usavano `el.click()`, che **salta il hit-test** e
> quindi non vede mai un elemento coperto. Da qui in avanti si tocca chi risponde
> a `elementFromPoint` su quel punto, non l'elemento per selettore.
>
> **La coda ricorda la natura del passo** (stesso giorno). Un passo accodato
> mentre un foglio è in volo veniva speso *sempre* come comando esplicito, cioè
> come una pagina intera. Ma su schermo stretto una sfogliata vale mezzo passo —
> prima si gira la testa, poi la pagina — e chi sfogliava più in fretta di quanto
> duri un giro si vedeva saltare la facciata destra a ogni gesto accodato: è così
> che il telefono "avanzava di più pagine insieme", con la stessa faccia del
> vecchio difetto da trackpad ma un'altra causa. `queuedShiftRef` distingue le due
> nature. Misurato: tre sfogliate a raffica, la terza dentro il volo della
> seconda, danno tre mezzi passi.
>
> **La cerimonia diventa generosa, e chiudere torna un gesto.** Aprire chiedeva
> oltre duecento pixel di dito *in un tocco solo*: un pollice normale ne fa un
> centinaio, vedeva il cartoncino muoversi di mezzo e concludeva che scorrere non
> funzionasse — mentre il piede prometteva "scorri o tocca per aprire il libro".
> Ora una scorsa decisa (`TOUCH_OPEN_TRAVEL`, 44px) apre fino in fondo, e il
> gesto vale **in su o di lato**: aprire un libro è tirare la copertina, e la si
> tira in tutte e due le direzioni. Il trascinamento lento per sbirciare resta —
> a dirlo è il dito che si ferma, non la distanza.
>
> Di conseguenza **sfogliare indietro dalla prima pagina richiude il volume**, su
> telefono come su desktop, e il taglio sinistro della prima pagina torna un
> bersaglio anche in compatto. Erano stati tolti perché a libro chiuso il dito non
> aveva più niente da sfogliare: quel vicolo cieco non esiste più, visto che da
> chiuso si rientra con lo stesso gesto con cui si è usciti.
>
> **Ogni appendice ha la sua posizione** (stesso giorno). Privacy, cookie ed
> errata ne condividevano **una sola**, subito oltre l'ultima pagina. Passare
> dall'una all'altra non era quindi uno spostamento: il libro restava fermo e si
> limitava a cambiare il contenuto sotto gli occhi, senza sfogliare. Ora
> `voAppendixOrder` dà a ciascuna la propria posizione virtuale, e la facciata si
> sceglie dalla *posizione* e non dalla prop — durante il giro fra due informative
> le due facciate in scena sono due appendici diverse, e leggerle dalla prop ne
> avrebbe mostrata una sola. Misurato: da una sezione all'appendice volano tre
> fogli, fra un'informativa e l'altra uno.
>
> Nello stesso punto: **non si sfoglia a volume chiuso**. Dalla quarta di
> copertina un richiamo alle informative cambia l'indirizzo mentre il volume è
> ancora girato e chiuso, e il libro partiva col suo riffle in quello stato, sotto
> la copertina — il "si comporta strano". La richiesta si mette in attesa e si
> onora quando il volume è di nuovo aperto; la coda, a sua volta, non consuma più
> una richiesta che non potrebbe soddisfare.
>
> **Le copertine delle opere si scaldano all'ingresso.** La facciata sinistra di
> una pagina raggiunta sfogliando in avanti si monta due volte — prima sul foglio
> in volo, poi sul blocco pagine — e con il differimento pigro il browser scopriva
> l'immagine solo alla prima, cioè a giro già cominciato; la seconda buttava via
> quella richiesta e ricominciava da capo. Misurato sul giro verso il thriller:
> l'immagine risultava `complete: false` e `naturalWidth: 0` in tutti e tre i
> momenti, e il giro atterrava sul fondo scuro di `.vo-photo-print`. Ora la cache
> si riempie al montaggio del sito e l'immagine è `complete` in entrambi i punti.
>
> **I crediti stanno in un posto solo per modo** (stesso giorno): nel piede su
> schermo largo, sulla quarta di copertina su schermo stretto — è il CSS a
> scegliere su `data-compact`, il markup li porta in entrambi i posti. E sulla
> quarta non si premevano, per due ragioni sovrapposte: il piatto intero è
> `pointer-events: none` (per non intercettare nulla quando sta dietro al blocco
> pagine) e i link non lo riprendevano; e sopra di loro rispondeva una *facciata
> del libro* — `backface-visibility: hidden` sulla pagina non basta, perché
> `.vo-page-body` è un riquadro che scorre, il browser lo promuove a un livello
> suo e lo tiene cliccabile anche quando la pagina dà le spalle allo schermo.
> Ora i link riprendono la mano, e a volume chiuso o rigirato le pagine sono
> `pointer-events: none`: si tocca quello che si vede.
>
> **Un gesto, un passo — e il ripensamento** (stesso giorno). Una sfogliata
> molto ampia col pollice girava la pagina *e poi* spostava anche il fuoco sulla
> facciata successiva. Due cose insieme: `pointerleave` chiudeva la presa quando
> il dito usciva dalla scatola del libro — un giro deciso da un bordo invisibile,
> a dito ancora giù — e l'origine della sfogliata non veniva mai consumata, così
> lo stesso dito, continuando, veniva letto come una sfogliata nuova. Ora
> l'origine si consuma appena la presa comincia (per il passo dopo serve un dito
> nuovo), la presa la chiude solo il rilascio, e un colpo deciso all'indietro
> **riavvolge** il foglio anche oltre metà corsa: il verso dell'ultimo movimento
> conta quanto il punto in cui il foglio è arrivato.
>
> **La rotella è una spinta, non una presa.** Superata la soglia il giro si
> compie da sé, senza aspettare che la mano si fermi. Prima si aspettava il
> silenzio, e su un trackpad il silenzio può non arrivare: le dita ferme sul pad
> mandano un rivolo di delta da un pixel che rinnova la guardia all'infinito, e
> il foglio restava a mezz'aria. Sotto soglia, scorrere indietro riporta il
> foglio al dorso e il silenzio lo lascia cadere. Misurato: 90 azioni di rotella
> fra colpetti, scorse lente, rivoli, parziali e inversioni — zero fogli sospesi.
>
> Verifica: 880 gesti casuali su mobile e 110 su desktop (sfogliate, colpetti,
> gesti annullati a metà, secondo dito, diagonali, inversioni a metà corsa, rotella
> orizzontale, clic in nav), più 12 raffiche di sfogliate appaiate per il caso "la
> seconda si blocca" — zero blocchi, zero giri doppi, zero disallineamenti fra
> pagina e indirizzo, telecamera sempre dentro i suoi estremi.

## Contesto

`valentina-orciuoli` è un tenant del verticale `creative`: l'attività è la scrittura.
Il sito precedente era un normale sito a scorrimento verticale (hero, sezioni, footer),
indistinguibile da qualunque altro sito d'autrice.

L'idea di prodotto è rendere la metafora letterale: il sito **è** un libro. La copertina
si apre scorrendo, e la navigazione tra le sezioni è lo sfogliare le pagine.

Il rischio della versione letterale di questa idea è perdere l'indicizzazione: se tutto
vive dentro un'unica URL client-side, le sezioni non sono più condivisibili né
indicizzabili, in contrasto con la regola di predisposizione multilingua/SEO del
`CLAUDE.md` (canonical self-referencing e `hreflang` per pagina).

## Decisione

Il libro è la **shell di presentazione**, non il meccanismo di navigazione.

- Ogni sezione resta una route reale, server-rendered, sotto prefisso lingua:
  `/valentina-orciuoli/it`, `/it/libri`, `/it/blog`, `/it/eventi`, `/it/contatti`.
- **`/it/autrice` non è una pagina del libro: è la quarta di copertina.** Per mostrarla
  il volume si chiude e poi si rigira — due movimenti in sequenza, non uno solo, perché
  un libro non ruota su se stesso da aperto. Vive fuori dall'array degli spread.
- **Il volume è un circuito chiuso.** Ai due capi non ci sono pagine, ci sono i piatti:
  risalendo dalla prima pagina il libro si chiude, sfogliando oltre l'ultima si arriva
  alla quarta, e dalla quarta si rientra. Senza il seguito in avanti quella sezione
  restava raggiungibile solo dal menu, e chi naviga sfogliando la perdeva.
- Una route = una **doppia pagina** (spread). L'ordine è definito in
  `src/components/tenants/valentina-orciuoli/book/book-map.ts` e *è* l'ordine delle
  pagine nel volume: cambiarlo cambia quante pagine separano due sezioni.
- **Ogni opera ha la sua doppia pagina** (`/it/anxiety`, `/it/fury`, …): copertina a
  piena altezza a sinistra, testo e acquisto a destra. Prima stavano tutte in un elenco
  unico che traboccava e obbligava a scorrere dentro la carta — dentro un libro non si
  scorre, si gira pagina. `/it/libri` è diventato il sommario, con i puntini di guida e
  il numero di pagina come in un indice stampato.
- **Il sito non scorre mai.** È alto esattamente un viewport, con testatina e piede
  ancorati: la rotella apre la copertina durante la cerimonia e poi gira le pagine, e
  non esiste una barra di scorrimento da cui il libro possa sfuggire.
- La navigazione interna passa sempre dall'URL. Nav, link nelle pagine, hotspot sul
  foglio, rotella, tastiera e back/forward del browser convergono tutti sullo stesso
  `pathname`; il libro insegue il pathname sfogliando.
- Chi arriva da un link condiviso su `/it/eventi` trova il libro **già aperto** a quella
  pagina: la cerimonia di apertura della copertina si gioca solo entrando dalla home.
- **Le note legali sono l'appendice del volume.** `/it/privacy` e `/it/cookie` sono pagine
  del libro, ma occupano una posizione *virtuale* subito oltre l'ultima: sta fuori dai
  limiti usati dalla navigazione manuale, quindi sfogliando non ci si finisce mai dentro
  — come in un libro non si incappa nel colophon leggendo. Ci si arriva solo dai richiami
  nel piede, e da lì si torna alla pagina che si stava leggendo. Essendo comunque una
  posizione, il salto riusa il motore dei fogli: si vede il libro sfogliare fino in fondo.
- **Il blog non sta nel libro: sta sulla scrivania.** Il volume è la cosa finita —
  rilegata, impaginata, chiusa; gli appunti no. Mostrarli sfogliando direbbe che fanno
  parte del libro, che è il contrario del punto. Perciò `/it/blog/<slug>` vive su una
  seconda scena, raggiunta da una **panoramica**: girare pagina significa "più addentro
  nello stesso oggetto", spostare la camera significa "un altro oggetto sul tavolo".
  Le due scene stanno affiancate nello stesso mondo e restano montate entrambe — è questo
  che rende la panoramica un movimento continuo invece di uno stacco.
- Sulla scrivania **il mucchio è l'archivio**: prendere un altro foglio lo porta in cima
  senza tornare al libro. Se la scrivania servisse solo a reggere un articolo, la
  panoramica sarebbe un costo pagato per niente.
- `/valentina-orciuoli/link` (linktree) resta **fuori** dal volume: è una landing per le
  bio dei social, non una pagina del libro.

Il motore di sfogliamento è scritto su misura, senza nuove dipendenze (`framer-motion`
era già in progetto).

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Libro totale su singola URL | Illusione continua, nessun reload | Sezioni non indicizzabili né condivisibili, back button rotto, viola la regola SEO/multilingua |
| `react-pageflip` / StPageFlip | Pronto all'uso | Pacchetto fermo al 2021, widget chiuso: non coopera con il routing Next né con l'SSR |
| Real3D FlipBook (WebGL) | Il flip più realistico in circolazione | Prodotto commerciale per PDF: le pagine sono immagini, quindi niente testo indicizzabile, link vivi o form |
| Solo home-libro, sottopagine classiche | Metà del lavoro, metà del rischio | Rompe la metafora appena si esce dalla home |

## Conseguenze

**Struttura.** Nuova cartella `src/components/tenants/valentina-orciuoli/book/`:

| File | Ruolo |
|---|---|
| `book-map.ts` | Registro degli spread, quarta di copertina, mapping route↔indice, prefisso lingua |
| `book-memory.ts` | Memoria del volume che sopravvive al rimontaggio del segmento dinamico |
| `book-site.tsx` | Componente di primo livello: cerimonia, chiusura e giro, dati, nav, piede |
| `book-shell.tsx` | Scena, stato di navigazione, input (hotspot, rotella, tastiera) |
| `leaf.tsx` | Il foglio in volo: un piano solo, la sua rampa di luce, il riflesso, l'ombra portata |
| `cover.tsx` | Copertina con curvatura a doghe annidate |
| `back-cover.tsx` | Quarta di copertina: ritratto, biografia, marchio, codice a barre |
| `pages.tsx` | Contenuto delle facce, spread per spread |
| `use-page-sound.ts` | Fruscio della pagina sintetizzato in WebAudio, senza asset |

Il form contatti è stato estratto in `contact-form.tsx` perché ora serve sia il libro sia
la pagina statica residua.

**Isolamento.** Tutto vive sotto la cartella del tenant; lo stile sta solo in
`src/styles/tenants/valentina-orciuoli.css` (namespace `vo-book-*`, `vo-page-*`,
`vo-leaf-*`, `vo-cover-*`, `vo-face-*`). Nessun componente è stato promosso a `_shared/`
e nessun modulo di piattaforma è stato modificato: form contatti, newsletter e blog
restano quelli condivisi, riportati sulla carta con sole regole CSS scoped al tenant.
Il motore del libro **non** è un modulo di piattaforma finché non serve a un secondo tenant.

**Vincoli tecnici emersi.**

- `.vo-site` porta `overflow: clip`; su `.vo-book-site` va riportato a `visible`,
  altrimenti quell'elemento diventa lo scrollport della cerimonia e lo sticky della
  copertina smette di reggere.
- Dentro un contesto `preserve-3d` lo `z-index` non ordina nulla: conta la posizione 3D.
  I fogli animano la propria `z` da `+depth` a `-depth` per restare in cima alla pila
  anche dopo essere atterrati; la copertina invece tiene la `z` costante, perché è la
  rotazione di 180° a portarla dietro al blocco pagine, che è dove sta il piatto di un
  libro aperto.
- Il volume ha uno **spessore vero**: piatto anteriore, blocco pagine, piatto posteriore
  e **dorso**. Il dorso è una faccia ruotata di 90° che parte dal piano del piatto
  anteriore e arriva a quello posteriore, quindi ne copre tutta la distanza; a libro
  aperto sta di taglio e non si vede, si rivela ruotando sulla quarta. Senza, girandosi
  il libro mostrava due cartoncini piatti invece di un oggetto solido.
- Per questo `--vo-cover-depth` e `--vo-board-depth` stanno **entrambi in CSS**: prima la
  profondità del piatto anteriore era una costante JS e quella del posteriore una regola
  CSS, e il dorso non avrebbe potuto misurarsi su nessuna delle due. Se i tre valori non
  tornano, il volume girandosi si apre.
- La copertina deve arrivare a **180° esatti**. Fermandosi a 178° il bordo esterno
  accumula abbastanza scarto in z da riemergere davanti alla pagina sinistra.
- Il progresso della cerimonia è calcolato a mano invece che con `useScroll`: il
  contenitore è alto quanto quasi tutta la pagina e non può uscire dal viewport
  dall'alto, quindi con `offset: ["start start", "end start"]` il progresso si fermava a
  ~0.7 e la copertina non finiva mai di aprirsi.
- `framer-motion` riscrive `transform` per intero: una regola CSS `transform` sullo
  stesso elemento viene cancellata (vale per l'inclinazione da scrivania del blocco).
- **Next rimonta il componente client a ogni cambio del segmento dinamico**
  (`/it/libri` → `/it/contatti` sono due valori di `[bookId]`). Con lo stato di lettura
  nel solo `useState`, ogni navigazione ripartiva dalla pagina d'arrivo: nav, link
  interni e back del browser cambiavano pagina *di scatto*, senza sfogliare. Lo stato
  che deve sopravvivere sta in `book-session.ts`, un modulo che vive quanto la scheda —
  un ricaricamento vero riparte pulito, così chi apre un link diretto trova la pagina
  già lì invece di vedersela sfogliare addosso.
- Un solo scrittore per `voBookSession.spread`: lo shell, che è l'unico a sapere a che
  punto è davvero il volume mentre sfoglia. Il resto legge.
- La cerimonia d'apertura **non** usa lo scroll del documento: consuma la rotella come
  valore virtuale. "Chiuso" è uno stato, non un modo d'ingresso: il gesto d'apertura
  resta disponibile anche dopo un "chiudi il libro", e risalire con la rotella dalla
  prima pagina richiude il volume. La versione a contenitore alto 320vh con sticky aveva quattro
  difetti a cascata — la soglia d'apertura scattava prima della fine corsa e il volume
  restava socchiuso per sempre; il blocco del `body` rendeva il piede irraggiungibile;
  "Chiudi il libro" riapriva subito perché la soglia riscattava alla prima risalita; e
  `min-height: 100vh` del contenitore di route eccedeva l'area visibile su mobile,
  generando la barra di scorrimento.
- **Non lanciare un'animazione dall'interno della callback del valore che quella
  animazione muove**: è rientrante e framer finisce per non applicarla. La conclusione
  dell'apertura stava nell'ascoltatore di `coverProgress`, e il risultato era che la
  copertina si fermava a un passo dalla fine (`rotateY(-172.8°)`, pagina sinistra al 77%
  di opacità) e lì restava per sempre, perché da quel punto nessun gesto la muoveva più.
  Ora la decisione la prende il gesto, non l'ascoltatore.
- `deltaY` **non è in pixel dappertutto**: `deltaMode` 1 conta righe (Firefox con una
  rotella vera manda ~3) e 2 conta pagine. Senza normalizzare, su quei browser la
  cerimonia avrebbe richiesto centinaia di scatti.
- Il gesto detta il *bersaglio*, una molla ci arriva, e ogni evento è limitato a 160px:
  l'inerzia di un trackpad manda colpi da oltre mille pixel, che senza tetto
  teletrasportavano il libro aperto invece di aprirlo.
- `--vo-page-h` deve restare una **lunghezza**, non una percentuale: larghezza della
  pagina e fetta d'arte delle doghe *della copertina* derivano da lì con dei `calc`, e una percentuale
  verrebbe risolta su assi diversi (altezza del genitore per l'altezza, larghezza
  dell'elemento per il `background-size`).
- `voBookMemory` è un modulo, e **sul server i moduli sono condivisi fra le richieste**:
  leggerlo o scriverlo durante il render faceva finire lo stato di un visitatore
  nell'HTML del successivo, con conseguente fallimento dell'idratazione. La memoria
  esiste solo nel browser (`voBookMemoryAvailable`).
- **Regola d'oro della memoria: ogni campo si scrive quando la cosa accade davvero** —
  il libro si apre, il volume finisce di rigirarsi — mai al montaggio. Un flag scritto
  al montaggio viene consumato dalla doppia invocazione di StrictMode, che rimonta sullo
  stesso path senza che sia successo nulla, e la cerimonia non parte più.
- Per lo stesso motivo **un latch su `useRef` dentro un effetto non funziona**: StrictMode
  rigioca l'effetto sulla *stessa* istanza, quindi con il ref già scritto. La sequenza
  chiudi-e-rigira non teneva conto di questo e il giro sulla quarta non partiva mai
  (si vedeva solo la chiusura, poi uno scatto). L'effetto ora non tiene un latch: punta
  sempre allo stato che l'URL chiede e salta i tratti già a posto, quindi è idempotente.
- `PageTransitionShell` rimontava l'intero albero a ogni navigazione (`key={pathname}`)
  e rigiocava un fade d'entrata: da lì lo scatto a metà sfogliata. Ora le *superfici
  continue* dichiarate in `src/lib/page-transition.ts` condividono una chiave sola e
  non rimontano; per ogni altra route il comportamento resta identico. Attenzione: la
  home e le sezioni restano route file diversi (`[previewSlug]` contro
  `[previewSlug]/[bookId]`), quindi su quel confine Next rimonta comunque — ed è per
  questo che `book-memory.ts` continua a servire.
- **Anche la camera va ricordata, non solo la pagina.** `/it/blog` e `/it/blog/<slug>`
  sono route file diversi: aprendo un appunto il componente si rimonta, e un
  `useMotionValue(sulTavolo ? 1 : 0)` nasce **già a destinazione**. Il risultato non era
  una panoramica ma uno stacco: campionando la `transform` di `.vo-world` durante la
  navigazione si ottenevano 187 campioni con **due soli valori distinti**
  (`none` → `translateX(-50%)`). La posizione della camera sta in `voBookMemory.desk` e si
  scrive **a movimento finito**, come tutti gli altri campi; il valore parte da lì e la
  strada la deve ancora fare. Dopo la correzione lo stesso campionamento dà ~60 fotogrammi
  distinti per verso, con l'accelerazione visibile in coda (`-0,02%`, `-0,07%`, `-0,15%`…).
- Una traslazione sola resta un cambio di diapositiva: la panoramica muove anche
  **scala, rotazione, luce e deriva** dei due oggetti in senso opposto, con `perspective`
  sui figli di `.vo-world` — è quello che la fa leggere come una macchina da presa che si
  sposta sul tavolo invece che come due scene che si sostituiscono. Le opacità non scendono
  mai insieme sotto la soglia in cui il centro corsa diventa una valle scura.
- Oltre la verticale la copertina **arcua verso l'osservatore** prima di posarsi: è la
  geometria di una rotazione attorno al dorso, non un errore. Perciò la pagina sinistra
  si scopre solo a piatto posato (`0.86 → 0.99`), che è anche il comportamento fisico
  giusto — in un libro vero il risguardo è incollato al piatto e viene giù con lui.
- La grana della carta è generata in CSS. Usare un asset editoriale del tenant come
  texture stampava la UI del vecchio sito dentro le pagine; e incrociare due direzioni
  di fibra dà carta a quadretti, quindi la fibra è una sola.

**Una trappola dello stato aperto.** Tornando dalla quarta il volume si riapriva
*nell'aspetto* — l'animazione riportava la copertina a posto — ma non nello stato: `opened`
era rimasto `false` dal montaggio (la memoria diceva "rigirato"), quindi rotella, tagli e
tastiera restavano morti finché non si ricaricava la pagina. Lo stato va richiuso alla fine
del movimento, non lasciato all'aspetto.

**Accessibilità.** I fogli in volo duplicano il contenuto delle pagine statiche: sono
`aria-hidden` e `inert`, altrimenti link e campi resterebbero raggiungibili da tastiera.
La navigazione funziona con `←`/`→` e `PageUp`/`PageDown`. Con
`prefers-reduced-motion: reduce` la cerimonia e lo sfogliare sono disattivati e il libro
resta un documento leggibile.

**La cedola della newsletter.** Il popup a tempo — compariva da solo dopo quattro
secondi — è stato sostituito da un oggetto fisico: un cartoncino infilato fra le prime
pagine, di cui sporge solo la linguetta dal taglio superiore. Chi lo nota lo prende, chi
non lo vuole non lo incontra mai. Premendolo la cedola viene tirata su e portata in primo
piano, con il lato perforato di dove è stata staccata. Restano il fuoco intrappolato, la
chiusura con `Esc` e il ritorno del fuoco al punto di partenza, che il popup già aveva.
`useValentinaNewsletter` non ha più né timer né `localStorage`: espone solo l'invio.

**Rifiniture presenti.** Fruscio della pagina sintetizzato (rumore bianco in un passa-banda
discendente, variato a ogni giro così due sfogliate non suonano identiche), con interruttore
visibile e preferenza che sopravvive alle navigazioni. Nastro segnalibro che corre nel solco
del dorso: dalla quarta di copertina la sua coda è il modo per rientrare esattamente dove si
stava leggendo. Taglio delle pagine con spessore che migra da destra a sinistra. Dedica che
si scrive da sé sul risguardo.

**Materiali.** La carta è rumore vero: un `feTurbulence` rasterizzato una volta come
data-URI e ripetuto, non un reticolo di gradienti — un filtro SVG a runtime darebbe lo
stesso risultato ma lo ricalcolerebbe a ogni frame, e su un foglio che ruota in 3D si
paga caro. Sopra ci vanno fibra orientata e nuvolosità dell'impasto, e il testo porta un
filo di luce sotto le lettere per restituire la stampa in rilievo.

Le copertine dei libri sono **fotografie stampate e incollate**: bande bianche strette,
ombra propria, nastro con i lembi strappati aggrappato agli angoli e una banda speculare
obliqua. Il dettaglio che fa la differenza è lo `z-index`: la stampa sta **sopra** la grana
della pagina, altrimenti la carta le passerebbe attraverso e tornerebbe opaca come il
foglio. Ma perché quello `z-index` resti locale, `.vo-page-sheet` deve dichiararsi
contesto di impilamento con `isolation: isolate` — `position: relative` da sola non ne
crea uno. Senza, l'indice risaliva fino a `.vo-book` e la foto finiva **sopra il foglio in
volo**: le pagine non coprivano più le stampe, che sparivano di colpo a fine animazione.
L'isolamento confina anche il `mix-blend-mode` della grana alla propria carta.

Nessuna di quelle imprecisioni è scritta a mano. `photoHand()` in `pages.tsx` ricava una
sequenza deterministica dallo slug (FNV-1a per il seme, xorshift32 per la sequenza) e ne
tira fuori inclinazione, scarto dal centro, angolo e lunghezza dei due pezzi di nastro; la
**diagonale del nastro si alterna con l'ordinale** — alto-sinistra/basso-destra, poi il
contrario — così una fila di schede non sembra timbrata con lo stesso stampo. Un libro
aggiunto domani prende la sua variazione da sé, e resta sempre la stessa: un valore
casuale vero cambierebbe a ogni render e la foto saltellerebbe a ogni sfogliata.

**La carta si incurva, ma di luce.** *(rivisto il 2026-09-01; la versione originale di
questa sezione è riassunta in fondo, sotto "Perché le doghe sono state tolte".)*

Il foglio è **un piano solo**, che ruota attorno al dorso da 0° a -180°:

```
corda(p) = -180 p              rotazione del piano di carta: il gesto, senza correzioni
arc(p)   = -ARC * sin(2π p)    arco *virtuale*: quanto ruota la normale fra dorso e taglio
vicino   = corda - arc/2       normale al dorso        ⟶ opacità del velo interno
lontano  = corda + arc/2       normale al taglio       ⟶ opacità del velo esterno
```

L'arco resta, ma non piega più niente: alimenta la rampa d'ombra, il riflesso radente e
l'ombra portata. Il doppio periodo non è una scelta estetica — ai quarti di giro un capo
è ancora appoggiato e l'altro è già in volo, ed è lì che una carta vera fa pancia; ai capi
e a metà giro è nullo, perché posata la carta è piana e in piedi fuori dal libro è quasi
piana.

Sopra ci va la **frusta**, l'unico termine che dipende dalla velocità: l'aria e l'inerzia
trattengono il taglio mentre il foglio vola. È quella a distinguere un foglio trascinato
piano — che resta quasi piatto sotto il dito — da uno lanciato con un colpetto. Entra
nella rampa d'ombra ma **non** nel riflesso: la velocità di un valore scritto di pari
passo col puntatore è rumorosa, e una banda di luce che sfarfalla si nota molto più di
un'ombra che respira.

**Il velo a riposo dev'essere zero.** Il foglio si monta e si smonta sempre a carta posata,
sopra la pagina che duplica. Se in quella posizione porta anche solo il 4% d'ombra che la
formula di Lambert gli darebbe, montarlo e smontarlo è uno *scalino di luce*: la pagina si
incupiva appena il puntatore sfiorava il taglio e si schiariva di colpo a giro finito.
Quindi il velo è la luminosità **meno quella del foglio posato**, e la piega sul dorso
parte da 0 invece che da 0,12.

**La profondità non deve mai essere ambigua.** Il foglio parte davanti alla pila di destra
(`z = +depth`) e finisce dietro a quella di sinistra (`z = -depth`) — la stessa strada che
fa la carta vera, ed è ciò che lo fa sparire nell'istante in cui la pagina sotto ne prende
il posto. La `z` va sul piano *prima* della rotazione: dentro un elemento già ruotato
sarebbe uno spostamento perpendicolare alla carta, non verso l'osservatore.

**La luce si calcola, non si disegna.** Ombre, riflesso e ombra portata escono dalla
normale della carta (Lambert più un lobo speculare largo, perché la carta è opaca), non da
curve scritte a mano sul progresso. **Quattro** veli per faccia — scuro e chiaro sul bordo
del dorso, scuro e chiaro sul bordo esterno — con le opacità calcolate sui due *bordi*: è
la rampa che dà la pancia senza piegare un poligono. Sul verso, che è la stessa superficie
vista da dietro, i due bordi si scambiano.

**Il lato chiaro della rampa esiste, e va amplificato.** *(2026-09-01)* Il velo era uno
solo, scuro, e ciò che stava sotto lo zero veniva tagliato: campionando le opacità reali a
metà del primo quarto risultavano **zero su tutti i bordi** — per tutta la prima metà del
giro il foglio era senza forma, un cartoncino piatto che ruotava. Non è un difetto della
formula ma della sua gamma: su carta molto ambientale Lambert corre fino a 1 verso il buio
e ha sette centesimi verso la luce, e quei sette centesimi sono metà del giro, perché una
pagina che si alza verso una luce frontale *prende* luce prima di perderla. Ora il segno si
conserva: la parte positiva accende il velo scuro, quella negativa il velo chiaro con un
guadagno suo. Il velo chiaro del dorso non parte dal dorso — il solco della cucitura è in
ombra qualunque cosa faccia la pagina, e accenderlo lì metteva un alone chiaro proprio dove
un libro è più scuro.

Il riflesso non è più una banda traslata: era clampata ai bordi e ferma sotto il 5% di
opacità, cioè non si è mai vista. È diventata il lobo speculare pesato dentro il velo
chiaro, quindi la lucentezza *cammina* da sé passando dal bordo esterno a quello del dorso
mentre la pagina gira. Resta moltiplicata per la curvatura, che è anche ciò che la tiene a
zero esatto sul foglio posato: da fermo il lobo varrebbe da solo quasi la metà.

**Lo sghembo, non la rotazione sul piano.** L'angolo esterno si stacca prima del resto del
taglio. Era una `rotateZ`, che però fa ruotare *anche il bordo sul dorso* — cucito nella
legatura, quindi l'unico bordo che non può muoversi: a un grado si vedeva il foglio
staccarsi dal solco, e la correzione era stata ridurre l'ampiezza finché non si notava.
Uno `skewY` lascia il dorso esattamente dov'è e alza l'angolo libero, che è come si stacca
una pagina vera. La frusta ci si somma, così in coda l'angolo rincorre il resto.

**L'ombra portata sta sul piano del libro, non sul foglio.** Un `box-shadow` sulla carta
ruota con lei, e un'ombra che si alza da terra non è un'ombra. È un elemento a sé, ancorato
al dorso e scalato.

*(2026-09-01)* Non può però scalare con il **solo** coseno dell'angolo: quella è esattamente
la proiezione del foglio, quindi l'ombra gli restava nascosta sotto per tutto il giro — un
elemento che nessuno ha mai visto. La luce arriva di sbieco, e l'ombra di un foglio alzato
sporge oltre il suo taglio in proporzione all'altezza: `cos + 0,45·|sin|`, limitato alla
pagina. È quella lama che sfila sulla pagina destra a raccontare che sopra c'è della carta
in aria, e a foglio in piedi diventa la banda che attraversa mezza pagina. Per lo stesso
motivo il gradiente è quasi pieno fino in fondo con la penombra negli ultimi centesimi:
sfumando già a metà, la parte che sporge — l'unica visibile — cadeva sulla coda trasparente.
Oltre la verticale il coseno cambia segno e con esso lo `scaleX`, quindi l'ombra passa da sé
sull'altra metà; nel mezzo collassa nel solco, ed è giusto — lì il foglio è di taglio alla
luce. L'opacità segue una sola gobba con il massimo a foglio in piedi, che è quando la carta
è più alta sopra la pagina.

**Il taglio del foglio è un bordo, e si vede.** *(2026-09-01)* Il dorso è cucito, il taglio
no: è l'unico bordo che in un libro si vede *come bordo*. Senza, il foglio in volo finiva
sulla pagina sotto senza che nulla dicesse dove uno smette e l'altra comincia. È un velo con
due centesimi di larghezza acceso sul taglio, pesato sulla curvatura così non compare sul
foglio posato.

**La rotella scorre il giro, non lo fa scattare.** Prima era una soglia con un tempo morto:
novanta pixel facevano partire un giro intero, e per quattro decimi di secondo la rotella
non contava più — un pulsante nascosto dentro uno scorrimento. Ora la rotella apre lo stesso
trascinamento del dito con una corsa sua (300px per pagina), il foglio la segue per tutta la
corsa e a gesto finito valgono le due regole di sempre: oltre il 30% cade in avanti, sotto
torna indietro. Gli scatti di un mouse sono discreti, quindi la rotella detta il *bersaglio*
e una molla ci arriva — lo stesso patto della cerimonia d'apertura. La normalizzazione di
`deltaMode` è ora dichiarata una volta sola e importata dalla cerimonia, invece di esistere
in due copie.

Due difetti del motore sono emersi facendo questo, e valgono anche per il dito:

- **La decisione va presa sul bersaglio del gesto, non su dove è arrivata la carta.** Otto
  scatti di rotella nello stesso fotogramma portano il bersaglio a fondo corsa mentre la
  molla è ancora ferma sul dorso: leggendo il foglio, il giro risultava appena accennato e
  non si compiva mai.
- **Una corsa che raccoglie un foglio già in aria non deve riallinearlo.** Il
  riallineamento serve ai salti nuovi, il cui valore può essere rimasto al capo opposto da
  un gesto precedente; applicato a una ripresa riportava al dorso un foglio lasciato oltre
  metà corsa, che ripartiva da capo sotto gli occhi.

**Il fruscio sta all'aggancio, non al rilascio.** La carta suona quando si stacca. Prima il
suono partiva alla fine del trascinamento, cioè quando il foglio aveva già viaggiato.

**Movimento.** Molla morbida, massa alta, smorzamento quasi critico: una pagina di carta è
leggera ma incontra l'aria, rallenta lunga e si posa senza rimbalzare (~1,3 s per giro).
Il foglio si solleva **in proporzione a quanto il puntatore si avvicina al taglio**, con
una punta di rotazione sul piano che fa staccare l'angolo esterno più del resto: è
l'affordance — si capisce che è un foglio e che lo si può prendere — senza aggiungere UI.

**Mobile.** Sotto il punto di rottura il libro passa a **una facciata per pagina**: si
gira più spesso, ma non si scorre mai dentro la carta. Prima le due facce dello spread
venivano impilate in un foglio solo, che è esattamente ciò che produceva lo scroll interno.

Lo stato resta in unità di spread — è quello che URL, memoria e numeri di pagina conoscono
— e la *posizione* si deriva dal modo corrente, così un cambio di larghezza non corrompe
nulla. La soglia è dichiarata **una volta sola, nel componente**, e il foglio di stile la
segue tramite `[data-compact]`: prima era una media query nel CSS *e* una in JavaScript, e
quando le due sono divergute si è ottenuto il peggio dei due modi — pagina sinistra
visibile per il CSS ma riempita dal componente con la stessa facciata della destra, quindi
contenuto duplicato. Il modo di impaginazione è una decisione di comportamento, non di
aspetto: appartiene a chi costruisce le pagine.

**L'arredo 3D non intercetta i clic.** Copertina, piatto posteriore, tagli e nastro sono
decorativi e portano `pointer-events: none`. La copertina aperta si distende sopra la
pagina sinistra: senza, si mangiava i clic dei link che ci stanno sotto — ed è così che i
contatti risultavano morti. Restano interattivi solo la linguetta della cedola, i tagli
cliccabili e la coda del segnalibro sulla quarta.

**Il testo legale non è riscritto.** L'appendice rende `DynamicPolicyDocument`, il modulo
di piattaforma che costruisce le sezioni dai flag e dai dati legali del tenant; qui si
limita a vestirsi da carta con regole CSS scoped. Una informativa duplicata è una
informativa che prima o poi diverge da quella vera. È anche **l'unica pagina del volume in
cui il contenuto può eccedere il foglio e scorrere**: un'informativa non si accorcia per
farla stare in pagina. Scorre senza barra, come tutte le altre.

**Il foglio dell'articolo è lungo, non è una finestra.** Scorre perché la carta continua
oltre il bordo dello schermo, non perché ci sia un riquadro con dentro uno scroll: è la
differenza fra un manoscritto e un `div`. Senza barra, come ovunque.

**Una guardia che serve più di quanto sembri.** `spreadIndexByPathname` ripiega sulla home
quando non riconosce un path. Sulla route di un appunto questo faceva credere allo shell di
essere sul frontespizio, e il libro **riscriveva l'URL** buttando fuori dall'articolo appena
aperto. `isBookPathname` dice se il path è impaginabile dal volume; se non lo è, lo shell
non si muove e soprattutto non tocca la barra degli indirizzi.

**Densità.** Le pagine sono progettate per stare dentro il foglio: se una eccede resta
scorrevole ma senza barra, perché una scrollbar dentro un libro è l'artefatto che rompe
l'illusione più di ogni altro.

**Un giro pagina fa due rumori.** *(2026-09-01)* Il fruscio quando la carta si stacca e il
tonfo sordo quando si posa sulla pila. C'era solo il primo, e il giro finiva in silenzio
proprio nel momento in cui un libro fa il rumore più riconoscibile. La posata è lo stesso
rumore bianco con un'altra inviluppante: più corta, più bassa, senza attacco — è un urto,
non uno sfregamento.

**L'accenno non è un cancello.** *(2026-09-01)* Il foglio si sollevava di un decimo di
corsa, cioè diciotto gradi, solo passandoci accanto col mouse: un libro vero non fa nulla
finché non lo tocchi. Undici gradi bastano — la carta prende luce, il suo taglio si stacca
dalla pagina sotto, l'ombra portata comincia a sfilare — senza che l'affordance diventi un
movimento a sé.

**Perché le doghe sono state tolte.** *(2026-09-01)* Il foglio era spezzato in sei doghe
verticali curvate per davvero. Ogni doga deve ritagliare la propria striscia di DOM vivo,
quindi ogni foglio portava **dodici copie della pagina** — trentasei con tre fogli in volo —
da ricomporre a ogni fotogramma dentro un albero `preserve-3d`, con `mix-blend-mode` sulla
grana e sul riflesso di ognuna. Due difetti, entrambi visibili a occhio nudo:

- il giro pagina perdeva fotogrammi, e sull'ultimo — quello del cambio di URL — si vedeva
  la carta fermarsi a mezz'aria;
- le doghe si spingono in profondità di **centinaia** di pixel per curvare, quindi
  attraversavano il piano delle pagine ferme: la carta in volo si vedeva tagliata a metà
  da quella posata, e a foglio quasi posato le due pagine si compenetravano.

La curvatura è passata da geometria a luce (sopra): due copie invece di dodici, nessun
piano che possa intersecare le pagine ferme. La misura di fps dal pannello d'anteprima
resta impossibile — con la scheda nascosta `requestAnimationFrame` è fermo e ogni misura
fatta da lì misura gli screenshot — ma il conto delle copie e delle superfici fuse è
verificabile dal DOM, ed è quello che è stato usato per decidere.

Cadono con le doghe anche tre trappole che questo ADR documentava e che ora non esistono
più: la larghezza della doga letta dallo stile calcolato invece che da
`getBoundingClientRect()`, il mezzo pixel di sormonto per chiudere la cucitura fra ritagli
adiacenti, e la catena srotolata in coordinate assolute perché `overflow` appiattisce il
contesto 3D dei figli. Restano valide per `cover.tsx`, che le doghe ce le ha ancora e può
tenerle: lì il fondo è una texture, non DOM vivo.

**Gli stadi del gesto sono un movimento solo.** Accenno, presa, corsa e posa condividono lo
stesso elemento: la chiave del foglio è il *posto nella pila*, non il gesto. Legandola al
gesto — come era prima — il foglio si rimontava da capo a ogni cambio di stadio, e il
passaggio da presa a corsa è esattamente l'istante in cui si lascia andare la pagina: lì si
perdeva la velocità accumulata, la frusta crollava a zero e la carta faceva uno scatto
proprio sul più bello.

**La posizione di lettura viaggia col foglio.** La faccia in volo è una copia montata da
zero, quindi nasce riavvolta in cima mentre copre la pagina che si stava leggendo a metà.
Lo `scrollTop` della facciata che si stacca si legge *quando il gesto si arma* — un attimo
dopo il suo posto è già della pagina d'arrivo — e si riporta sulla copia.

**Da completare.** La dedica usa un corsivo di sistema: per farla sembrare scritta a mano
serve un font calligrafico da self-hostare in `public/valentina-orciuoli/`. Il compatto
impila le due facce dello spread in una pagina sola — funziona, ma non ha ancora un vero
ritmo di pagina per il mobile.

## Riferimenti

- [[tenant-e-verticali]]
- `src/components/tenants/valentina-orciuoli/book/book-map.ts` — l'ordine delle pagine
