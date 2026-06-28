// Contenuti tecnici completi per il blog AI Governance di PYNK STUDIO.
// Ogni articolo è una risorsa di riferimento, non una pagina SEO: intro, sezioni
// con paragrafi e liste, blocchi tecnici, takeaway operativi, FAQ e correlati.
// Tono: AI engineer che costruiscono i sistemi, non consulenti che li descrivono.

export type PynkArticleBlock = {
  caption?: string;
  lines: string[];
};

export type PynkArticleSection = {
  title: string;
  // Il body può contenere più paragrafi separati da "\n\n".
  body: string;
  bullets?: string[];
  block?: PynkArticleBlock;
};

export type PynkArticleContent = {
  readingTime: string;
  intro: string;
  sections: PynkArticleSection[];
  takeaways: string[];
  faq: Array<{ q: string; a: string }>;
  related?: string[];
};

export const blogContent: Record<string, PynkArticleContent> = {
  "come-funzionano-gli-llm": {
    readingTime: "11 min",
    intro:
      "Un Large Language Model non “capisce” il testo: predice il token successivo più probabile, uno alla volta, sulla base di tutto ciò che ha letto prima. Capire davvero questo meccanismo cambia il modo in cui progetti prompt, knowledge base e guardrail. Qui spieghiamo come funziona un LLM dal punto di vista di chi i sistemi li costruisce.",
    sections: [
      {
        title: "Predizione del token successivo",
        body:
          "Un LLM è una funzione che riceve una sequenza di token e restituisce una distribuzione di probabilità sul token successivo. Genera testo in modo autoregressivo: produce un token, lo aggiunge all'input e ripete.\n\nNon esiste una “memoria” o un “database di risposte” dentro il modello. Esiste solo una rete neurale che, dato un contesto, calcola quanto è probabile ciascun token del vocabolario. La fluidità del risultato nasce da miliardi di parametri allenati su enormi quantità di testo.",
        bullets: [
          "Input → tokenizzazione → embedding → strati Transformer → logits → distribuzione di probabilità",
          "La generazione è sequenziale: ogni token dipende da tutti i precedenti",
          "Lo stesso prompt può dare output diversi se la decodifica non è deterministica",
        ],
      },
      {
        title: "Attention: perché il contesto conta",
        body:
          "Il meccanismo di self-attention permette a ogni token di “guardare” gli altri token della sequenza e pesare quanto sono rilevanti. È il motivo per cui un LLM mantiene coerenza su frasi lunghe e collega un pronome al soggetto corretto.\n\nIn pratica: tutto ciò che metti nel contesto influenza la predizione. Istruzioni chiare, esempi e documenti recuperati spostano le probabilità verso l'output che vuoi. Contesto disordinato o contraddittorio le sposta verso output peggiori.",
      },
      {
        title: "Temperatura, top-p e determinismo",
        body:
          "Dalla distribuzione di probabilità si campiona il token finale. I parametri di decodifica controllano quanto il modello è “creativo” o ripetibile.",
        bullets: [
          "Temperature bassa (0–0.3): output stabile, adatto a estrazione dati, classificazione, funzioni",
          "Temperature alta (0.7+): output vario, adatto a brainstorming e scrittura",
          "top-p / top-k: limitano i token candidati ai più probabili",
        ],
        block: {
          caption: "Esempio di parametri per un task deterministico",
          lines: ["temperature: 0.1", "top_p: 1.0", "max_tokens: 600", "seed: 42  // dove supportato, per riproducibilità"],
        },
      },
      {
        title: "Cosa il modello NON fa",
        body:
          "Un LLM non verifica i fatti, non accede a Internet e non conosce nulla oltre i suoi dati di addestramento, a meno che tu non glielo fornisca nel contesto (RAG) o tramite strumenti (tool calling).\n\nQuesto è il punto chiave dal lato ingegneristico: l'affidabilità non si “chiede” al modello, si progetta intorno al modello con retrieval, validazioni e supervisione.",
      },
    ],
    takeaways: [
      "Un LLM predice token, non recupera risposte: l'affidabilità si costruisce intorno al modello.",
      "Tutto ciò che entra nel contesto sposta le probabilità: il prompt engineering è controllo del contesto.",
      "Usa temperature bassa per task strutturati, alta solo per output creativi.",
      "Per conoscenza aggiornata o azioni servono RAG e tool calling, non il modello da solo.",
    ],
    faq: [
      {
        q: "Un LLM ragiona davvero?",
        a: "Esegue un calcolo statistico molto sofisticato che può simulare passaggi di ragionamento, soprattutto se guidato (chain-of-thought). Ma non ha comprensione o intenzioni: produce la continuazione più probabile del testo.",
      },
      {
        q: "Perché lo stesso prompt dà risposte diverse?",
        a: "Perché la decodifica campiona dalla distribuzione di probabilità. Con temperature 0 e seed fisso l'output diventa quasi deterministico, utile per test e produzione.",
      },
      {
        q: "Serve un modello più grande per avere risposte migliori?",
        a: "Non sempre. Spesso contano di più contesto, retrieval e prompt. Un modello piccolo con buona architettura batte un modello grande mal integrato.",
      },
    ],
    related: ["cos-e-un-token", "cos-e-il-contesto", "perche-le-ai-allucinano"],
  },

  "cos-e-un-token": {
    readingTime: "8 min",
    intro:
      "Il token è l'unità di misura di tutto ciò che fai con un LLM: costo, lunghezza del contesto, latenza e perfino qualità del prompt si misurano in token. Chi progetta sistemi AI ragiona in token, non in parole.",
    sections: [
      {
        title: "Cos'è un token, concretamente",
        body:
          "Un token è un frammento di testo: può essere una parola, parte di una parola, un segno di punteggiatura o uno spazio. La tokenizzazione spezza il testo in questi frammenti prima che il modello lo elabori.\n\nRegola pratica per l'italiano e l'inglese: 1 token ≈ 0,75 parole, ovvero ~4 caratteri. Una pagina di testo è circa 500–800 token. Le lingue diverse dall'inglese tendono a usare più token per la stessa frase.",
        bullets: [
          "“governance” può diventare 2–3 token",
          "numeri lunghi, codice e URL si frammentano in molti token",
          "il testo in italiano costa in media più token dell'inglese",
        ],
      },
      {
        title: "Perché i token determinano il costo",
        body:
          "I provider fatturano per token di input e di output, di solito a prezzi diversi. Ogni messaggio inviato include l'intera conversazione e i documenti allegati: il costo cresce con il contesto, non solo con la domanda.",
        block: {
          caption: "Stima rapida del costo di una chiamata",
          lines: [
            "costo ≈ (token_input × prezzo_input) + (token_output × prezzo_output)",
            "// una chat lunga reinvia tutta la storia a ogni turno → token che crescono",
          ],
        },
      },
      {
        title: "Token e finestra di contesto",
        body:
          "La context window è il numero massimo di token che il modello può considerare in una volta (input + output). Superarla significa troncare o perdere informazioni. Gestire i token significa decidere cosa entra nel contesto e cosa no: è una scelta di architettura, non un dettaglio.",
      },
    ],
    takeaways: [
      "1 token ≈ 0,75 parole; una pagina ≈ 500–800 token.",
      "Paghi input + output: una chat lunga reinvia tutta la storia e costa di più a ogni turno.",
      "L'italiano consuma più token dell'inglese a parità di contenuto.",
      "Ottimizzare i token (riassunti, retrieval mirato) riduce costo e latenza.",
    ],
    faq: [
      {
        q: "Come riduco i costi in token?",
        a: "Comprimi la storia conversazionale con riassunti, recupera solo i documenti rilevanti (RAG mirato), accorcia i system prompt ripetuti e usa modelli più piccoli dove basta.",
      },
      {
        q: "Più context window è sempre meglio?",
        a: "No. Una finestra enorme costa di più e può peggiorare la qualità se la riempi di contenuto poco rilevante. Conta cosa metti dentro, non quanto.",
      },
    ],
    related: ["cos-e-il-contesto", "come-funzionano-gli-llm", "knowledge-base-ai"],
  },

  "cos-e-il-contesto": {
    readingTime: "9 min",
    intro:
      "Gli LLM sembrano avere memoria, ma non ce l'hanno. Quella che chiamiamo “memoria” è in realtà la finestra di contesto: tutto ciò che rientra lì viene considerato, tutto il resto non esiste per il modello. Progettare bene il contesto è metà del lavoro di un sistema AI.",
    sections: [
      {
        title: "La context window",
        body:
          "La finestra di contesto è la quantità massima di token che il modello elabora in una singola richiesta: system prompt, storia della conversazione, documenti recuperati e risposta in generazione. È condivisa tra input e output.\n\nQuando la conversazione cresce oltre la finestra, qualcosa deve essere tagliato. Se la strategia di taglio è ingenua, il modello “dimentica” informazioni importanti.",
      },
      {
        title: "La memoria è un'illusione progettata",
        body:
          "Un chatbot che ricorda i messaggi precedenti lo fa perché il sistema reinvia quei messaggi nel contesto a ogni turno. Non c'è stato persistente dentro il modello: lo stato lo gestisci tu, fuori dal modello.",
        bullets: [
          "Memoria a breve termine = storia della conversazione nel contesto",
          "Memoria a lungo termine = database + retrieval (RAG) o memorie esplicite",
          "Oltre la finestra: riassunti progressivi o recupero selettivo",
        ],
      },
      {
        title: "Strategie di gestione del contesto",
        body:
          "Riempire la finestra al massimo non è una buona idea: aumenta costi, latenza e rumore. Le strategie efficaci selezionano e comprimono.",
        bullets: [
          "Sliding window: tieni gli ultimi N messaggi rilevanti",
          "Summary memory: riassumi i turni vecchi in poche righe",
          "Retrieval-augmented: porta nel contesto solo i pezzi pertinenti",
          "Structured state: salva entità e decisioni in campi, non in prosa",
        ],
      },
      {
        title: "“Lost in the middle”",
        body:
          "I modelli tendono a usare meglio le informazioni all'inizio e alla fine del contesto rispetto a quelle in mezzo. Per questo l'ordine conta: istruzioni critiche e dati più rilevanti vanno posizionati strategicamente, non sepolti in un blocco enorme.",
      },
    ],
    takeaways: [
      "La “memoria” di un LLM è la finestra di contesto: gestita fuori dal modello, da te.",
      "Non riempire la finestra: seleziona e comprimi ciò che serve davvero.",
      "Memoria a lungo termine = retrieval + database, non un contesto più grande.",
      "L'ordine delle informazioni influenza la qualità: non sotterrare le istruzioni critiche.",
    ],
    faq: [
      {
        q: "Come fa un assistente a ricordare conversazioni passate?",
        a: "Salvando i contenuti in un database e recuperando quelli rilevanti al momento giusto (RAG o memoria semantica). Non è il modello a ricordare: è il sistema a reiniettare il contesto.",
      },
      {
        q: "Una context window più grande risolve tutto?",
        a: "No. Aiuta in alcuni casi, ma costa di più e soffre del fenomeno “lost in the middle”. Un retrieval ben fatto su finestra media spesso batte una finestra enorme riempita male.",
      },
    ],
    related: ["cos-e-un-token", "knowledge-base-ai", "vector-database"],
  },

  "perche-le-ai-allucinano": {
    readingTime: "10 min",
    intro:
      "Un'allucinazione è una risposta plausibile ma falsa. Non è un bug occasionale: è una conseguenza diretta di come funzionano gli LLM. Non si elimina, si contiene — e si contiene con architettura, non con buoni propositi.",
    sections: [
      {
        title: "Perché succede",
        body:
          "Il modello ottimizza la plausibilità linguistica, non la verità. Quando non “sa” qualcosa, non resta in silenzio: genera comunque la continuazione più probabile, che può essere inventata ma scritta con sicurezza.\n\nLe cause più comuni sono conoscenza mancante o datata, contesto ambiguo, domande fuori dominio e pressione a rispondere sempre.",
        bullets: [
          "Conoscenza non presente nei dati di training",
          "Informazioni cambiate dopo il cutoff del modello",
          "Prompt ambiguo o contraddittorio",
          "Mancanza di una fonte autorevole nel contesto",
        ],
      },
      {
        title: "Contromisure tecniche",
        body:
          "Le allucinazioni si riducono dando al modello fonti verificabili e limitando ciò che può affermare senza supporto.",
        bullets: [
          "RAG: recupera documenti reali e chiedi risposte ancorate alle fonti",
          "Citazioni obbligatorie: il modello deve indicare da dove arriva l'informazione",
          "“Non lo so” permesso: istruisci il modello a dichiarare l'incertezza",
          "Validazione output: schema, regole, controlli su numeri e nomi",
        ],
      },
      {
        title: "Guardrail e verifica",
        body:
          "Per task critici non ci si fida del singolo output. Si aggiungono controlli a valle: validazione di formato (JSON schema), confronto con regole di business, secondo passaggio di verifica e, dove serve, supervisione umana prima di azioni irreversibili.",
        block: {
          caption: "Pattern: ancorare la risposta alle fonti",
          lines: [
            "1. retrieval dei documenti pertinenti",
            "2. prompt: \"rispondi SOLO con le informazioni nei documenti; se manca, dillo\"",
            "3. validazione: ogni affermazione ha una citazione?",
            "4. fallback: se confidenza bassa → escalation umana",
          ],
        },
      },
    ],
    takeaways: [
      "Le allucinazioni sono strutturali: il modello massimizza la plausibilità, non la verità.",
      "RAG con citazioni obbligatorie è la difesa più efficace per la conoscenza aziendale.",
      "Permetti esplicitamente “non lo so”: riduce le invenzioni.",
      "Per azioni critiche: validazione automatica + human in the loop.",
    ],
    faq: [
      {
        q: "Si possono eliminare del tutto le allucinazioni?",
        a: "No. Si possono ridurre drasticamente con retrieval, citazioni, guardrail e verifica, fino a livelli accettabili per il caso d'uso. L'obiettivo è gestire il rischio, non promettere zero errori.",
      },
      {
        q: "RAG elimina le allucinazioni?",
        a: "Le riduce molto, ma il modello può ancora interpretare male le fonti o rispondere oltre ciò che è scritto. Per questo servono citazioni verificabili e controlli sull'output.",
      },
    ],
    related: ["guardrails-ai", "human-in-the-loop", "rag-vs-fine-tuning"],
  },

  "prompt-engineering": {
    readingTime: "12 min",
    intro:
      "Il prompt engineering non è trovare la frase magica: è progettare l'input in modo che l'output sia affidabile e ripetibile. In azienda un prompt è codice — va versionato, testato e mantenuto come tale.",
    sections: [
      {
        title: "Anatomia di un buon prompt",
        body:
          "Un prompt robusto separa ruolo, contesto, istruzioni, vincoli e formato di output. La struttura riduce l'ambiguità e rende il comportamento prevedibile.",
        block: {
          caption: "Struttura di riferimento",
          lines: [
            "[RUOLO]      Sei un assistente che classifica ticket di supporto.",
            "[CONTESTO]   Categorie ammesse: fatturazione, tecnico, commerciale.",
            "[ISTRUZIONI] Assegna UNA categoria. Se incerto, usa 'tecnico'.",
            "[VINCOLI]    Non inventare categorie. Non spiegare.",
            "[OUTPUT]     Rispondi solo con JSON: {\"categoria\": \"...\"}",
          ],
        },
      },
      {
        title: "Tecniche che funzionano",
        body:
          "Poche tecniche coprono la maggior parte dei casi reali. Vanno scelte in base al task, non accumulate.",
        bullets: [
          "Few-shot: 2–5 esempi corretti guidano formato e stile meglio di mille parole",
          "Chain-of-thought: chiedi i passaggi per task di ragionamento (poi nascondili)",
          "Delimitatori: separa istruzioni e dati utente per evitare ambiguità e injection",
          "Output strutturato: imponi JSON schema quando l'output va usato da codice",
        ],
      },
      {
        title: "Vincoli e sicurezza del prompt",
        body:
          "I dati dell'utente non sono istruzioni. Mescolarli con il system prompt apre la porta alla prompt injection. Vanno delimitati e trattati come contenuto da analizzare, mai come comandi da eseguire.\n\nIn produzione il prompt va testato su casi limite: input vuoti, fuori tema, malevoli, in lingue diverse.",
      },
      {
        title: "Il prompt è un artefatto di produzione",
        body:
          "Un prompt che funziona nel playground non è ancora pronto. Va versionato, valutato su un dataset di esempi (eval), monitorato e aggiornato quando cambia il modello. Trattarlo come codice è ciò che distingue un esperimento da un sistema.",
      },
    ],
    takeaways: [
      "Struttura il prompt: ruolo, contesto, istruzioni, vincoli, formato di output.",
      "Few-shot ed esempi guidano meglio di lunghe descrizioni astratte.",
      "Separa sempre dati utente dalle istruzioni: è difesa contro la prompt injection.",
      "Versiona e valuta i prompt con dataset di test: sono codice, non testo usa e getta.",
    ],
    faq: [
      {
        q: "Chain-of-thought va sempre usato?",
        a: "No. Aiuta nei task di ragionamento (matematica, logica, multi-step) ma aumenta costi e latenza ed è inutile per classificazioni semplici. Spesso lo si usa internamente e si mostra solo il risultato.",
      },
      {
        q: "Come gestisco prompt diversi per modelli diversi?",
        a: "Versionali per modello e valutali con lo stesso dataset di eval. Cambiando provider (es. da GPT a Claude) il prompt va riadattato e ritestato, non copiato.",
      },
    ],
    related: ["come-funzionano-gli-llm", "guardrails-ai", "tool-calling"],
  },

  "rag-vs-fine-tuning": {
    readingTime: "11 min",
    intro:
      "RAG e fine tuning risolvono problemi diversi e spesso vengono confusi. RAG porta conoscenza nel contesto al momento della risposta; il fine tuning modifica il comportamento del modello. Sceglierli bene evita di pagare il problema sbagliato.",
    sections: [
      {
        title: "Cosa fa il RAG",
        body:
          "Retrieval-Augmented Generation recupera documenti pertinenti da una knowledge base e li inserisce nel contesto, così il modello risponde su informazioni reali e aggiornate. La conoscenza resta esterna: la aggiorni cambiando i documenti, non il modello.",
        bullets: [
          "Ideale per conoscenza che cambia spesso (procedure, listini, FAQ, manuali)",
          "Risposte ancorabili alle fonti, quindi verificabili",
          "Aggiornamento immediato: basta reindicizzare i documenti",
        ],
      },
      {
        title: "Cosa fa il fine tuning",
        body:
          "Il fine tuning riaddestra il modello su esempi per modificarne stile, formato o comportamento ripetibile. Non serve a “insegnare fatti”: serve a far comportare il modello in un certo modo in modo consistente.",
        bullets: [
          "Ideale per tono di voce, formato rigido, task molto ripetitivi",
          "Riduce la lunghezza dei prompt se il comportamento è “interiorizzato”",
          "Richiede un dataset di qualità e va rifatto quando cambia l'obiettivo",
        ],
      },
      {
        title: "Come scegliere",
        body:
          "La domanda giusta non è “RAG o fine tuning”, ma “il mio problema è di conoscenza o di comportamento?”. Spesso la risposta è: prima RAG, fine tuning solo se resta un gap di comportamento.",
        block: {
          caption: "Regola pratica",
          lines: [
            "Problema di CONOSCENZA (cosa sa) ........ → RAG",
            "Problema di COMPORTAMENTO (come risponde) → fine tuning",
            "Entrambi ............................... → RAG + fine tuning leggero",
            "Nel dubbio ............................. → parti da RAG",
          ],
        },
      },
    ],
    takeaways: [
      "RAG = conoscenza esterna aggiornabile; fine tuning = comportamento del modello.",
      "Per conoscenza aziendale che cambia, RAG è quasi sempre la scelta giusta.",
      "Il fine tuning non insegna fatti: serve a stile, formato e consistenza.",
      "Parti da RAG; aggiungi fine tuning solo se resta un gap di comportamento.",
    ],
    faq: [
      {
        q: "Posso evitare il fine tuning del tutto?",
        a: "Nella maggior parte dei casi aziendali sì. RAG, prompt ben strutturati e tool calling coprono moltissimi scenari senza i costi e la rigidità del fine tuning.",
      },
      {
        q: "Il fine tuning riduce le allucinazioni?",
        a: "Non in modo affidabile. Anzi, può fissare comportamenti errati. Per la verità sui fatti serve RAG con fonti, non fine tuning.",
      },
    ],
    related: ["knowledge-base-ai", "vector-database", "perche-le-ai-allucinano"],
  },

  "cloud-vs-local-ai": {
    readingTime: "11 min",
    intro:
      "Cloud, locale o on-premise non è una scelta ideologica: è un trade-off tra qualità, costo, privacy, latenza e manutenzione. La risposta giusta dipende dai dati che tratti e dai vincoli reali, non dalla moda del momento.",
    sections: [
      {
        title: "AI cloud",
        body:
          "I modelli via API (OpenAI, Anthropic, Google) offrono la qualità più alta senza gestire infrastruttura. Paghi a consumo e scali subito. In cambio, i dati lasciano il perimetro aziendale e dipendi dal vendor.",
        bullets: [
          "Pro: massima qualità, zero gestione infra, time-to-market rapido",
          "Contro: dati verso terzi, costo per token, lock-in, dipendenza dalla rete",
        ],
      },
      {
        title: "AI locale / on-premise",
        body:
          "Modelli open source serviti su hardware proprio (Ollama, vLLM) tengono i dati dentro il perimetro. Sono adatti quando privacy, latenza o controllo sono prioritari, ma richiedono GPU, competenze e manutenzione.",
        bullets: [
          "Pro: dati che non escono, costo prevedibile, controllo totale, offline",
          "Contro: qualità spesso inferiore ai migliori modelli cloud, gestione hardware, serving",
        ],
      },
      {
        title: "Architettura ibrida",
        body:
          "Nella pratica molte aziende combinano i due mondi: modello locale per dati sensibili e task semplici, modello cloud per ragionamenti complessi. Un router smista la richiesta al modello giusto in base a sensibilità del dato e difficoltà del compito.",
        block: {
          caption: "Routing per sensibilità",
          lines: [
            "dato sensibile  → modello locale (on-premise)",
            "task complesso  → modello cloud di punta",
            "alto volume/semplice → modello piccolo ed economico",
          ],
        },
      },
    ],
    takeaways: [
      "La scelta dipende da dati, privacy, latenza, costo e competenze, non dalla moda.",
      "Cloud = qualità e velocità; locale = controllo e dati che non escono.",
      "L'ibrido con routing è spesso la soluzione più razionale.",
      "L'AI locale ha un costo nascosto: hardware, serving e manutenzione.",
    ],
    faq: [
      {
        q: "L'AI locale è più sicura?",
        a: "È più riservata perché i dati non escono dal perimetro, ma “sicura” dipende dalla configurazione: accessi, logging e hardening valgono anche on-premise.",
      },
      {
        q: "Un modello open source locale è abbastanza buono?",
        a: "Per molti task (classificazione, estrazione, RAG su domini chiusi) sì. Per ragionamenti complessi i migliori modelli cloud restano avanti. Si valuta con un test sul caso reale.",
      },
    ],
    related: ["open-source-vs-closed-source-ai", "come-scegliere-un-modello-ai", "architetture-ai"],
  },

  "open-source-vs-closed-source-ai": {
    readingTime: "10 min",
    intro:
      "Modelli proprietari o open source (open weight) non è una scelta di principio: è una scelta di controllo, qualità e governance. Vediamo i criteri reali per decidere, senza tifoserie.",
    sections: [
      {
        title: "Closed source (proprietari)",
        body:
          "Modelli come GPT, Claude e Gemini si usano via API. Offrono qualità di punta, aggiornamenti continui e zero gestione, ma sono una scatola chiusa: non controlli pesi, versioning interno né dove gira l'inferenza.",
        bullets: [
          "Pro: qualità al top, manutenzione del vendor, ecosistema maturo",
          "Contro: lock-in, costi a consumo, meno controllo su dati e versioni",
        ],
      },
      {
        title: "Open weight (open source)",
        body:
          "Modelli come Llama, Mistral e Qwen sono scaricabili e self-hostabili. Dai controllo su dove girano e su come vengono versionati, a costo di gestire serving, sicurezza e qualità.",
        bullets: [
          "Pro: controllo, portabilità, costo prevedibile, on-premise possibile",
          "Contro: gestione infra, qualità variabile, responsabilità di sicurezza tua",
        ],
      },
      {
        title: "Criteri di scelta in ottica governance",
        body:
          "La decisione va legata a dati, obblighi e continuità operativa, non solo ai benchmark. Un modello open weight self-hosted è più semplice da auditare e meno soggetto a cambiamenti improvvisi del vendor; un modello proprietario riduce il carico operativo ma aumenta la dipendenza.",
      },
    ],
    takeaways: [
      "Proprietari = qualità e zero gestione; open weight = controllo e portabilità.",
      "“Open source” qui significa quasi sempre open weight, non pieno open source.",
      "La scelta tocca lock-in, audit e continuità, non solo i benchmark.",
      "Spesso convivono: proprietari per i task difficili, open weight per privacy e volumi.",
    ],
    faq: [
      {
        q: "Open weight è davvero open source?",
        a: "Spesso no: sono rilasciati i pesi e una licenza d'uso, ma non sempre dati e processo di training. Per la governance conta la licenza: leggila prima di usarli in produzione.",
      },
      {
        q: "Conviene per ridurre i costi?",
        a: "A volte. Self-hosting ha senso su alti volumi e dati sensibili, ma include hardware e personale. Su volumi bassi le API restano più economiche.",
      },
    ],
    related: ["cloud-vs-local-ai", "come-scegliere-un-modello-ai", "valutazione-fornitori-ai"],
  },

  "come-scegliere-un-modello-ai": {
    readingTime: "11 min",
    intro:
      "Scegliere un modello non è guardare la classifica del momento. È valutarlo sul tuo caso d'uso reale, con i tuoi dati, i tuoi vincoli di privacy e il tuo budget. Ecco il metodo che usiamo quando progettiamo un sistema.",
    sections: [
      {
        title: "I criteri che contano davvero",
        body:
          "I benchmark pubblici danno un'idea, ma non predicono le prestazioni sul tuo task specifico. La scelta è multi-dimensionale.",
        bullets: [
          "Qualità sul TUO task (misurata, non dichiarata)",
          "Costo per token e volumi previsti",
          "Latenza accettabile per l'esperienza utente",
          "Privacy: dove possono andare i dati",
          "Context window e supporto a tool calling / output strutturato",
          "Affidabilità del vendor e rischio di lock-in",
        ],
      },
      {
        title: "Valutare con un eval, non a sensazione",
        body:
          "Il modo serio per scegliere è costruire un piccolo dataset di casi reali e misurare i modelli candidati con metriche definite. Una giornata di eval evita mesi su un modello sbagliato.",
        block: {
          caption: "Mini-eval di selezione",
          lines: [
            "1. raccogli 30–50 casi reali con output atteso",
            "2. definisci metriche (accuratezza, formato, costo, latenza)",
            "3. esegui gli stessi casi su 2–3 modelli candidati",
            "4. confronta i numeri, non le impressioni",
          ],
        },
      },
      {
        title: "Non serve il modello più potente",
        body:
          "Spesso un modello medio con buona architettura (RAG, prompt, validazione) batte il modello più grande usato male. E un sistema può usare modelli diversi per task diversi: piccolo ed economico per il volume, potente per i casi difficili.",
      },
    ],
    takeaways: [
      "Valuta sul tuo caso reale con un eval, non sui benchmark pubblici.",
      "La scelta è multi-criterio: qualità, costo, latenza, privacy, lock-in.",
      "Il modello più potente non è sempre quello giusto: conta l'architettura.",
      "Un sistema può orchestrare più modelli, uno per tipo di task.",
    ],
    faq: [
      {
        q: "Quanto spesso va rivalutata la scelta?",
        a: "I modelli evolvono in fretta. Conviene ripetere l'eval ogni pochi mesi o quando esce una versione rilevante, mantenendo il dataset di test come metro stabile.",
      },
      {
        q: "Posso cambiare modello facilmente?",
        a: "Solo se l'architettura è disaccoppiata dal provider. Un layer di astrazione (o un AI gateway) e prompt versionati per modello rendono la migrazione gestibile.",
      },
    ],
    related: ["cloud-vs-local-ai", "open-source-vs-closed-source-ai", "valutazione-fornitori-ai"],
  },

  "come-progettare-un-agente-ai": {
    readingTime: "13 min",
    intro:
      "Un agente AI non è un chatbot con un nome diverso: è un sistema in cui il modello decide quali strumenti usare e in che ordine per raggiungere un obiettivo. Più potere dai all'agente, più servono permessi, fallback e supervisione. Progettarlo bene è ingegneria, non prompt.",
    sections: [
      {
        title: "Cos'è un agente",
        body:
          "Un agente combina un modello, un insieme di strumenti (tool/funzioni) e un loop di esecuzione: il modello osserva lo stato, decide un'azione, la esegue tramite uno strumento, legge il risultato e ripete fino a completare il compito.\n\nLa differenza con un chatbot è l'autonomia: l'agente agisce sul mondo (chiama API, scrive su database, invia email), non si limita a rispondere.",
      },
      {
        title: "Strumenti, permessi e confini",
        body:
          "Ogni strumento che dai all'agente è anche una superficie di rischio. Vanno definiti permessi minimi, confini chiari e azioni reversibili dove possibile.",
        bullets: [
          "Principio del privilegio minimo: l'agente accede solo a ciò che gli serve",
          "Azioni distruttive o irreversibili → conferma umana obbligatoria",
          "Tool con input validati: l'agente non passa parametri arbitrari senza controllo",
          "Timeout e limiti: numero massimo di passi per evitare loop infiniti",
        ],
      },
      {
        title: "Memoria, fallback e supervisione",
        body:
          "Un agente robusto gestisce gli errori invece di ignorarli: se uno strumento fallisce, riprova, cambia strategia o si ferma e chiede aiuto. La memoria (stato, decisioni, risultati intermedi) va gestita esplicitamente.",
        block: {
          caption: "Loop di un agente con guardrail",
          lines: [
            "while (!done && passi < MAX) {",
            "  azione = modello.decidi(stato)",
            "  if (azione.rischiosa) → richiedi conferma umana",
            "  risultato = esegui(azione)   // con validazione input",
            "  stato = aggiorna(stato, risultato)",
            "}",
          ],
        },
      },
      {
        title: "Osservabilità: vedere cosa fa l'agente",
        body:
          "Un agente senza logging è una scatola nera che agisce sui tuoi sistemi. Servono tracce di ogni decisione, strumento chiamato, input e output, per debugging, audit e miglioramento. Senza osservabilità non c'è governance possibile.",
      },
    ],
    takeaways: [
      "Un agente agisce, non solo risponde: ogni strumento è anche un rischio.",
      "Privilegio minimo + conferma umana sulle azioni irreversibili.",
      "Gestisci esplicitamente errori, fallback, memoria e limiti di passi.",
      "Senza logging e tracciabilità un agente non è governabile.",
    ],
    faq: [
      {
        q: "Quando serve un agente e quando basta un workflow?",
        a: "Se i passi sono noti e fissi, un workflow deterministico è più affidabile e prevedibile. L'agente serve quando il percorso varia e va deciso dinamicamente. Spesso si combinano.",
      },
      {
        q: "Come evito che un agente faccia danni?",
        a: "Permessi minimi, validazione degli input degli strumenti, conferma umana sulle azioni critiche, limiti di esecuzione e logging completo. La sicurezza è nell'architettura, non nel prompt.",
      },
    ],
    related: ["tool-calling", "mcp-model-context-protocol", "human-in-the-loop"],
  },

  "ai-act-pmi": {
    readingTime: "12 min",
    intro:
      "L'AI Act spaventa più di quanto dovrebbe. Per la maggior parte delle PMI gli obblighi sono proporzionati al ruolo e al rischio dei sistemi usati. Capirli con calma evita sia il panico sia la sottovalutazione.",
    sections: [
      {
        title: "L'approccio basato sul rischio",
        body:
          "L'AI Act non regola “l'AI” in blocco: classifica i sistemi per livello di rischio e applica obblighi proporzionati. La maggior parte degli usi aziendali ricade nel rischio limitato o minimo, con obblighi leggeri.",
        bullets: [
          "Rischio inaccettabile: pratiche vietate (es. social scoring)",
          "Alto rischio: obblighi stringenti (documentazione, supervisione, qualità dati)",
          "Rischio limitato: obblighi di trasparenza (dire che è un'AI)",
          "Rischio minimo: nessun obbligo specifico",
        ],
      },
      {
        title: "Il ruolo determina gli obblighi",
        body:
          "La stessa azienda può essere provider (sviluppa/immette un sistema) o deployer (lo usa). Gli obblighi cambiano: un deployer che usa ChatGPT ha responsabilità diverse da chi costruisce e vende un prodotto AI.",
      },
      {
        title: "Cosa fare in pratica, da subito",
        body:
          "Indipendentemente dalla classificazione, alcune azioni sono utili e a basso costo, e preparano alla conformità senza bloccare il business.",
        bullets: [
          "Inventario dei sistemi AI realmente usati e dei dati che toccano",
          "AI Literacy adeguata per chi usa l'AI (Articolo 4)",
          "Regole minime su dati caricabili, accessi e supervisione",
          "Tracciabilità delle decisioni automatizzate rilevanti",
        ],
      },
    ],
    takeaways: [
      "L'AI Act è proporzionato al rischio: molti usi PMI hanno obblighi leggeri.",
      "Il ruolo (provider o deployer) cambia gli obblighi più del tipo di tool.",
      "Inventario, AI Literacy e regole minime sono il primo passo concreto.",
      "Chi progetta bene l'AI è già a metà strada verso la conformità.",
    ],
    faq: [
      {
        q: "Usare ChatGPT mi rende automaticamente ad alto rischio?",
        a: "No. L'alto rischio dipende dal caso d'uso e dagli effetti sulle persone, non dallo strumento. Usare un chatbot per supporto interno è ben diverso dal decidere assunzioni in automatico.",
      },
      {
        q: "Da dove parto se sono una PMI?",
        a: "Da un inventario dei sistemi AI usati e una valutazione preliminare di ruolo e rischio. È un'attività breve che chiarisce quali obblighi si applicano davvero.",
      },
    ],
    related: ["sistemi-ai-ad-alto-rischio", "ai-literacy-articolo-4", "ai-governance"],
  },

  "ai-literacy-articolo-4": {
    readingTime: "9 min",
    intro:
      "L'Articolo 4 dell'AI Act richiede un livello adeguato di alfabetizzazione AI per chi usa i sistemi per conto dell'organizzazione. Non è un corso unico per tutti: è competenza differenziata per ruolo. E, fatta bene, riduce i rischi reali molto più di una policy.",
    sections: [
      {
        title: "Cosa chiede l'Articolo 4",
        body:
          "L'obbligo è garantire che il personale (e altri soggetti che operano i sistemi AI per l'azienda) abbia competenze adeguate al proprio ruolo e al contesto d'uso. “Adeguato” è il punto: un developer e un addetto al customer care hanno bisogni diversi.",
      },
      {
        title: "Perché un corso unico non funziona",
        body:
          "Le competenze attese cambiano radicalmente per ruolo. Insegnare a tutti le stesse cose spreca tempo e lascia scoperti i rischi specifici.",
        bullets: [
          "Direzione: capacità di decidere casi d'uso, rischi e responsabilità",
          "IT/Sviluppatori: architettura, sicurezza, dati, integrazione",
          "Marketing/Customer care: prompt, verifica output, dati dei clienti",
          "HR: trattamento dati personali, bias, decisioni che impattano le persone",
        ],
      },
      {
        title: "Literacy come riduzione del rischio",
        body:
          "La maggior parte degli incidenti AI in azienda nasce da uso scorretto: dati sensibili incollati in un tool pubblico, output non verificati usati nei processi, prompt che espongono segreti. La literacy giusta agisce esattamente su questi comportamenti.",
      },
    ],
    takeaways: [
      "L'Articolo 4 chiede competenza adeguata, differenziata per ruolo.",
      "Un corso unico per tutti non soddisfa né l'obbligo né i rischi reali.",
      "La literacy ben fatta riduce gli incidenti più di una policy scritta.",
      "Va aggiornata: strumenti e rischi cambiano in fretta.",
    ],
    faq: [
      {
        q: "È un obbligo formale con certificazione?",
        a: "L'Articolo 4 richiede un livello adeguato di competenza, non una certificazione specifica. Conta poter dimostrare che il personale è stato formato in modo proporzionato al ruolo.",
      },
      {
        q: "Ogni quanto va aggiornata la formazione?",
        a: "Quando cambiano strumenti, processi o normativa. In un campo che evolve così in fretta, un aggiornamento periodico è più utile di un corso una tantum.",
      },
    ],
    related: ["ai-act-pmi", "ai-governance", "chatgpt-in-azienda"],
  },

  "sistemi-ai-ad-alto-rischio": {
    readingTime: "10 min",
    intro:
      "La classificazione “alto rischio” è il cuore degli obblighi pesanti dell'AI Act. Capire quando un sistema ci ricade — e quali conseguenze tecniche comporta — evita sia sorprese sia allarmismi.",
    sections: [
      {
        title: "Quando un sistema è ad alto rischio",
        body:
          "Un sistema è ad alto rischio principalmente in due casi: quando è componente di sicurezza di prodotti regolati, o quando rientra in aree elencate dall'AI Act dove può incidere su diritti e opportunità delle persone (es. occupazione, accesso a servizi essenziali, istruzione, giustizia).",
        bullets: [
          "Selezione del personale e gestione dei lavoratori",
          "Accesso a credito, servizi pubblici essenziali, istruzione",
          "Identificazione biometrica e infrastrutture critiche",
        ],
      },
      {
        title: "Cosa comporta sul piano tecnico",
        body:
          "L'alto rischio non è solo carta: impone requisiti che si traducono in architettura. Sistema di gestione del rischio, qualità e governance dei dati, documentazione tecnica, logging, trasparenza, supervisione umana e accuratezza/robustezza.",
        bullets: [
          "Tracciabilità: log delle decisioni e degli eventi",
          "Supervisione umana effettiva, non simbolica",
          "Qualità e rappresentatività dei dati di addestramento",
          "Documentazione tecnica mantenuta nel tempo",
        ],
      },
      {
        title: "Progettare per ridurre il rischio",
        body:
          "Molti requisiti dell'alto rischio coincidono con buone pratiche di ingegneria: logging, versioning, supervisione, qualità dei dati. Un sistema progettato bene parte già conforme su gran parte dei punti; un sistema improvvisato richiede di rifare tutto a posteriori.",
      },
    ],
    takeaways: [
      "L'alto rischio dipende dall'area d'uso e dall'impatto sulle persone, non dal modello.",
      "Comporta requisiti tecnici precisi: logging, supervisione, qualità dati, documentazione.",
      "Molti requisiti coincidono con buona ingegneria del software.",
      "Progettare bene fin dall'inizio costa meno che adeguare a posteriori.",
    ],
    faq: [
      {
        q: "Come faccio a sapere se rientro nell'alto rischio?",
        a: "Serve una valutazione preliminare di ruolo, area d'uso e impatto. Non si deduce dal tipo di tool: si analizza il caso d'uso concreto e gli effetti sulle persone.",
      },
      {
        q: "La supervisione umana basta a mettere in regola?",
        a: "È uno dei requisiti, ma deve essere effettiva: la persona deve poter capire, contestare e fermare la decisione. Una conferma automatica “finta” non soddisfa l'obbligo.",
      },
    ],
    related: ["ai-act-pmi", "human-in-the-loop", "auditing-sistemi-ai"],
  },

  "chatgpt-in-azienda": {
    readingTime: "11 min",
    intro:
      "ChatGPT in azienda non è un problema di tecnologia, è un problema di processo. Usato senza regole espone dati e produce output non verificati; usato bene è uno strumento di produttività enorme. La differenza la fanno configurazione, policy e formazione.",
    sections: [
      {
        title: "Il vero rischio: i dati",
        body:
          "Il rischio principale non è il modello, ma cosa ci incollano dentro le persone: dati personali, contratti, codice, segreti industriali. Senza regole e senza l'edizione giusta del prodotto, quei dati possono finire fuori dal perimetro.",
        bullets: [
          "Distingui le versioni: account consumer vs Team/Enterprise con tutele sui dati",
          "Definisci cosa può e non può essere caricato",
          "Preferisci ambienti che escludono l'uso dei dati per il training",
        ],
      },
      {
        title: "Configurazione e accessi",
        body:
          "Prima delle regole vengono le impostazioni tecniche: edizione aziendale, gestione degli accessi, data retention, eventuale disattivazione della cronologia per usi sensibili. La configurazione corretta elimina gran parte del rischio a monte.",
      },
      {
        title: "Policy e prompt",
        body:
          "Una AI Acceptable Use Policy chiara dice cosa è permesso, con quali dati e con quale supervisione. Aggiungere prompt e template aziendali standardizza gli usi ricorrenti e riduce errori e variabilità.",
        bullets: [
          "Regole su dati caricabili e casi d'uso vietati",
          "Obbligo di verifica umana sugli output usati nei processi",
          "Template di prompt per i task ricorrenti",
        ],
      },
    ],
    takeaways: [
      "Il rischio di ChatGPT è nei dati caricati, non nel modello.",
      "Edizione aziendale + configurazione corretta eliminano gran parte del rischio.",
      "Policy chiara su dati, casi d'uso e verifica degli output.",
      "Standardizza con prompt e template aziendali per ridurre errori.",
    ],
    faq: [
      {
        q: "I miei dati vengono usati per addestrare il modello?",
        a: "Dipende dall'edizione e dalle impostazioni. Le versioni business in genere escludono l'uso dei dati per il training: è il primo punto da verificare e configurare.",
      },
      {
        q: "Meglio vietarlo o governarlo?",
        a: "Vietarlo crea shadow AI: le persone lo usano comunque, di nascosto e peggio. Governarlo con edizione giusta, policy e formazione è più sicuro e più produttivo.",
      },
    ],
    related: ["claude-in-azienda", "copilot-in-azienda", "ai-governance"],
  },

  "claude-in-azienda": {
    readingTime: "9 min",
    intro:
      "Claude è un modello particolarmente forte su ragionamento, scrittura lunga e analisi di documenti, con un forte focus su sicurezza e affidabilità. Vediamo dove conviene davvero e come inserirlo in un'architettura AI governata.",
    sections: [
      {
        title: "Dove Claude è particolarmente utile",
        body:
          "I punti di forza tipici sono il lavoro su testi lunghi e complessi, l'analisi documentale, la scrittura strutturata e i task che richiedono attenzione alle istruzioni e cautela.",
        bullets: [
          "Analisi e sintesi di documenti lunghi",
          "Scrittura tecnica e redazione strutturata",
          "Task di ragionamento e tool calling affidabili",
        ],
      },
      {
        title: "Come valutarlo sul tuo caso",
        body:
          "Come per ogni modello, la scelta va misurata sul caso reale con un eval. Confronta Claude con le alternative sugli stessi casi e metriche: qualità, formato, costo, latenza. Le impressioni non bastano per una decisione di produzione.",
      },
      {
        title: "Inserirlo in un'architettura governata",
        body:
          "Claude raramente è “tutto il sistema”: è un componente. Va integrato con retrieval per la conoscenza aziendale, tool calling per le azioni, logging per la tracciabilità e guardrail per la validazione. Un layer di astrazione permette di usarlo accanto ad altri modelli.",
      },
    ],
    takeaways: [
      "Claude eccelle su documenti lunghi, scrittura e ragionamento.",
      "Valutalo con un eval sul tuo caso, non sulle impressioni.",
      "È un componente dell'architettura, non l'intero sistema.",
      "Un layer di astrazione consente di affiancarlo ad altri modelli.",
    ],
    faq: [
      {
        q: "Claude o GPT?",
        a: "Dipende dal task. Su molti casi le differenze sono piccole e contano costo e integrazione. La risposta seria arriva da un eval sui tuoi casi reali, non da una preferenza generica.",
      },
      {
        q: "Posso usare più modelli insieme?",
        a: "Sì, ed è spesso la scelta migliore: un router smista ogni richiesta al modello più adatto. Serve però un'architettura disaccoppiata dal singolo provider.",
      },
    ],
    related: ["come-scegliere-un-modello-ai", "chatgpt-in-azienda", "architetture-ai"],
  },

  "copilot-in-azienda": {
    readingTime: "10 min",
    intro:
      "Microsoft Copilot promette AI integrata in Microsoft 365, ma il suo punto critico è uno: i permessi. Copilot vede ciò che vede l'utente — e se i permessi su SharePoint e OneDrive sono disordinati, l'AI rende visibile ciò che era nascosto solo per disattenzione.",
    sections: [
      {
        title: "Copilot eredita i tuoi permessi",
        body:
          "Copilot risponde usando i documenti a cui l'utente ha accesso nel tenant Microsoft 365. Se le autorizzazioni sono troppo larghe, Copilot fa emergere file sensibili che “tecnicamente” l'utente poteva vedere ma che nessuno cercava. Il problema non lo crea l'AI: lo rende visibile.",
        bullets: [
          "Permessi ereditati da SharePoint, OneDrive, Teams, Exchange",
          "Oversharing storico che diventa improvvisamente “interrogabile”",
          "Serve una bonifica dei permessi prima del rollout",
        ],
      },
      {
        title: "Preparare il tenant",
        body:
          "Prima di abilitare Copilot conviene mettere ordine: revisione delle condivisioni, etichette di sensibilità, gestione dei siti e dei gruppi, principio del privilegio minimo. È un lavoro di data governance che paga al di là dell'AI.",
      },
      {
        title: "Governance e formazione",
        body:
          "Dopo la configurazione servono regole d'uso e formazione: cosa chiedere, come verificare gli output, come trattare i dati. Copilot amplifica la produttività ma anche gli errori di chi non sa verificare ciò che produce.",
      },
    ],
    takeaways: [
      "Copilot vede ciò che vede l'utente: i permessi sono il rischio numero uno.",
      "Bonifica condivisioni e oversharing su Microsoft 365 prima del rollout.",
      "Etichette di sensibilità e privilegio minimo riducono l'esposizione.",
      "Formazione e regole d'uso completano la configurazione tecnica.",
    ],
    faq: [
      {
        q: "Copilot espone dati che non dovrei vedere?",
        a: "No: mostra solo ciò a cui hai già accesso. Il problema è che molti tenant hanno permessi troppo larghi, e Copilot rende quei dati facilmente trovabili. La soluzione è sistemare i permessi.",
      },
      {
        q: "Da dove parto prima di abilitarlo?",
        a: "Da una revisione dei permessi e delle condivisioni su SharePoint/OneDrive e dall'applicazione delle etichette di sensibilità. È il prerequisito tecnico del rollout.",
      },
    ],
    related: ["gemini-in-azienda", "ai-governance", "logging-sistemi-ai"],
  },

  "gemini-in-azienda": {
    readingTime: "9 min",
    intro:
      "Gemini porta l'AI dentro Google Workspace e nei servizi Google Cloud. Come per Copilot, il valore è nell'integrazione con i dati aziendali — e come per Copilot, la sfida sono permessi, governance dei dati e casi d'uso realistici.",
    sections: [
      {
        title: "Integrazione con Google Workspace",
        body:
          "Gemini lavora dentro Gmail, Docs, Drive, Meet e i servizi correlati, oltre che via API su Google Cloud. La forza è la continuità con i dati e i flussi già presenti in Workspace.",
      },
      {
        title: "Permessi e governance dei dati",
        body:
          "Anche qui l'AI opera sui dati a cui l'utente ha accesso. Condivisioni troppo aperte su Drive diventano un rischio quando i contenuti diventano interrogabili. Una revisione di permessi e condivisioni è un prerequisito, non un'opzione.",
        bullets: [
          "Revisione delle condivisioni su Drive e unità condivise",
          "Controllo dei dati che escono dal perimetro e residenza dati",
          "Casi d'uso definiti, non “AI ovunque” senza criterio",
        ],
      },
      {
        title: "Casi d'uso realistici",
        body:
          "I migliori risultati arrivano da usi delimitati: sintesi di documenti, bozze di email, supporto alla scrittura, analisi su dati strutturati. Definire i casi d'uso e verificare gli output evita il classico “entusiasmo iniziale, poi abbandono”.",
      },
    ],
    takeaways: [
      "Gemini brilla nell'integrazione con Google Workspace e Cloud.",
      "I permessi su Drive sono il primo punto di governance da sistemare.",
      "Definisci casi d'uso delimitati invece di “AI ovunque”.",
      "Verifica sempre gli output prima di usarli nei processi.",
    ],
    faq: [
      {
        q: "Gemini o Copilot per la mia azienda?",
        a: "Dipende dall'ecosistema: se lavori su Google Workspace, Gemini è più naturale; su Microsoft 365, Copilot. La scelta segue i dati e gli strumenti già in uso.",
      },
      {
        q: "I dati restano in Europa?",
        a: "Dipende dalla configurazione e dai servizi: la residenza e il trattamento dei dati vanno verificati e impostati esplicitamente, soprattutto per dati personali o sensibili.",
      },
    ],
    related: ["copilot-in-azienda", "chatgpt-in-azienda", "ai-governance"],
  },

  "mcp-model-context-protocol": {
    readingTime: "11 min",
    intro:
      "MCP (Model Context Protocol) è uno standard aperto per collegare modelli AI a strumenti, dati e sistemi in modo uniforme. Invece di scrivere un'integrazione custom per ogni tool, esponi le capacità tramite un protocollo comune. Cambia il modo in cui si costruiscono agenti e assistenti.",
    sections: [
      {
        title: "Il problema che risolve",
        body:
          "Senza uno standard, ogni connessione modello-strumento è un'integrazione su misura: tante combinazioni, tanta manutenzione. MCP introduce un'interfaccia comune tra client (l'app/agente) e server (che espongono tool, risorse e prompt), così le integrazioni diventano componibili e riutilizzabili.",
      },
      {
        title: "Come è fatto",
        body:
          "Un server MCP espone tre tipi di capacità che il modello può usare in modo standardizzato.",
        bullets: [
          "Tools: funzioni che il modello può invocare (query, azioni, calcoli)",
          "Resources: dati e documenti che il modello può leggere",
          "Prompts: template riutilizzabili lato server",
        ],
        block: {
          caption: "Architettura concettuale",
          lines: [
            "Agente/Client  ⇄  MCP  ⇄  Server (CRM)",
            "                     ⇄  Server (database)",
            "                     ⇄  Server (file system)",
            "// un protocollo, molti server intercambiabili",
          ],
        },
      },
      {
        title: "Perché conta per la governance",
        body:
          "MCP rende le capacità di un agente esplicite e centralizzate: si vede quali tool e quali dati sono esposti, si applicano permessi e logging a livello di server, si sostituisce un'integrazione senza riscrivere l'agente. Standardizzare le connessioni è anche standardizzare i controlli.",
      },
    ],
    takeaways: [
      "MCP è un'interfaccia standard tra modelli e strumenti/dati.",
      "Espone tools, resources e prompts in modo componibile e riutilizzabile.",
      "Riduce le integrazioni custom e la loro manutenzione.",
      "Centralizza permessi e logging: utile per sicurezza e governance.",
    ],
    faq: [
      {
        q: "MCP sostituisce il tool calling?",
        a: "No, lo standardizza. Il tool calling è il meccanismo con cui il modello invoca funzioni; MCP è il protocollo che definisce come quelle funzioni e quei dati vengono esposti e collegati.",
      },
      {
        q: "Mi serve davvero?",
        a: "Più crescono gli strumenti e i sistemi da collegare, più conviene. Per un singolo tool è sovradimensionato; per un ecosistema di agenti e integrazioni riduce molto complessità e manutenzione.",
      },
    ],
    related: ["tool-calling", "come-progettare-un-agente-ai", "architetture-ai"],
  },

  "tool-calling": {
    readingTime: "10 min",
    intro:
      "Il tool calling è ciò che trasforma un modello da “generatore di testo” a “sistema che agisce”. Il modello non esegue codice: decide quale funzione chiamare e con quali argomenti, e il tuo sistema la esegue. Capire questo confine è essenziale per costruire agenti sicuri.",
    sections: [
      {
        title: "Come funziona davvero",
        body:
          "Fornisci al modello la descrizione di alcune funzioni (nome, scopo, parametri). Il modello, quando serve, risponde non con testo ma con una richiesta strutturata: “chiama questa funzione con questi argomenti”. È il tuo codice a eseguirla e a restituire il risultato al modello.",
        block: {
          caption: "Ciclo del tool calling",
          lines: [
            "1. definisci le funzioni (schema dei parametri)",
            "2. il modello decide: call get_ordine(id=123)",
            "3. il TUO codice esegue la funzione (con validazione)",
            "4. restituisci il risultato al modello",
            "5. il modello formula la risposta finale",
          ],
        },
      },
      {
        title: "Il modello propone, tu disponi",
        body:
          "Punto cruciale di sicurezza: il modello non esegue nulla. Propone una chiamata; il controllo resta nel tuo codice. Questo significa che validazione, permessi e limiti vivono lato applicazione, dove devono stare.",
        bullets: [
          "Valida sempre gli argomenti proposti dal modello",
          "Applica permessi: non tutte le funzioni per tutti i contesti",
          "Azioni irreversibili → conferma esplicita",
        ],
      },
      {
        title: "Output strutturato e affidabilità",
        body:
          "Il tool calling sfrutta l'output strutturato (JSON conforme a uno schema). Più lo schema è preciso, più la chiamata è affidabile. Per integrazioni con CRM, ERP o database, l'output strutturato è ciò che rende il sistema usabile da codice e non solo da umani.",
      },
    ],
    takeaways: [
      "Il modello decide la chiamata; il tuo codice la esegue: il controllo resta tuo.",
      "Valida sempre gli argomenti e applica permessi lato applicazione.",
      "Azioni irreversibili richiedono conferma esplicita.",
      "Schemi precisi = chiamate più affidabili e integrazioni robuste.",
    ],
    faq: [
      {
        q: "Il modello può eseguire codice da solo?",
        a: "No. Propone quale funzione chiamare e con quali parametri; l'esecuzione è sempre nel tuo sistema. È questo confine a rendere il tool calling governabile.",
      },
      {
        q: "Come evito che chiami la funzione sbagliata?",
        a: "Descrizioni chiare delle funzioni, schemi di parametri rigorosi, validazione degli argomenti e permessi per contesto. E test sui casi limite, come per ogni integrazione.",
      },
    ],
    related: ["come-progettare-un-agente-ai", "mcp-model-context-protocol", "guardrails-ai"],
  },

  "vector-database": {
    readingTime: "11 min",
    intro:
      "Un vector database è il motore di memoria semantica dietro il RAG. Invece di cercare parole esatte, cerca per significato. Capire embedding, similarità e chunking è ciò che separa un RAG che funziona da uno che restituisce risultati a caso.",
    sections: [
      {
        title: "Embedding e ricerca semantica",
        body:
          "Un embedding è la rappresentazione numerica (un vettore) del significato di un testo. Testi simili producono vettori vicini. Il vector database indicizza questi vettori e, data una domanda, trova i contenuti semanticamente più vicini — anche se non condividono le stesse parole.",
        bullets: [
          "“Come resetto la password” trova “procedura di recupero credenziali”",
          "La similarità si misura con metriche come il coseno",
          "Non sostituisce la ricerca per parole chiave: spesso si combinano (hybrid search)",
        ],
      },
      {
        title: "Chunking: il fattore decisivo",
        body:
          "I documenti vanno spezzati in pezzi (chunk) prima di essere indicizzati. La dimensione e i confini dei chunk influenzano enormemente la qualità: chunk troppo grandi diluiscono il significato, troppo piccoli perdono contesto. È qui che molti RAG falliscono.",
        bullets: [
          "Spezza per struttura logica (sezioni, paragrafi), non a caratteri fissi",
          "Sovrapposizione (overlap) per non tagliare le frasi a metà",
          "Metadata sui chunk (fonte, data, permessi) per filtrare e citare",
        ],
      },
      {
        title: "Metadata filtering e permessi",
        body:
          "Un vector database serio non recupera solo per similarità: filtra per metadata. Questo permette di limitare il retrieval ai documenti che l'utente può vedere, alla versione corrente, alla lingua giusta. Senza filtri sui permessi, il RAG può esporre contenuti riservati.",
      },
    ],
    takeaways: [
      "Gli embedding cercano per significato, non per parole esatte.",
      "Il chunking è il fattore che fa o rompe la qualità del RAG.",
      "I metadata abilitano filtri per permessi, versione e lingua.",
      "Spesso la ricerca ibrida (semantica + keyword) batte la sola semantica.",
    ],
    faq: [
      {
        q: "Quale vector database scegliere?",
        a: "Dipende dai volumi e dallo stack. pgvector su PostgreSQL è ottimo quando i dati sono già lì e i volumi sono medi; soluzioni dedicate servono su scala molto grande. Si sceglie sul caso, non per moda.",
      },
      {
        q: "Perché il mio RAG restituisce risultati irrilevanti?",
        a: "Quasi sempre è un problema di chunking o di mancanza di filtri sui metadata, non del database. Sistemare la pipeline di indicizzazione risolve la maggior parte dei casi.",
      },
    ],
    related: ["knowledge-base-ai", "rag-vs-fine-tuning", "cos-e-il-contesto"],
  },

  "knowledge-base-ai": {
    readingTime: "11 min",
    intro:
      "La qualità di un assistente AI dipende più dalla knowledge base che dal modello. Documenti disordinati, duplicati o non aggiornati producono risposte sbagliate per quanto buono sia l'LLM. Progettare la knowledge base è progettare le risposte.",
    sections: [
      {
        title: "Garbage in, garbage out",
        body:
          "Il RAG recupera ciò che gli dai. Se la fonte è obsoleta, contraddittoria o piena di rumore (intestazioni, boilerplate, versioni vecchie), il modello risponderà di conseguenza, con sicurezza. Pulire e strutturare le fonti è il lavoro che paga di più.",
      },
      {
        title: "Progettare documenti per il retrieval",
        body:
          "I documenti pensati per gli umani non sono ottimali per il retrieval. Conviene strutturarli in unità autocontenute, con titoli chiari e senza dipendenze implicite dal contesto del documento intero.",
        bullets: [
          "Una sezione = un'idea autocontenuta",
          "Titoli espliciti e coerenti (ottimi per il chunking)",
          "Rimuovi boilerplate, intestazioni ripetute, contenuti scaduti",
          "Versiona: una sola fonte di verità per ogni informazione",
        ],
      },
      {
        title: "Aggiornamento e permessi",
        body:
          "Una knowledge base è viva: cambia, e con essa devono cambiare gli indici. Serve un processo di reindicizzazione quando i documenti si aggiornano, e metadata di permesso per garantire che il retrieval rispetti chi può vedere cosa.",
        block: {
          caption: "Pipeline di una knowledge base RAG",
          lines: [
            "fonti → pulizia → chunking → embedding → indice vettoriale",
            "          ↑ versioning            ↑ metadata (fonte, data, permessi)",
            "query utente → retrieval filtrato → contesto → risposta citata",
          ],
        },
      },
    ],
    takeaways: [
      "La knowledge base conta più del modello: garbage in, garbage out.",
      "Struttura i documenti in unità autocontenute con titoli chiari.",
      "Una sola fonte di verità per informazione, versionata.",
      "Reindicizza agli aggiornamenti e applica permessi tramite metadata.",
    ],
    faq: [
      {
        q: "Posso buttare dentro tutti i documenti aziendali?",
        a: "È il modo più rapido per ottenere un RAG mediocre. Selezionare fonti autorevoli, rimuovere duplicati e versioni vecchie e strutturare i contenuti dà risultati molto migliori di un mucchio indistinto.",
      },
      {
        q: "Ogni quanto va aggiornata?",
        a: "Quando cambiano le informazioni di riferimento. L'ideale è una reindicizzazione automatica collegata agli aggiornamenti delle fonti, così le risposte non restano indietro.",
      },
    ],
    related: ["vector-database", "rag-vs-fine-tuning", "perche-le-ai-allucinano"],
  },

  "human-in-the-loop": {
    readingTime: "9 min",
    intro:
      "Human in the loop non significa “un umano controlla tutto”: significa inserire supervisione nei punti giusti, dove l'errore conta. Troppa supervisione uccide i benefici dell'AI; troppo poca crea rischi. Il design è scegliere dove l'umano serve davvero.",
    sections: [
      {
        title: "Dove inserire l'umano",
        body:
          "La supervisione costa tempo: va concentrata dove il valore o il rischio sono alti. Le decisioni reversibili e a basso impatto possono restare automatiche; quelle irreversibili o ad alto impatto richiedono un occhio umano.",
        bullets: [
          "Azioni irreversibili (pagamenti, invii, cancellazioni)",
          "Decisioni che impattano persone (HR, credito, accessi)",
          "Output a bassa confidenza o fuori distribuzione",
          "Casi nuovi non ancora coperti da regole",
        ],
      },
      {
        title: "Pattern di supervisione",
        body:
          "Non esiste un solo modo di mettere l'umano nel loop. Si sceglie in base al trade-off tra velocità e controllo.",
        bullets: [
          "Approvazione preventiva: l'umano conferma prima dell'azione",
          "Revisione a campione: controllo su una percentuale di output",
          "Escalation: automatico finché la confidenza è alta, umano sotto soglia",
          "Override: l'umano può sempre correggere e fermare",
        ],
      },
      {
        title: "Supervisione effettiva, non simbolica",
        body:
          "Una conferma che la persona clicca senza capire non è supervisione: è un alibi. Perché sia reale, l'umano deve avere contesto, spiegazione e potere di dire no. È anche un requisito per i sistemi ad alto rischio dell'AI Act.",
      },
    ],
    takeaways: [
      "Metti l'umano dove l'errore conta, non ovunque.",
      "Scegli il pattern (approvazione, campione, escalation) per il caso.",
      "Le azioni irreversibili o ad alto impatto richiedono conferma.",
      "La supervisione deve essere effettiva: contesto, spiegazione, potere di fermare.",
    ],
    faq: [
      {
        q: "L'human in the loop non annulla i vantaggi dell'AI?",
        a: "Solo se mal progettato. Concentrando la supervisione sui pochi casi critici, l'AI automatizza la maggior parte del lavoro e l'umano interviene dove serve davvero.",
      },
      {
        q: "Come decido le soglie di escalation?",
        a: "Partendo dai dati: misuri la confidenza e l'errore sui casi reali e tari le soglie per bilanciare rischio e volume di intervento umano. Si aggiustano nel tempo.",
      },
    ],
    related: ["guardrails-ai", "come-progettare-un-agente-ai", "sistemi-ai-ad-alto-rischio"],
  },

  "guardrails-ai": {
    readingTime: "10 min",
    intro:
      "I guardrail sono i controlli che stanno tra il modello e il mondo reale: validano input e output, bloccano comportamenti indesiderati, garantiscono formati corretti. Senza guardrail un sistema AI è un prototipo; con i guardrail diventa un sistema di produzione.",
    sections: [
      {
        title: "Guardrail in input",
        body:
          "Prima ancora di arrivare al modello, l'input va filtrato: prompt injection, contenuti fuori tema, dati sensibili da non inoltrare. Trattare l'input come potenzialmente ostile è il punto di partenza.",
        bullets: [
          "Difesa da prompt injection (separare dati e istruzioni)",
          "Filtri su contenuti vietati o fuori ambito",
          "Rilevamento e mascheramento di dati sensibili",
        ],
      },
      {
        title: "Guardrail in output",
        body:
          "L'output del modello non si usa al volo: si valida. Formato, presenza di citazioni, coerenza con le regole di business, assenza di contenuti vietati. Se l'output non passa, si rigenera, si corregge o si escala.",
        bullets: [
          "Validazione di schema (JSON conforme)",
          "Controlli di business (valori ammessi, vincoli, range)",
          "Citazioni e ancoraggio alle fonti per i fatti",
          "Filtri su tossicità, dati personali, contenuti vietati",
        ],
        block: {
          caption: "Catena di validazione dell'output",
          lines: [
            "output → valida schema → ok?",
            "        → applica regole business → ok?",
            "        → verifica citazioni → ok?",
            "NO in qualsiasi punto → rigenera / correggi / escala a umano",
          ],
        },
      },
      {
        title: "Guardrail come codice, non come prompt",
        body:
          "Chiedere al modello “per favore non sbagliare” non è un guardrail. Un guardrail è codice deterministico che verifica e blocca. Il prompt riduce la probabilità di errore; il guardrail garantisce che l'errore non passi.",
      },
    ],
    takeaways: [
      "I guardrail validano input e output: rendono un prototipo un sistema di produzione.",
      "Tratta l'input come ostile: difesa da injection e dati sensibili.",
      "Valida l'output con schema, regole di business e citazioni.",
      "Un guardrail è codice deterministico, non una richiesta gentile nel prompt.",
    ],
    faq: [
      {
        q: "I guardrail rallentano il sistema?",
        a: "Aggiungono controlli, ma la maggior parte è leggera (validazione di schema, regole). Il costo è minimo rispetto al rischio di mandare in produzione output non verificati.",
      },
      {
        q: "Bastano i guardrail del provider?",
        a: "Coprono sicurezza di base, ma le regole di business e i vincoli del tuo dominio li conosci solo tu. I guardrail applicativi sono indispensabili oltre quelli di piattaforma.",
      },
    ],
    related: ["perche-le-ai-allucinano", "human-in-the-loop", "tool-calling"],
  },

  "ai-governance": {
    readingTime: "12 min",
    intro:
      "AI Governance non è scrivere una policy: è l'insieme di processi, ruoli, architettura e controlli che permettono di usare l'AI in modo affidabile, sicuro e tracciabile. È ciò che trasforma esperimenti sparsi in un sistema aziendale governato. E nasce dall'ingegneria, non dalla burocrazia.",
    sections: [
      {
        title: "Cosa comprende davvero",
        body:
          "La governance copre l'intero ciclo di vita dei sistemi AI: dalla decisione su quali strumenti entrano in azienda, alla loro architettura, ai controlli operativi. Documentazione e policy sono una parte; il valore è nei controlli applicati.",
        bullets: [
          "Inventario: quali sistemi AI esistono e cosa toccano",
          "Ruoli e responsabilità: chi decide, chi approva, chi controlla",
          "Architettura: dati, accessi, logging, versioning",
          "Operatività: audit, supervisione, miglioramento continuo",
        ],
      },
      {
        title: "Perché serve",
        body:
          "Senza governance nasce la shadow AI: strumenti adottati dai singoli, dati esposti, output usati senza verifica, nessuna tracciabilità. Il rischio non è teorico: è la normalità in chi adotta l'AI senza processo. La governance riduce questo rischio rendendo espliciti owner, regole e controlli.",
      },
      {
        title: "Governance e conformità",
        body:
          "Una buona governance rende la conformità (AI Act incluso) molto più semplice, perché molti requisiti normativi sono già soddisfatti dai controlli tecnici: logging, supervisione, qualità dei dati, documentazione. La conformità diventa una conseguenza, non un progetto separato.",
      },
      {
        title: "Chi costruisce governa meglio",
        body:
          "La governance applicata richiede di entrare nei sistemi: accessi, log, versioni, integrazioni. Chi quei sistemi li progetta e li sviluppa può applicare controlli reali nel codice, non solo descriverli in un documento. È la differenza tra governance praticata e governance dichiarata.",
      },
    ],
    takeaways: [
      "Governance = processi + ruoli + architettura + controlli, non solo policy.",
      "Senza governance domina la shadow AI: dati esposti e nessuna tracciabilità.",
      "Logging, supervisione e versioning sono il cuore tecnico della governance.",
      "Chi costruisce i sistemi può applicare controlli reali, non solo documentarli.",
    ],
    faq: [
      {
        q: "AI Governance è solo conformità all'AI Act?",
        a: "No. L'AI Act è una conseguenza. La governance è architettura, dati, ruoli, workflow, accessi, logging e manutenzione: rende i sistemi affidabili, e di conseguenza più facili da mettere in regola.",
      },
      {
        q: "Da dove si parte?",
        a: "Da un inventario dei sistemi AI realmente usati e da una valutazione di rischi e ruoli. Poi si definiscono controlli tecnici e processi proporzionati, partendo dai casi a maggior impatto.",
      },
    ],
    related: ["logging-sistemi-ai", "auditing-sistemi-ai", "ai-act-pmi"],
  },

  "bias-nei-sistemi-ai": {
    readingTime: "10 min",
    intro:
      "Il bias non è solo un problema etico: è un problema tecnico e legale con conseguenze reali su persone e decisioni. Nasce dai dati, dal prompt, dal retrieval e dal modo in cui usi gli output. Si gestisce misurandolo, non negandolo.",
    sections: [
      {
        title: "Dove nasce il bias",
        body:
          "Il bias non sta solo nel modello: attraversa tutta la pipeline. I dati di addestramento riflettono il mondo da cui provengono; il retrieval può favorire certe fonti; il prompt può orientare; l'uso degli output può amplificare disparità.",
        bullets: [
          "Dati di training non rappresentativi",
          "Knowledge base sbilanciata verso certe fonti",
          "Prompt che inducono assunzioni",
          "Decisioni automatizzate che amplificano disparità storiche",
        ],
      },
      {
        title: "Misurare prima di correggere",
        body:
          "Il bias non si gestisce a sensazione. Si definiscono casi di test su gruppi diversi e si misurano le differenze di comportamento del sistema. Senza misura, ogni intervento è un'opinione.",
      },
      {
        title: "Mitigazioni concrete",
        body:
          "Le contromisure agiscono su più livelli della pipeline, non solo sul modello.",
        bullets: [
          "Dataset di valutazione bilanciati e casi limite",
          "Retrieval da fonti diverse e bilanciate",
          "Human in the loop sulle decisioni che impattano le persone",
          "Logging delle decisioni per audit e correzione",
        ],
      },
    ],
    takeaways: [
      "Il bias attraversa tutta la pipeline: dati, retrieval, prompt, uso.",
      "Va misurato con test su gruppi diversi, non negato o presunto assente.",
      "Le decisioni che impattano persone richiedono supervisione umana.",
      "Il logging delle decisioni è prerequisito per audit e correzione.",
    ],
    faq: [
      {
        q: "Posso eliminare del tutto il bias?",
        a: "No, ma puoi misurarlo, ridurlo e tenerlo sotto controllo. L'obiettivo è gestire il rischio in modo documentato, non promettere un sistema “neutro” che non esiste.",
      },
      {
        q: "È un problema solo per HR e credito?",
        a: "È più critico dove le decisioni impattano le persone, ma può influenzare anche supporto, prioritizzazione e analisi. Vale la pena valutarlo ovunque l'output guidi scelte rilevanti.",
      },
    ],
    related: ["sistemi-ai-ad-alto-rischio", "human-in-the-loop", "auditing-sistemi-ai"],
  },

  "valutazione-fornitori-ai": {
    readingTime: "11 min",
    intro:
      "Scegliere un fornitore AI non è scegliere il modello migliore: è valutare dati, contratti, sicurezza, continuità e lock-in. Un vendor sbagliato si paga per anni. Ecco la checklist tecnica che usiamo prima di affidare un sistema a un fornitore.",
    sections: [
      {
        title: "Dati e privacy",
        body:
          "La prima domanda è sempre: cosa succede ai miei dati? Vanno verificati trattamento, residenza, uso per il training, retention e sub-fornitori. Un vendor che non risponde con chiarezza su questo è già una risposta.",
        bullets: [
          "I dati vengono usati per addestrare modelli?",
          "Dove sono trattati e conservati (residenza)?",
          "Per quanto tempo vengono conservati e come si cancellano?",
        ],
      },
      {
        title: "Tecnica, sicurezza e continuità",
        body:
          "Oltre ai dati, conta la solidità tecnica e operativa: API stabili e documentate, certificazioni di sicurezza, SLA, gestione degli incidenti, roadmap. Un fornitore può sparire, cambiare prezzi o deprecare un modello: la continuità va valutata prima.",
        bullets: [
          "API documentate, versionate e stabili",
          "Sicurezza: certificazioni, gestione accessi, audit log",
          "SLA, supporto e gestione degli incidenti",
          "Solidità dell'azienda e roadmap del prodotto",
        ],
      },
      {
        title: "Lock-in: il costo nascosto",
        body:
          "Il lock-in è il rischio più sottovalutato. Se l'intera architettura dipende da un solo provider, cambiarlo diventa proibitivo. Un'architettura disaccoppiata (layer di astrazione, prompt versionati, dati portabili) mantiene il potere contrattuale dalla tua parte.",
      },
    ],
    takeaways: [
      "Valuta dati, sicurezza, contratti e continuità, non solo la qualità del modello.",
      "Chiedi chiarezza su uso dei dati, residenza e retention: è un test del vendor.",
      "Verifica stabilità delle API, SLA e gestione incidenti.",
      "Disaccoppia l'architettura per evitare il lock-in: è potere contrattuale.",
    ],
    faq: [
      {
        q: "Meglio un solo fornitore o più fornitori?",
        a: "Un'architettura che può usare più provider riduce il rischio di lock-in e di interruzione, a costo di un po' più di complessità. Per sistemi critici, la portabilità ripaga.",
      },
      {
        q: "Come confronto fornitori in modo oggettivo?",
        a: "Con una checklist su dati, sicurezza, continuità e costi, più un eval tecnico sul tuo caso reale. Decisione documentata, non basata sulla demo più convincente.",
      },
    ],
    related: ["come-scegliere-un-modello-ai", "open-source-vs-closed-source-ai", "ai-governance"],
  },

  "logging-sistemi-ai": {
    readingTime: "10 min",
    intro:
      "Senza logging un sistema AI è una scatola nera: non puoi fare debugging, non puoi auditare, non puoi migliorare. Ma loggare male è un rischio privacy. Loggare bene significa decidere cosa registrare, cosa no e per quanto.",
    sections: [
      {
        title: "Perché loggare",
        body:
          "I log sono la base di tutto ciò che viene dopo: capire perché il sistema ha risposto così, dimostrare cosa è successo in un audit, individuare degradi di qualità, ricostruire un incidente. Un sistema AI senza log non è governabile e non è migliorabile.",
        bullets: [
          "Debugging: ricostruire input, contesto e decisioni",
          "Audit: evidenza di cosa ha fatto il sistema e quando",
          "Qualità: rilevare drift e degradi nel tempo",
        ],
      },
      {
        title: "Cosa loggare (e cosa no)",
        body:
          "Loggare tutto è un rischio; loggare niente è cecità. Il punto è registrare ciò che serve a debugging e audit minimizzando i dati personali.",
        bullets: [
          "Sì: prompt di sistema, versione modello/prompt, tool chiamati, esiti, metriche",
          "Con cautela: input utente (maschera/anonimizza i dati personali)",
          "Definisci retention: per quanto tempo e con quali accessi",
          "Proteggi i log come dati sensibili: accessi e cifratura",
        ],
      },
      {
        title: "Logging e privacy insieme",
        body:
          "Il logging non è in contrasto con la privacy se progettato bene: mascheramento dei dati personali, minimizzazione, retention definita e accessi controllati permettono di avere tracciabilità senza creare un nuovo archivio di dati a rischio.",
      },
    ],
    takeaways: [
      "Senza log non c'è debugging, audit né miglioramento possibile.",
      "Logga versioni, tool, esiti e metriche; tratta con cautela i dati utente.",
      "Definisci retention e proteggi i log come dati sensibili.",
      "Mascheramento e minimizzazione conciliano tracciabilità e privacy.",
    ],
    faq: [
      {
        q: "Loggare gli input degli utenti viola la privacy?",
        a: "Solo se fatto senza criterio. Con anonimizzazione, mascheramento dei dati personali, retention limitata e accessi controllati si ottiene tracciabilità rispettando la privacy.",
      },
      {
        q: "Cosa serve assolutamente loggare?",
        a: "Almeno: versione del modello e del prompt, strumenti chiamati con esito, metriche di qualità e gli eventi rilevanti per l'audit. È il minimo per poter spiegare e migliorare il sistema.",
      },
    ],
    related: ["auditing-sistemi-ai", "ai-governance", "guardrails-ai"],
  },

  "auditing-sistemi-ai": {
    readingTime: "10 min",
    intro:
      "Auditare un sistema AI significa poter rispondere, in qualsiasi momento, alla domanda: cosa ha fatto, perché, con quale versione e su quali dati? Senza audit trail non c'è responsabilità, e senza responsabilità non c'è governance.",
    sections: [
      {
        title: "Cos'è un audit trail",
        body:
          "L'audit trail è la registrazione strutturata e immutabile degli eventi rilevanti: decisioni del sistema, versioni di modello e prompt, dati usati, interventi umani. È ciò che permette di ricostruire a posteriori cosa è successo, in modo affidabile.",
      },
      {
        title: "Versioning di modelli, prompt e knowledge base",
        body:
          "Un sistema AI cambia in continuazione: il provider aggiorna il modello, tu modifichi un prompt, la knowledge base si arricchisce. Senza versioning, non puoi sapere quale combinazione ha prodotto un certo output. Versionare ogni componente è la base dell'auditabilità.",
        bullets: [
          "Versione del modello usata per ogni risposta",
          "Versione del prompt e delle istruzioni",
          "Stato della knowledge base al momento della risposta",
          "Cambiamenti di configurazione tracciati",
        ],
      },
      {
        title: "Audit periodici",
        body:
          "Oltre alla tracciabilità continua, servono verifiche periodiche: qualità degli output su un set di valutazione, rispetto delle policy, presenza di drift, aderenza ai requisiti. L'audit non è solo per il regolatore: è il meccanismo con cui il sistema resta affidabile nel tempo.",
      },
    ],
    takeaways: [
      "L'audit trail registra cosa, perché, con quale versione e su quali dati.",
      "Senza versioning di modello, prompt e KB non c'è auditabilità reale.",
      "Gli audit periodici intercettano drift e violazioni di policy.",
      "L'audit serve alla qualità, non solo al regolatore.",
    ],
    faq: [
      {
        q: "Differenza tra logging e auditing?",
        a: "Il logging registra gli eventi; l'auditing usa quei log (più versioning e verifiche) per dimostrare e valutare il comportamento del sistema. Il logging è la materia prima, l'audit è l'analisi.",
      },
      {
        q: "Ogni quanto fare un audit?",
        a: "Dipende dal rischio del sistema: i sistemi più critici vanno verificati con cadenza regolare e a ogni cambio rilevante di modello, prompt o dati. Per i sistemi ad alto rischio è un requisito.",
      },
    ],
    related: ["logging-sistemi-ai", "ai-governance", "sistemi-ai-ad-alto-rischio"],
  },

  "architetture-ai": {
    readingTime: "12 min",
    intro:
      "Un'architettura AI è ciò che sta tra un prototipo e un sistema di produzione. Definisce come dati, modelli, strumenti, controlli e monitoraggio si combinano. Sceglierla bene è la differenza tra una demo che impressiona e un sistema che regge i carichi reali.",
    sections: [
      {
        title: "I pattern principali",
        body:
          "Non tutte le soluzioni AI hanno la stessa forma. I pattern più comuni coprono la maggior parte dei casi aziendali, dal più semplice al più complesso.",
        bullets: [
          "Prompt diretto: input → modello → output, per task semplici",
          "RAG: retrieval + modello, per conoscenza aziendale",
          "Tool calling: modello che agisce su funzioni e sistemi",
          "Agentico: il modello decide dinamicamente i passi",
          "Workflow: passi deterministici con AI nei punti giusti",
        ],
      },
      {
        title: "Cloud, on-premise, ibrido",
        body:
          "La scelta di deployment dipende da dati, latenza e controllo. Molte architetture reali sono ibride: modello locale per i dati sensibili, modello cloud per i task complessi, con un router che smista in base a sensibilità e difficoltà.",
      },
      {
        title: "Gli strati di un sistema serio",
        body:
          "Un'architettura di produzione non è solo “il modello”: è una pila di componenti dove ogni strato ha una responsabilità.",
        block: {
          caption: "Strati di un'architettura AI di produzione",
          lines: [
            "Input          → validazione, sicurezza, normalizzazione",
            "Retrieval/KB   → conoscenza aziendale, filtri permessi",
            "Modello        → scelto per task; eventuale routing",
            "Tool/Business  → azioni su CRM, ERP, API, regole",
            "Guardrail      → validazione output, citazioni, policy",
            "Osservabilità  → logging, metriche, versioning",
            "Governance     → ruoli, audit, supervisione",
          ],
        },
      },
      {
        title: "Disaccoppiare dal provider",
        body:
          "Un'architettura matura non è incollata a un singolo provider. Un layer di astrazione (o un AI gateway) permette di cambiare modello, usarne più di uno e migrare senza riscrivere il sistema. È governance e continuità operativa insieme.",
      },
    ],
    takeaways: [
      "L'architettura distingue un prototipo da un sistema di produzione.",
      "Scegli il pattern (prompt, RAG, tool, agentico, workflow) per il problema.",
      "Un sistema serio ha strati: input, retrieval, modello, tool, guardrail, osservabilità, governance.",
      "Disaccoppia dal provider per qualità, continuità e niente lock-in.",
    ],
    faq: [
      {
        q: "Da quale pattern parto?",
        a: "Dal più semplice che risolve il problema. Spesso prompt strutturato o RAG bastano; agenti e workflow si aggiungono quando il caso lo richiede davvero. La complessità va guadagnata, non assunta.",
      },
      {
        q: "Quanto conta l'architettura rispetto al modello?",
        a: "Moltissimo. Un modello medio in una buona architettura batte regolarmente un modello di punta usato male. L'affidabilità sta negli strati intorno al modello.",
      },
    ],
    related: ["workflow-ai", "come-progettare-un-agente-ai", "cloud-vs-local-ai"],
  },

  "workflow-ai": {
    readingTime: "10 min",
    intro:
      "Un caso d'uso AI diventa valore solo quando si trasforma in processo operativo: con owner, stati, controlli e punti di supervisione. Un workflow AI è esattamente questo — la struttura che rende ripetibile e governabile ciò che altrimenti resta una demo.",
    sections: [
      {
        title: "Dalla demo al processo",
        body:
          "Una demo mostra che “si può fare”. Un workflow definisce come si fa ogni volta: quali passi, in che ordine, chi è responsabile, cosa succede quando qualcosa va storto. È il salto da prova di concetto a sistema su cui l'azienda può contare.",
      },
      {
        title: "Workflow deterministico vs agentico",
        body:
          "Non tutto deve essere “agentico”. Quando i passi sono noti, un workflow deterministico è più affidabile, prevedibile e facile da auditare. L'autonomia dell'agente serve dove il percorso varia. Spesso la soluzione migliore è ibrida: struttura deterministica con AI nei nodi giusti.",
        bullets: [
          "Passi noti e fissi → workflow deterministico",
          "Percorso variabile da decidere → componente agentico",
          "Ibrido: workflow con step AI controllati",
        ],
      },
      {
        title: "Stati, controlli e supervisione",
        body:
          "Un workflow robusto modella esplicitamente gli stati e gli errori, e inserisce la supervisione dove serve.",
        bullets: [
          "Stati espliciti: in attesa, in revisione, approvato, fallito",
          "Gestione errori: retry, fallback, escalation",
          "Human in the loop sui passi critici",
          "Logging di ogni transizione per audit e miglioramento",
        ],
        block: {
          caption: "Esempio: workflow di approvazione documenti",
          lines: [
            "ricezione → estrazione AI (OCR + parsing)",
            "         → validazione (regole + guardrail)",
            "         → confidenza alta? auto-approva : revisione umana",
            "         → registrazione + audit trail",
          ],
        },
      },
    ],
    takeaways: [
      "Un workflow trasforma una demo AI in un processo ripetibile e governabile.",
      "Deterministico quando i passi sono noti; agentico solo dove serve.",
      "Modella stati ed errori esplicitamente, non come eccezioni nascoste.",
      "Supervisione e logging sui passi critici sono parte del design.",
    ],
    faq: [
      {
        q: "Tutto deve diventare un agente?",
        a: "No. Gli agenti sono affascinanti ma meno prevedibili. Per processi con passi noti, un workflow deterministico con AI nei punti giusti è più affidabile e più facile da governare.",
      },
      {
        q: "Come gestisco gli errori in un workflow AI?",
        a: "Con stati espliciti, retry, fallback e escalation a un umano sui passi critici. Ogni transizione va loggata, così puoi capire dove e perché il processo si è bloccato.",
      },
    ],
    related: ["architetture-ai", "come-progettare-un-agente-ai", "human-in-the-loop"],
  },
};
