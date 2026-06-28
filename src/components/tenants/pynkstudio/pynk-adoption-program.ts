// Contenuti dell'AI Adoption Program (AI Literacy) di PYNK STUDIO.
// Struttura per moduli: ogni modulo dichiara argomenti trattati, valore teorico
// (cosa capisci) e valore applicativo (cosa sai fare dopo). Tenant-isolato.

export type PynkAdoptionModule = {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  topics: string[];
  theory: string;
  practice: string;
};

export const adoptionModules: PynkAdoptionModule[] = [
  {
    id: "fondamenti",
    kicker: "Fondamenti",
    title: "Come funziona davvero l'AI",
    summary: "Modelli mentali corretti su cosa un'AI può e non può fare, senza mitologie.",
    topics: ["LLM e AI generativa", "token, contesto, memoria", "perché le AI allucinano", "capacità e limiti reali"],
    theory: "Capisci come un modello produce le risposte e perché a volte sbaglia.",
    practice: "Smetti di chiedere all'AI ciò che non può fare e riconosci gli output inaffidabili.",
  },
  {
    id: "prompting",
    kicker: "Uso efficace",
    title: "Prompting e verifica degli output",
    summary: "Ottenere risposte affidabili e ripetibili, non testo a caso.",
    topics: ["struttura del prompt", "gestione del contesto", "verifica e revisione", "reasoning e chain-of-thought"],
    theory: "Capisci perché un prompt funziona o fallisce, oltre i trucchi.",
    practice: "Costruisci prompt riutilizzabili per i task ricorrenti del tuo ruolo.",
  },
  {
    id: "sicurezza",
    kicker: "Sicurezza",
    title: "Dati, privacy e segreti aziendali",
    summary: "Usare l'AI senza esporre dati personali, informazioni riservate e proprietà intellettuale.",
    topics: ["dati personali e GDPR", "segreti industriali e IP", "cosa caricare e cosa no", "cloud vs AI locale"],
    theory: "Riconosci i rischi legati ai dati prima che diventino incidenti.",
    practice: "Decidi quale strumento usare per ogni tipo di informazione.",
  },
  {
    id: "ai-act",
    kicker: "Normativa",
    title: "AI Act e responsabilità d'uso",
    summary: "La normativa spiegata per chi usa l'AI, non per i giuristi.",
    topics: ["principi dell'AI Act", "ruoli e livelli di rischio", "AI Literacy (Articolo 4)", "responsabilità operativa"],
    theory: "Inquadri gli obblighi senza panico e senza sottovalutazione.",
    practice: "Operi nel rispetto delle regole aziendali e normative.",
  },
  {
    id: "reparti",
    kicker: "Applicazioni",
    title: "L'AI nel lavoro del tuo reparto",
    summary: "Casi d'uso reali calibrati sul ruolo: marketing, care, HR, IT, amministrazione.",
    topics: ["marketing e contenuti", "customer care", "HR e amministrazione", "sviluppo e analisi dati"],
    theory: "Vedi dove l'AI crea valore dentro il tuo processo.",
    practice: "Porti a casa workflow concreti, applicabili da subito.",
  },
  {
    id: "strumenti",
    kicker: "Strumenti",
    title: "ChatGPT, Claude, Copilot e Gemini governati",
    summary: "Gli strumenti aziendali usati bene, in sicurezza e secondo le policy.",
    topics: ["differenze tra gli strumenti", "configurazioni e permessi", "policy d'uso", "prompt e template aziendali"],
    theory: "Capisci forze e limiti di ciascuno strumento.",
    practice: "Usi lo strumento giusto per ogni compito, nel rispetto delle policy.",
  },
  {
    id: "laboratori",
    kicker: "Pratica",
    title: "Workshop, simulazioni e laboratori",
    summary: "Esercizi e casi reali, non solo teoria: si lavora sui processi veri.",
    topics: ["esercitazioni guidate", "simulazioni su casi reali", "revisione di prompt e workflow", "costruzione di automazioni"],
    theory: "Consolidi le competenze applicandole a problemi concreti.",
    practice: "Esci con materiali, checklist e workflow pronti all'uso.",
  },
];

// Formati di erogazione: come si svolge il percorso.
export const adoptionFormats = [
  "Workshop in aula o da remoto",
  "Affiancamento sul campo",
  "Office hours periodiche",
  "Revisione dei prompt",
  "Revisione dei workflow",
  "Shadowing operativo",
  "Laboratori pratici",
  "Casi reali dell'azienda",
  "Materiali e checklist",
];

// Profili: il percorso è modulato per ruolo, non un corso unico per tutti.
export const adoptionRoles = ["Direzione", "Manager", "IT", "Sviluppatori", "Marketing", "Customer Care", "HR"];
