export type PynkGovernanceService = {
  slug: string;
  title: string;
  shortTitle: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  summary: string;
  description: string;
  includes: string[];
  useCases: string[];
  benefits: string[];
  process: string[];
  deliverables?: string[];
  faq: Array<{ q: string; a: string }>;
  cta: string;
};

export type PynkBlogArticle = {
  slug: string;
  title: string;
  description: string;
  readingTime: string;
  topics: string[];
  sections: Array<{ title: string; body: string }>;
  faq: Array<{ q: string; a: string }>;
};

export const PYNK_ORIGIN = "https://pynkstudio.it";

export const governanceServices: PynkGovernanceService[] = [
  {
    slug: "ai-readiness-assessment",
    title: "AI Readiness Assessment",
    shortTitle: "Readiness Assessment",
    metaTitle: "AI Readiness Assessment tecnico | PYNK STUDIO",
    metaDescription:
      "Valutazione tecnica iniziale per mappare sistemi AI, processi, dati, rischi, maturità organizzativa e roadmap di adozione.",
    eyebrow: "Valutazione tecnica iniziale",
    summary: "Prima di introdurre nuovi modelli serve sapere dove l'AI è già entrata, quali dati tocca e quali processi condiziona.",
    description:
      "L'assessment fotografa strumenti, flussi documentali, integrazioni, dataset, responsabilità e rischi. Il risultato non è una lista generica di criticità, ma una roadmap tecnica e organizzativa con priorità ordinate per impatto.",
    includes: [
      "mappatura completa dei sistemi AI utilizzati",
      "analisi dei processi aziendali e dei flussi documentali",
      "analisi dei dati utilizzati, fonti, retention e accessi",
      "classificazione preliminare dei sistemi AI",
      "valutazione dei rischi tecnici, operativi e normativi",
      "analisi della maturità AI dell'organizzazione",
      "roadmap tecnica e roadmap organizzativa",
    ],
    useCases: [
      "azienda che usa ChatGPT, Copilot o tool verticali senza inventario centrale",
      "team che vuole capire dove introdurre RAG, agenti o automazioni",
      "direzione IT che deve prioritizzare interventi su dati, accessi e logging",
    ],
    benefits: [
      "visibilità reale sugli usi AI già presenti",
      "priorità tecniche chiare invece di iniziative isolate",
      "base documentale per governance, policy e valutazioni AI Act",
    ],
    process: [
      "raccolta strumenti, contratti, processi e flussi dati",
      "interviste tecniche con IT, direzione e reparti coinvolti",
      "classificazione preliminare di rischi, ruoli e dipendenze",
      "restituzione con report, piano di miglioramento e priorità di intervento",
    ],
    deliverables: ["report dettagliato", "piano di miglioramento", "priorità di intervento"],
    faq: [
      {
        q: "Serve già avere un progetto AI avviato?",
        a: "No. L'assessment serve sia a fotografare strumenti già usati sia a preparare un programma AI prima dell'implementazione.",
      },
      {
        q: "Analizzate anche strumenti non approvati formalmente?",
        a: "Sì. Gli usi informali sono spesso il punto più importante: senza inventario non si può governare accesso ai dati, output e responsabilità.",
      },
    ],
    cta: "Richiedi un AI Assessment",
  },
  {
    slug: "ai-governance-framework",
    title: "AI Governance Framework",
    shortTitle: "Governance Framework",
    metaTitle: "AI Governance Framework aziendale | PYNK STUDIO",
    metaDescription:
      "Progettiamo ruoli, workflow, accessi, approvazioni, logging, auditing e supervisione umana per sistemi AI aziendali.",
    eyebrow: "Governance aziendale AI",
    summary: "La governance trasforma l'uso dell'AI da iniziativa individuale a processo tecnico controllato.",
    description:
      "Disegniamo il framework operativo per decidere quali strumenti entrano in azienda, come vengono configurati, chi approva nuovi casi d'uso, dove vengono loggate le decisioni e come si mantiene il controllo sui modelli.",
    includes: [
      "ruoli, responsabilità e workflow di approvazione",
      "gestione accessi, modelli, fornitori e strumenti AI",
      "governance dei dati, versionamento e supervisione umana",
      "auditing, logging, change management e revisione periodica",
    ],
    useCases: [
      "introduzione di Copilot, chatbot interni o agenti operativi",
      "reparti che chiedono nuovi strumenti AI senza processo di valutazione",
      "necessità di coordinare IT, legal, privacy, security e business owner",
    ],
    benefits: [
      "meno shadow AI e decisioni non tracciate",
      "scelte tecniche più rapide perché il processo è già definito",
      "riduzione del rischio legale tramite architettura, documentazione e controlli",
    ],
    process: [
      "definizione perimetro e sistemi coinvolti",
      "disegno dei ruoli e dei workflow decisionali",
      "configurazione delle regole tecniche: accessi, logging, versionamento",
      "rilascio del framework e piano di adozione interna",
    ],
    faq: [
      {
        q: "È un documento o un processo operativo?",
        a: "Entrambi. La documentazione serve, ma il valore è nel workflow applicabile: chi approva, cosa viene registrato, quali controlli scattano.",
      },
      {
        q: "Il framework vale anche per sistemi non ancora attivi?",
        a: "Sì. Lo progettiamo per coprire anche moduli e strumenti futuri, così l'azienda non deve riscrivere la governance a ogni nuova integrazione.",
      },
    ],
    cta: "Progetta la governance AI",
  },
  {
    slug: "ai-literacy",
    title: "AI Literacy",
    shortTitle: "AI Literacy",
    metaTitle: "AI Literacy tecnica e organizzativa | PYNK STUDIO",
    metaDescription:
      "Percorsi modulari di AI Literacy per manager, HR, marketing, customer care, sviluppatori, IT e direzione, conformi all'Articolo 4 AI Act.",
    eyebrow: "Alfabetizzazione tecnica e organizzativa",
    summary: "Non è una formazione motivazionale sull'AI. È un percorso per usare, valutare e supervisionare sistemi AI in modo competente.",
    description:
      "Costruiamo programmi modulari per ruolo: fondamenti, prompt engineering, sicurezza, normativa, casi pratici e workshop su workflow reali. La profondità cambia tra direzione, IT, marketing, customer care, HR e sviluppatori.",
    includes: [
      "fondamenti: AI, machine learning, generative AI, LLM, token, contesto, memoria e allucinazioni",
      "utilizzo corretto: prompt, gestione contesto, verifica risposte, reasoning e supervisione umana",
      "sicurezza: dati personali, dati aziendali, segreti industriali, IP, configurazioni e cloud",
      "normativa: principi AI Act, AI Literacy, ruoli, sistemi vietati, alto rischio e responsabilità",
      "applicazioni pratiche: documentazione, customer care, marketing, sviluppo software, amministrazione e analisi dati",
      "workshop: esercizi, simulazioni, casi reali, revisione prompt e costruzione workflow AI",
    ],
    useCases: [
      "team che usano AI generativa senza criteri comuni",
      "azienda che deve soddisfare i requisiti dell'Articolo 4 AI Act",
      "reparti con esigenze diverse: manager, HR, marketing, customer care, sviluppatori, IT e direzione",
    ],
    benefits: [
      "uso più affidabile degli strumenti AI",
      "meno esposizione di dati sensibili e informazioni aziendali",
      "competenze differenziate per ruolo, non corso unico per tutti",
    ],
    process: [
      "analisi dei ruoli e degli strumenti già usati",
      "composizione dei moduli e definizione profondità tecnica",
      "sessioni operative con esempi e simulazioni reali",
      "materiali, checklist e aggiornamenti su nuove pratiche o normative",
    ],
    faq: [
      {
        q: "Soddisfa l'Articolo 4 dell'AI Act?",
        a: "Il percorso è progettato per coprire i requisiti di AI Literacy dell'Articolo 4, adattando contenuti e profondità ai ruoli coinvolti e agli strumenti effettivamente usati.",
      },
      {
        q: "Il programma è uguale per tutti?",
        a: "No. Manager, HR, marketing, customer care, sviluppatori, IT e direzione hanno competenze attese diverse: il percorso viene modulato sul ruolo.",
      },
    ],
    cta: "Pianifica AI Literacy",
  },
  {
    slug: "ai-policy",
    title: "AI Policy",
    shortTitle: "AI Policy",
    metaTitle: "AI Policy aziendale e procedure operative | PYNK STUDIO",
    metaDescription:
      "Creiamo AI Acceptable Use Policy, Security Policy, Procurement Policy, Prompt Policy, gestione dati, strumenti cloud e AI locali.",
    eyebrow: "Documentazione aziendale",
    summary: "Le policy AI devono essere abbastanza chiare per il business e abbastanza precise per IT, security e compliance.",
    description:
      "Produciamo documentazione operativa che collega regole, strumenti, dati e responsabilità. Non template astratti: policy utilizzabili da chi deve scegliere tool, configurare accessi e controllare output.",
    includes: [
      "AI Acceptable Use Policy e AI Security Policy",
      "AI Procurement Policy e gestione fornitori",
      "linee guida interne, Prompt Policy e template riutilizzabili",
      "procedure per gestione dati, strumenti AI, AI locali e AI cloud",
    ],
    useCases: [
      "azienda che vuole regole chiare prima di abilitare strumenti generativi",
      "IT che deve standardizzare configurazioni e accessi",
      "direzione che vuole procedure semplici da mantenere nel tempo",
    ],
    benefits: [
      "meno ambiguità su cosa può essere caricato nei tool AI",
      "processo di acquisto e approvazione più controllato",
      "documenti coerenti con architettura e governance reale",
    ],
    process: [
      "raccolta strumenti, dati e casi d'uso",
      "scrittura policy e procedure operative",
      "revisione con stakeholder tecnici e organizzativi",
      "rilascio template e piano di aggiornamento",
    ],
    faq: [
      {
        q: "Fornite documenti standard?",
        a: "Partiamo da strutture riusabili, ma le adattiamo a strumenti, dati, ruoli e architettura dell'azienda. Una policy generica non regge in produzione.",
      },
      {
        q: "Coprite anche AI locale e on-premise?",
        a: "Sì. Le policy distinguono cloud, locale, hybrid, modelli open source e servizi gestiti, perché i rischi tecnici non sono gli stessi.",
      },
    ],
    cta: "Crea le policy AI",
  },
  {
    slug: "ai-risk-assessment",
    title: "AI Risk Assessment",
    shortTitle: "Risk Assessment",
    metaTitle: "AI Risk Assessment tecnico | PYNK STUDIO",
    metaDescription:
      "Analisi tecnica dei rischi AI: cybersecurity, privacy, qualità dati, affidabilità, bias, supervisione, API, logging e auditing.",
    eyebrow: "Analisi tecnica dei rischi",
    summary: "Il rischio AI nasce da dati, integrazioni, permessi, output non verificati e dipendenze tecniche, non solo dalla normativa.",
    description:
      "Valutiamo superfici di attacco, qualità del dato, affidabilità del modello, bias, supervisione umana, continuità operativa, lock-in e osservabilità. Il risultato è una matrice di rischio collegata a contromisure tecniche.",
    includes: [
      "cybersecurity, privacy e gestione credenziali",
      "qualità dei dati, affidabilità, bias e human in the loop",
      "continuità operativa, vendor lock-in, API e integrazioni software",
      "logging, auditing, monitoraggio e tracciabilità",
    ],
    useCases: [
      "chatbot o agenti con accesso a knowledge base e sistemi interni",
      "workflow AI che producono output usati in processi aziendali",
      "valutazione di fornitori AI e servizi cloud",
    ],
    benefits: [
      "rischi collegati a componenti tecniche precise",
      "mitigazioni implementabili da IT e team di sviluppo",
      "base per audit e miglioramento continuo",
    ],
    process: [
      "modellazione del sistema e dei flussi dati",
      "analisi minacce, controlli esistenti e gap",
      "valutazione probabilità, impatto e rilevabilità",
      "piano di mitigazione con responsabilità e priorità",
    ],
    faq: [
      {
        q: "È una valutazione legale?",
        a: "No. È una valutazione tecnica. Gli obblighi normativi vengono considerati, ma il focus è architettura, dati, sicurezza, logging e operatività.",
      },
      {
        q: "Analizzate anche API e integrazioni legacy?",
        a: "Sì. Molti rischi emergono quando il modello può chiamare strumenti, API o database aziendali senza confini chiari.",
      },
    ],
    cta: "Analizza i rischi AI",
  },
  {
    slug: "ai-architecture",
    title: "AI Architecture",
    shortTitle: "AI Architecture",
    metaTitle: "AI Architecture: RAG, agenti, LLM cloud e on-premise | PYNK STUDIO",
    metaDescription:
      "Progettiamo architetture AI con OpenAI, Claude, Gemini, Llama, Mistral, Qwen, RAG, knowledge base, agenti, MCP e tool calling.",
    eyebrow: "Progettazione tecnica",
    summary: "La scelta del modello è solo una parte. Conta l'architettura: dati, contesto, tool, permessi, valutazione e manutenzione.",
    description:
      "Disegniamo architetture cloud, on-premise e ibride con modelli proprietari o open source. Definiamo RAG, knowledge base, agenti, MCP, tool calling, workflow, osservabilità e criteri di valutazione.",
    includes: [
      "scelta modelli: OpenAI, Claude, Gemini, Llama, Mistral, Qwen e modelli open source",
      "cloud, on-premise, hybrid e LLM on-premise",
      "RAG, knowledge base, vector database e retrieval strategy",
      "agenti AI, MCP, tool calling, workflow e automazioni",
    ],
    useCases: [
      "assistente documentale su procedure, manuali o knowledge base",
      "agente che interroga CRM, ERP, email o database",
      "AI locale o on-premise per vincoli di dato, latenza o controllo",
    ],
    benefits: [
      "architettura proporzionata al caso d'uso, non scelta per moda",
      "riduzione di allucinazioni tramite contesto, retrieval e valutazione",
      "base scalabile per integrazioni future e governance",
    ],
    process: [
      "analisi dati, vincoli, utenti e sistemi da integrare",
      "scelta modello, hosting e pattern architetturale",
      "prototipo misurabile con dataset di test",
      "hardening, logging, deployment e piano di manutenzione",
    ],
    faq: [
      {
        q: "Meglio RAG o fine tuning?",
        a: "Dipende dal problema. Per conoscenza aziendale aggiornata spesso RAG è più adatto; il fine tuning serve quando va modificato comportamento o stile su pattern ripetibili.",
      },
      {
        q: "Realizzate anche LLM on-premise?",
        a: "Sì. Valutiamo requisiti hardware, modello, quantizzazione, serving, sicurezza, latenza e manutenzione prima di proporlo.",
      },
    ],
    cta: "Parla con un AI Architect",
  },
  {
    slug: "ai-integration",
    title: "AI Integration",
    shortTitle: "AI Integration",
    metaTitle: "AI Integration con CRM, ERP, WhatsApp, Microsoft 365 e API | PYNK STUDIO",
    metaDescription:
      "Implementiamo integrazioni AI con CRM, ERP, WhatsApp, Microsoft 365, Google Workspace, email, database, API e sistemi legacy.",
    eyebrow: "Implementazione pratica",
    summary: "Un sistema AI utile deve entrare nei flussi reali: CRM, ERP, email, database, WhatsApp, documenti e sistemi legacy.",
    description:
      "Realizziamo chatbot, agenti AI, voice AI, workflow e automazioni collegati ai sistemi aziendali. L'integrazione include autenticazione, permessi, retry, logging, gestione errori e supervisione.",
    includes: [
      "CRM, ERP, database, API e sistemi legacy",
      "WhatsApp, email, Microsoft 365 e Google Workspace",
      "chatbot, agenti AI, voice AI, workflow e automazioni",
      "software personalizzato e API per orchestrare processi AI",
    ],
    useCases: [
      "customer care con knowledge base e passaggio a operatore",
      "classificazione email e apertura ticket",
      "agente interno che recupera dati da CRM o ERP con permessi controllati",
    ],
    benefits: [
      "meno lavoro manuale su attività ripetitive",
      "integrazioni tracciate invece di automazioni opache",
      "processi più stabili perché progettati con fallback e logging",
    ],
    process: [
      "mappatura sistemi, API e permessi",
      "progettazione workflow e punti di supervisione",
      "sviluppo integrazione, test e logging",
      "rilascio graduale con monitoraggio e miglioramenti",
    ],
    faq: [
      {
        q: "Lavorate anche con sistemi legacy senza API moderne?",
        a: "Sì, valutiamo export, database, file exchange, RPA leggera o wrapper custom. Prima scegliamo la strada più mantenibile.",
      },
      {
        q: "Create anche chatbot e voice AI?",
        a: "Sì. Realizziamo chatbot, agenti AI e voice AI collegati a knowledge base, CRM, WhatsApp, email e API aziendali.",
      },
    ],
    cta: "Integra l'AI nei sistemi",
  },
  {
    slug: "ai-operations",
    title: "AI Operations",
    shortTitle: "AI Operations",
    metaTitle: "AI Operations e manutenzione sistemi AI | PYNK STUDIO",
    metaDescription:
      "Supporto continuativo per sistemi AI: aggiornamenti, monitoraggio, audit, revisione processi, nuove normative e ottimizzazione continua.",
    eyebrow: "Supporto continuativo",
    summary: "Un sistema AI non si chiude al go-live: modelli, dati, strumenti, normative e processi cambiano.",
    description:
      "Gestiamo manutenzione, monitoraggio, audit periodici, revisione dei workflow, aggiornamento policy e ottimizzazione continua. AI Operations collega sviluppo, governance e business continuity.",
    includes: [
      "aggiornamenti, monitoraggio e audit",
      "revisione processi, nuovi strumenti e nuove normative",
      "ottimizzazione continua di prompt, retrieval, modelli e workflow",
      "manutenzione di chatbot, agenti, RAG, voice AI e integrazioni",
    ],
    useCases: [
      "sistemi RAG con knowledge base che cambia spesso",
      "agenti AI che devono mantenere performance e sicurezza nel tempo",
      "azienda che vuole governance e miglioramento continuo dopo il rilascio",
    ],
    benefits: [
      "meno drift di qualità e processi",
      "aggiornamenti controllati invece di interventi emergenziali",
      "audit e documentazione sempre allineati al sistema reale",
    ],
    process: [
      "definizione metriche e soglie di monitoraggio",
      "review periodiche di log, output e processi",
      "aggiornamento tecnico e documentale",
      "roadmap evolutiva su nuovi modelli, strumenti e normative",
    ],
    faq: [
      {
        q: "Monitorate anche qualità delle risposte e allucinazioni?",
        a: "Sì. Usiamo log, set di valutazione, feedback umano e controlli su retrieval per capire dove il sistema degrada.",
      },
      {
        q: "AI Operations include adeguamenti normativi?",
        a: "Include la manutenzione tecnica e documentale necessaria a restare allineati a nuove regole, ruoli, strumenti e livelli di rischio.",
      },
    ],
    cta: "Mantieni i sistemi AI",
  },
  {
    slug: "valutazione-obblighi-ai-act",
    title: "Valutazione preliminare degli obblighi AI Act",
    shortTitle: "Obblighi AI Act",
    metaTitle: "Valutazione preliminare obblighi AI Act | PYNK STUDIO",
    metaDescription:
      "Verifichiamo ruolo, livello di rischio, obblighi AI Act e possibile necessità di Fundamental Rights Impact Assessment.",
    eyebrow: "AI Act dentro la governance",
    summary: "Gli obblighi AI Act dipendono dal ruolo ricoperto e dal livello di rischio del sistema. Non tutte le aziende hanno gli stessi obblighi.",
    description:
      "Valutiamo se l'azienda agisce come provider, deployer, importatore o distributore, e analizziamo il livello di rischio dei sistemi. La verifica include l'eventuale necessità di predisporre una Fundamental Rights Impact Assessment.",
    includes: [
      "identificazione del ruolo: provider, deployer, importatore o distributore",
      "classificazione preliminare del livello di rischio",
      "verifica di sistemi vietati, alto rischio, AI Literacy, governance e documentazione",
      "verifica dell'eventuale necessità di Fundamental Rights Impact Assessment",
    ],
    useCases: [
      "azienda che usa sistemi AI in processi interni o verso clienti",
      "software house o vendor che integra modelli in prodotti propri",
      "organizzazione che deve capire quali obblighi AI Act si applicano davvero",
    ],
    benefits: [
      "evita interpretazioni generiche del regolamento",
      "collega obblighi a sistemi, ruoli e rischi reali",
      "produce una base concreta per governance, policy e roadmap tecnica",
    ],
    process: [
      "raccolta sistemi AI e contesto d'uso",
      "identificazione ruoli e catena di fornitura",
      "classificazione preliminare rischio e obblighi",
      "restituzione con azioni tecniche e organizzative prioritarie",
    ],
    faq: [
      {
        q: "Vendete il FRIA come servizio separato?",
        a: "No. Facciamo una valutazione preliminare degli obblighi AI Act che include la verifica dell'eventuale necessità di una Fundamental Rights Impact Assessment.",
      },
      {
        q: "Tutte le aziende hanno gli stessi obblighi?",
        a: "No. Gli obblighi dipendono dal ruolo ricoperto nella catena AI e dal livello di rischio del sistema.",
      },
    ],
    cta: "Valuta gli obblighi AI Act",
  },
];

export function getGovernanceService(slug: string) {
  return governanceServices.find((service) => service.slug === slug);
}

export const aiActFaq = [
  {
    q: "L'AI Act si applica allo stesso modo a tutte le aziende?",
    a: "No. Gli obblighi dipendono dal ruolo ricoperto, dal contesto di utilizzo e dal livello di rischio del sistema AI.",
  },
  {
    q: "Usare ChatGPT significa essere automaticamente ad alto rischio?",
    a: "No. Il rischio dipende dal caso d'uso, dai dati, dagli effetti sulle persone e dal ruolo dell'azienda nel ciclo di vita del sistema.",
  },
  {
    q: "La AI Literacy è obbligatoria?",
    a: "L'Articolo 4 richiede un livello adeguato di alfabetizzazione AI per staff e altri soggetti che usano sistemi AI per conto dell'organizzazione.",
  },
];

const baseArticleSections = [
  {
    title: "Implicazioni architetturali",
    body:
      "La scelta tecnica va collegata a dati, permessi, logging, valutazione e manutenzione. Un sistema AI professionale deve rendere espliciti input, contesto, output, limiti e responsabilità operative.",
  },
  {
    title: "Controlli di governance",
    body:
      "Inventario, classificazione del rischio, owner di processo, accessi, versionamento e audit trail sono i controlli minimi per evitare shadow AI e decisioni non tracciate.",
  },
  {
    title: "Come lo implementiamo",
    body:
      "Partiamo da un caso d'uso reale, costruiamo un prototipo misurabile, definiamo dataset di valutazione, integriamo i sistemi necessari e rilasciamo con monitoraggio e procedure operative.",
  },
];

export const governanceBlogArticles: PynkBlogArticle[] = [
  ["come-funzionano-gli-llm", "Come funzionano gli LLM", "Token, contesto, probabilità, embedding e limiti pratici dei Large Language Model in azienda.", ["LLM", "token", "contesto"]],
  ["cos-e-un-token", "Cos'è un token", "Perché i token influenzano costo, contesto, qualità del prompt e progettazione delle knowledge base.", ["token", "costi", "prompt"]],
  ["cos-e-il-contesto", "Cos'è il contesto negli LLM", "Finestra di contesto, memoria apparente, retrieval e gestione delle informazioni durante una conversazione.", ["contesto", "RAG", "memoria"]],
  ["perche-le-ai-allucinano", "Perché le AI allucinano", "Cause tecniche delle allucinazioni e controlli per ridurle in workflow aziendali.", ["allucinazioni", "valutazione", "guardrails"]],
  ["prompt-engineering", "Prompt engineering per aziende", "Struttura del prompt, esempi, vincoli, verifica e pattern per ottenere output più affidabili.", ["prompt", "reasoning", "verifica"]],
  ["rag-vs-fine-tuning", "Differenza tra RAG e fine tuning", "Quando recuperare conoscenza esterna e quando addestrare il comportamento del modello.", ["RAG", "fine tuning", "knowledge base"]],
  ["cloud-vs-local-ai", "Cloud AI vs AI locale", "Trade-off tra modelli cloud, AI locale, on-premise, costi, privacy, latenza e manutenzione.", ["cloud", "locale", "on-premise"]],
  ["open-source-vs-closed-source-ai", "Open source vs closed source AI", "Come scegliere tra modelli proprietari e open source in base a controllo, qualità e governance.", ["open source", "provider", "governance"]],
  ["come-scegliere-un-modello-ai", "Come scegliere un modello AI", "Criteri tecnici per confrontare OpenAI, Claude, Gemini, Llama, Mistral, Qwen e altri modelli.", ["modelli", "benchmark", "vendor"]],
  ["come-progettare-un-agente-ai", "Come progettare un agente AI", "Tool calling, memoria, permessi, fallback e supervisione nella progettazione di agenti aziendali.", ["agenti", "tool calling", "workflow"]],
  ["ai-act-pmi", "AI Act spiegato alle PMI", "Ruoli, livelli di rischio, AI Literacy e obblighi senza trasformare la compliance in panico.", ["AI Act", "PMI", "rischio"]],
  ["ai-literacy-articolo-4", "AI Literacy e Articolo 4", "Cosa significa alfabetizzazione AI adeguata e perché deve essere differenziata per ruolo.", ["AI Literacy", "AI Act", "formazione"]],
  ["sistemi-ai-ad-alto-rischio", "Sistemi AI ad alto rischio", "Criteri, esempi e conseguenze tecniche della classificazione ad alto rischio.", ["alto rischio", "AI Act", "documentazione"]],
  ["chatgpt-in-azienda", "ChatGPT in azienda", "Policy, dati, configurazioni, prompt e processi per usare ChatGPT senza perdere controllo.", ["ChatGPT", "policy", "sicurezza"]],
  ["claude-in-azienda", "Claude in azienda", "Dove Claude è utile, come valutarlo e come inserirlo in architetture AI governate.", ["Claude", "LLM", "valutazione"]],
  ["copilot-in-azienda", "Microsoft Copilot in azienda", "Permessi, documenti, tenant Microsoft 365 e governance prima di abilitare Copilot.", ["Copilot", "Microsoft 365", "accessi"]],
  ["gemini-in-azienda", "Gemini in azienda", "Integrazione con Google Workspace, dati, controlli e casi d'uso realistici.", ["Gemini", "Google Workspace", "integrazione"]],
  ["mcp-model-context-protocol", "MCP: Model Context Protocol", "Perché MCP cambia il modo in cui agenti e tool espongono contesto e capacità operative.", ["MCP", "agenti", "tool"]],
  ["tool-calling", "Tool Calling negli LLM", "Come un modello chiama funzioni, API e strumenti esterni senza perdere controllo operativo.", ["tool calling", "API", "agenti"]],
  ["vector-database", "Vector database per RAG", "Embedding, similarità, chunking, metadata filtering e criteri per scegliere un vector store.", ["vector database", "embedding", "RAG"]],
  ["knowledge-base-ai", "Knowledge base per sistemi AI", "Come progettare documenti, chunk, aggiornamenti e permessi per assistenti aziendali.", ["knowledge base", "RAG", "documenti"]],
  ["human-in-the-loop", "Human in the Loop", "Dove inserire supervisione umana, approvazioni e escalation nei workflow AI.", ["supervisione", "workflow", "rischio"]],
  ["guardrails-ai", "Guardrails per sistemi AI", "Validazioni, policy, filtri, test e limiti tecnici per contenere output indesiderati.", ["guardrails", "sicurezza", "validazione"]],
  ["ai-governance", "AI Governance", "Processi, ruoli, logging, policy e architettura per adottare AI in modo professionale.", ["governance", "processi", "audit"]],
  ["bias-nei-sistemi-ai", "Bias nei sistemi AI", "Dove nasce il bias e come valutarlo in dati, prompt, retrieval e decisioni operative.", ["bias", "dati", "valutazione"]],
  ["valutazione-fornitori-ai", "Valutazione dei fornitori AI", "Checklist tecnica per vendor AI: dati, contratti, API, sicurezza, lock-in e audit.", ["fornitori", "vendor lock-in", "procurement"]],
  ["logging-sistemi-ai", "Logging nei sistemi AI", "Cosa loggare, cosa non loggare e come usare i log per audit, debugging e qualità.", ["logging", "audit", "privacy"]],
  ["auditing-sistemi-ai", "Auditing dei sistemi AI", "Audit trail, evidenze tecniche, versioni, cambi modello e verifiche periodiche.", ["auditing", "versionamento", "governance"]],
  ["architetture-ai", "Architetture AI", "Pattern cloud, hybrid, on-premise, RAG, agenti, workflow e integrazioni enterprise.", ["architettura", "hybrid", "RAG"]],
  ["workflow-ai", "Workflow AI", "Come trasformare un caso d'uso AI in processo operativo con owner, stati e controlli.", ["workflow", "automazioni", "processi"]],
].map(([slug, title, description, topics]) => ({
  slug,
  title,
  description,
  readingTime: "8 min",
  topics,
  sections: baseArticleSections,
  faq: [
    {
      q: "Da dove conviene partire?",
      a: "Da un caso d'uso delimitato, dati disponibili e metriche di qualità. La tecnologia va scelta dopo aver chiarito processo e rischio.",
    },
    {
      q: "Serve una policy prima del progetto?",
      a: "Serve almeno una regola minima su dati, accessi e supervisione. Policy e architettura devono evolvere insieme.",
    },
  ],
})) as PynkBlogArticle[];

export function getGovernanceArticle(slug: string) {
  return governanceBlogArticles.find((article) => article.slug === slug);
}

export const leadMagnets = [
  "Checklist gratuita AI Governance",
  "Guida AI Act",
  "Template AI Policy",
  "Audit gratuito",
  "Assessment gratuito",
  "Newsletter tecnica",
  "White paper",
];
