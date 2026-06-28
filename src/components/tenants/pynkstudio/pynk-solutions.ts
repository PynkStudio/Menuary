// Pagine "soluzione": intercettano ricerche umane ad alto intento commerciale
// (es. "AI per studio legale", "come rispettare AI Act", "assistente AI clienti").
// Linguaggio non-tecnico e rassicurante, pensato per imprenditori non esperti.
// Tenant-isolato. La struttura è la stessa per tutte: problema → come funziona → risultato.

export type PynkSolutionStep = { title: string; body: string };

export type PynkSolution = {
  slug: string;
  eyebrow: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  painsTitle: string;
  pains: string[];
  howTitle: string;
  how: PynkSolutionStep[];
  deliverTitle: string;
  deliver: string[];
  faq: Array<{ q: string; a: string }>;
  relatedServices: string[];
  relatedArticles: string[];
  cta: string;
};

export const pynkSolutions: PynkSolution[] = [
  {
    slug: "come-usare-chatgpt-in-azienda",
    eyebrow: "Strumenti AI · ChatGPT",
    h1: "Come usare ChatGPT in azienda senza rischi",
    metaTitle: "Come usare ChatGPT in azienda senza rischi | PYNK STUDIO",
    metaDescription:
      "Guida pratica per usare ChatGPT in azienda in sicurezza: quale versione scegliere, quali dati caricare, regole semplici e formazione del team. Te lo configuriamo noi.",
    intro:
      "Vuoi usare ChatGPT in azienda ma temi di esporre dati o di sbagliare? Ti aiutiamo a usarlo bene: versione giusta, regole chiare e team formato. Senza che tu debba diventare un esperto di AI.",
    painsTitle: "Cosa ti blocca oggi",
    pains: [
      "I dipendenti lo usano già, ma senza regole.",
      "Paura di caricare dati riservati o dei clienti.",
      "Non sai quale versione o abbonamento scegliere.",
      "Risposte usate nei documenti senza un controllo.",
    ],
    howTitle: "Come lo rendiamo sicuro",
    how: [
      { title: "Scegliamo la versione giusta", body: "Account aziendale che non usa i tuoi dati per addestrare i modelli, con accessi sotto controllo." },
      { title: "Definiamo regole semplici", body: "Cosa si può caricare e cosa no, in una pagina che chiunque capisce." },
      { title: "Formiamo il team", body: "Prompt utili per il loro lavoro e come verificare le risposte, calibrati per ruolo." },
    ],
    deliverTitle: "Cosa ottieni",
    deliver: [
      "Configurazione sicura e accessi gestiti.",
      "Una policy d'uso chiara e breve.",
      "Prompt e template pronti per i tuoi processi.",
      "Un team che lo usa con criterio, non a caso.",
    ],
    faq: [
      {
        q: "ChatGPT è sicuro per i dati aziendali?",
        a: "Con la versione aziendale e regole chiare sì: si configura per non usare i tuoi dati in addestramento e si stabilisce cosa caricare. Il rischio è usarlo senza regole, non lo strumento in sé.",
      },
      {
        q: "Meglio vietarlo ai dipendenti?",
        a: "No: lo userebbero comunque, di nascosto e peggio. Governarlo — versione giusta, regole e formazione — è più sicuro e più produttivo.",
      },
      {
        q: "Quanto è complicato partire?",
        a: "Si parte da una breve valutazione dell'uso attuale e dalla configurazione, poi formazione e regole. Lo dimensioniamo sulla tua azienda, senza progetti enormi.",
      },
    ],
    relatedServices: ["ai-policy", "ai-literacy"],
    relatedArticles: ["chatgpt-in-azienda", "ai-act-pmi"],
    cta: "Parla con noi di ChatGPT in azienda",
  },
  {
    slug: "ai-ufficio-tecnico",
    eyebrow: "AI per settore · Ufficio tecnico",
    h1: "AI per l'ufficio tecnico",
    metaTitle: "AI per l'ufficio tecnico: documenti, capitolati e procedure | PYNK STUDIO",
    metaDescription:
      "Assistenti AI per l'ufficio tecnico: ricerca su manuali, capitolati e normative, bozze di documenti, estrazione dati da PDF. Costruiti sui tuoi dati e in sicurezza.",
    intro:
      "Il tuo ufficio tecnico perde ore a cercare informazioni tra manuali, capitolati e normative? Costruiamo assistenti AI che recuperano la risposta giusta dalle vostre fonti e preparano le bozze.",
    painsTitle: "Il problema oggi",
    pains: [
      "Informazioni sparse tra PDF, manuali e cartelle.",
      "Tempo perso a cercare la norma o il capitolato giusto.",
      "Documenti ripetitivi compilati a mano.",
      "Conoscenza che resta nella testa di poche persone.",
    ],
    howTitle: "Cosa costruiamo",
    how: [
      { title: "Centralizziamo la conoscenza", body: "Manuali, capitolati, schede tecniche e procedure in una knowledge base interrogabile." },
      { title: "Un assistente che cita le fonti", body: "Risponde sulle vostre fonti reali e indica il documento da cui arriva l'informazione." },
      { title: "Automazioni sui documenti", body: "Bozze di relazioni, estrazione dati da PDF e schede, compilazione assistita." },
    ],
    deliverTitle: "Cosa ottieni",
    deliver: [
      "Ricerca istantanea su tutta la documentazione tecnica.",
      "Risposte con citazione della fonte.",
      "Bozze di documenti pronte da rivedere.",
      "Meno dipendenza dalle singole persone.",
    ],
    faq: [
      {
        q: "Funziona con i nostri documenti e le nostre normative?",
        a: "Sì: l'assistente lavora sulle vostre fonti — manuali, capitolati, norme, procedure. Risponde su quelle e indica il documento da cui arriva l'informazione.",
      },
      {
        q: "I dati restano riservati?",
        a: "Sì. Progettiamo gli accessi e, se serve, soluzioni che tengono i dati dentro l'azienda. La riservatezza è parte del progetto, non un'aggiunta.",
      },
      {
        q: "Quanto serve per partire?",
        a: "Si parte da un caso concreto — ad esempio la ricerca sui capitolati — con un prototipo misurabile, poi si estende agli altri.",
      },
    ],
    relatedServices: ["ai-architecture", "ai-integration", "ai-readiness-assessment"],
    relatedArticles: ["knowledge-base-ai", "rag-vs-fine-tuning"],
    cta: "Richiedi una soluzione per l'ufficio tecnico",
  },
  {
    slug: "ai-studio-legale",
    eyebrow: "AI per settore · Studio legale",
    h1: "AI per studio legale",
    metaTitle: "AI per studio legale: ricerca atti, bozze e documenti | PYNK STUDIO",
    metaDescription:
      "AI per studi legali: ricerca semantica su atti e sentenze, sintesi di fascicoli, bozze di documenti. Con riservatezza, tracciabilità e supervisione dell'avvocato.",
    intro:
      "Vuoi usare l'AI nello studio senza compromettere riservatezza e qualità? Costruiamo assistenti che cercano negli atti, sintetizzano fascicoli e preparano bozze, sempre sotto il controllo dell'avvocato.",
    painsTitle: "Il problema oggi",
    pains: [
      "Ore spese a cercare tra atti, sentenze e fascicoli.",
      "Riservatezza dei dati dei clienti da proteggere.",
      "Atti e documenti ripetitivi da redigere.",
      "Timore di errori dell'AI su materia delicata.",
    ],
    howTitle: "Cosa costruiamo",
    how: [
      { title: "Ricerca semantica sui vostri documenti", body: "Trova per significato in atti, contratti e sentenze, non solo per parola esatta." },
      { title: "Sintesi e bozze supervisionate", body: "Riassunti di fascicoli e prime bozze, sempre riviste dall'avvocato prima dell'uso." },
      { title: "Riservatezza by design", body: "Permessi, tracciabilità e, dove serve, AI che non manda i dati fuori dallo studio." },
    ],
    deliverTitle: "Cosa ottieni",
    deliver: [
      "Ricerca rapida su atti e documenti.",
      "Sintesi di fascicoli in pochi minuti.",
      "Bozze da rivedere, non da accettare al buio.",
      "Riservatezza e supervisione umana garantite.",
    ],
    faq: [
      {
        q: "L'AI può sostituire l'avvocato?",
        a: "No, e non deve. L'AI velocizza ricerca, sintesi e bozze; la decisione e la verifica restano all'avvocato. Progettiamo esplicitamente la supervisione umana.",
      },
      {
        q: "I dati dei clienti sono al sicuro?",
        a: "La riservatezza è il punto di partenza: accessi controllati, tracciabilità e, se necessario, soluzioni on-premise che tengono i dati nello studio.",
      },
      {
        q: "Dobbiamo cambiare i nostri programmi?",
        a: "No: integriamo l'AI con i sistemi e i documenti che già usate, partendo da un caso concreto e misurabile.",
      },
    ],
    relatedServices: ["ai-architecture", "ai-risk-assessment", "ai-policy"],
    relatedArticles: ["knowledge-base-ai", "human-in-the-loop"],
    cta: "Richiedi una soluzione per lo studio legale",
  },
  {
    slug: "automazione-documenti",
    eyebrow: "Caso d'uso · Documenti",
    h1: "Automazione documenti con l'AI",
    metaTitle: "Automazione documenti con l'AI: estrazione e archiviazione | PYNK STUDIO",
    metaDescription:
      "Automatizza i documenti con l'AI: estrazione dati da PDF e fatture, classificazione, smistamento e archiviazione. Con validazioni e supervisione umana dove serve.",
    intro:
      "Quante ore se ne vanno a leggere, smistare e ricopiare documenti? Automatizziamo l'estrazione dei dati, la classificazione e l'archiviazione, lasciando il controllo umano dove conta davvero.",
    painsTitle: "Il problema oggi",
    pains: [
      "Dati ricopiati a mano da PDF, fatture ed email.",
      "Documenti smistati e archiviati manualmente.",
      "Errori di trascrizione difficili da scovare.",
      "Code di lavoro ripetitivo che rallentano tutto.",
    ],
    howTitle: "Come funziona",
    how: [
      { title: "Estrazione dati (OCR + AI)", body: "Legge PDF, scansioni, fatture e moduli ed estrae i campi che ti servono." },
      { title: "Classificazione e smistamento", body: "Capisce il tipo di documento e lo invia al posto o alla persona giusta." },
      { title: "Controllo dove serve", body: "Validazioni automatiche e revisione umana sui casi a bassa confidenza." },
    ],
    deliverTitle: "Cosa ottieni",
    deliver: [
      "Dati estratti e pronti nei tuoi sistemi.",
      "Smistamento e archiviazione automatici.",
      "Meno errori e meno lavoro manuale.",
      "Tracciabilità di ogni operazione svolta.",
    ],
    faq: [
      {
        q: "Funziona con scansioni e PDF di bassa qualità?",
        a: "Combiniamo OCR e AI per gestire anche documenti non perfetti, con un controllo umano sui casi incerti. L'accuratezza si misura sul vostro materiale reale.",
      },
      {
        q: "Si integra con i nostri gestionali?",
        a: "Sì: i dati estratti finiscono nei vostri sistemi — gestionale, ERP, archivio — tramite integrazione, non in un'isola separata.",
      },
      {
        q: "E se l'AI sbaglia?",
        a: "Per questo mettiamo validazioni e revisione umana sui casi a bassa confidenza, più il log di ogni operazione. L'obiettivo è ridurre il lavoro, non rinunciare al controllo.",
      },
    ],
    relatedServices: ["ai-integration", "ai-architecture"],
    relatedArticles: ["workflow-ai", "human-in-the-loop"],
    cta: "Automatizza i tuoi documenti",
  },
  {
    slug: "assistente-ai-clienti",
    eyebrow: "Caso d'uso · Customer care",
    h1: "Assistente AI per i clienti",
    metaTitle: "Assistente AI per i clienti: chatbot e voice AI su misura | PYNK STUDIO",
    metaDescription:
      "Assistenti AI per i clienti: chatbot e voice AI che rispondono sulle tue informazioni reali, h24, con passaggio all'operatore. Integrati con i tuoi sistemi.",
    intro:
      "Vuoi rispondere ai clienti più in fretta, anche fuori orario, senza che il servizio sembri un robot? Costruiamo assistenti AI che rispondono sulle tue informazioni reali e passano all'operatore quando serve.",
    painsTitle: "Il problema oggi",
    pains: [
      "Le stesse domande ripetute mille volte.",
      "Risposte lente o assenti fuori orario.",
      "Operatori sommersi da richieste semplici.",
      "Paura che il bot dia risposte sbagliate.",
    ],
    howTitle: "Cosa costruiamo",
    how: [
      { title: "Conosce la TUA azienda", body: "Risponde sulle vostre informazioni reali — FAQ, listini, procedure — non in generale." },
      { title: "Sa quando passare all'umano", body: "Per i casi complessi o delicati passa all'operatore con tutto il contesto già pronto." },
      { title: "Sui tuoi canali", body: "Sito, WhatsApp, email o voce, integrato con CRM e gestionale." },
    ],
    deliverTitle: "Cosa ottieni",
    deliver: [
      "Risposte immediate h24 sulle domande frequenti.",
      "Operatori liberi dai casi ripetitivi.",
      "Passaggio all'operatore fluido e con contesto.",
      "Conversazioni tracciate e migliorabili nel tempo.",
    ],
    faq: [
      {
        q: "Il bot rischia di dare risposte sbagliate?",
        a: "Per questo lo ancoriamo alle vostre informazioni reali, con guardrail e passaggio all'operatore quando non è sicuro. Le risposte si misurano e si migliorano nel tempo.",
      },
      {
        q: "Si collega ai nostri sistemi?",
        a: "Sì: CRM, gestionale, knowledge base, WhatsApp. L'assistente è davvero utile quando vede i dati reali, con i permessi giusti.",
      },
      {
        q: "Sostituisce gli operatori?",
        a: "No: li alleggerisce dai casi ripetitivi e passa loro i casi che richiedono una persona, con il contesto già pronto.",
      },
    ],
    relatedServices: ["ai-integration", "ai-architecture"],
    relatedArticles: ["come-progettare-un-agente-ai", "guardrails-ai"],
    cta: "Progetta il tuo assistente clienti",
  },
  {
    slug: "come-rispettare-ai-act",
    eyebrow: "Conformità · AI Act",
    h1: "Come rispettare l'AI Act",
    metaTitle: "Come rispettare l'AI Act: obblighi, scadenze e cosa fare | PYNK STUDIO",
    metaDescription:
      "Hai paura delle sanzioni dell'AI Act? Verifichiamo a cosa sei davvero obbligato in base a ruolo e rischio e ti mettiamo in regola con passi concreti. Senza panico.",
    intro:
      "Hai sentito parlare dell'AI Act e delle sanzioni e non sai se ti riguarda? Verifichiamo cosa devi fare davvero — in base a come usi l'AI — e ti accompagniamo passo passo. Senza allarmismi.",
    painsTitle: "Cosa ti preoccupa",
    pains: [
      "Paura di sanzioni senza sapere se ti riguardano.",
      "Non sai se sei “ad alto rischio” o no.",
      "Informazioni confuse e contrastanti ovunque.",
      "Timore di dover stravolgere il modo di lavorare.",
    ],
    howTitle: "Come ti mettiamo in regola",
    how: [
      { title: "Capiamo la tua situazione", body: "Quali strumenti AI usi e come: da qui dipende quasi tutto, ruolo e livello di rischio." },
      { title: "Verifichiamo gli obblighi reali", body: "Spesso sono meno di quanto temi. Ti diciamo cosa devi fare e cosa no, in chiaro." },
      { title: "Sistemiamo i punti che servono", body: "Formazione (Articolo 4), regole d'uso, documentazione e controlli proporzionati." },
    ],
    deliverTitle: "Cosa ottieni",
    deliver: [
      "Un quadro chiaro di cosa ti riguarda davvero.",
      "Una lista di azioni concrete e prioritarie.",
      "Formazione e regole d'uso per il personale.",
      "Documentazione utile in caso di controlli.",
    ],
    faq: [
      {
        q: "L'AI Act riguarda anche la mia piccola azienda?",
        a: "Dipende da come usi l'AI. Molti usi comuni hanno obblighi leggeri, come la formazione del personale. Una verifica breve chiarisce cosa ti riguarda davvero, senza panico.",
      },
      {
        q: "Rischio sanzioni se uso ChatGPT?",
        a: "Usare uno strumento non ti rende automaticamente “ad alto rischio”. Le sanzioni riguardano violazioni precise: la cosa sensata è capire dove ti collochi e sistemare i pochi punti che servono.",
      },
      {
        q: "Quanto è complicato mettersi in regola?",
        a: "Spesso meno del previsto: inventario degli usi, formazione adeguata e poche regole chiare coprono la maggior parte delle situazioni. Lo facciamo noi insieme a te.",
      },
    ],
    relatedServices: ["valutazione-obblighi-ai-act", "ai-literacy", "ai-policy"],
    relatedArticles: ["ai-act-pmi", "sistemi-ai-ad-alto-rischio", "ai-literacy-articolo-4"],
    cta: "Verifica se sei in regola con l'AI Act",
  },
  {
    slug: "formazione-ai-dipendenti",
    eyebrow: "Formazione · AI Literacy",
    h1: "Formazione AI per i dipendenti",
    metaTitle: "Formazione AI per i dipendenti: percorsi per ruolo | PYNK STUDIO",
    metaDescription:
      "Formazione AI per i tuoi dipendenti, modulata per ruolo: usare l'AI bene e in sicurezza e rispettare l'Articolo 4 dell'AI Act. Workshop, affiancamento e casi reali.",
    intro:
      "Vuoi che i tuoi dipendenti usino l'AI bene, in sicurezza e nel rispetto delle regole? Costruiamo percorsi di formazione su misura, diversi per ruolo, con esercizi sui casi reali della tua azienda.",
    painsTitle: "Il problema oggi",
    pains: [
      "Dipendenti che usano l'AI a caso, o per niente.",
      "Rischio di esporre dati per disattenzione.",
      "Obbligo di formazione dell'AI Act (Articolo 4).",
      "Corsi generici che non lasciano nulla.",
    ],
    howTitle: "Come funziona il percorso",
    how: [
      { title: "Partiamo dai ruoli", body: "Direzione, IT, marketing, customer care, HR: ognuno impara ciò che gli serve davvero." },
      { title: "Teoria e pratica insieme", body: "Fondamenti, prompting, sicurezza dei dati, AI Act, più laboratori su casi veri." },
      { title: "Affiancamento, non solo aula", body: "Workshop, office hours, revisione di prompt e workflow reali." },
    ],
    deliverTitle: "Cosa ottieni",
    deliver: [
      "Personale che usa l'AI con criterio e in sicurezza.",
      "Conformità all'Articolo 4 dell'AI Act.",
      "Competenze differenziate per ruolo.",
      "Materiali, checklist e workflow pronti all'uso.",
    ],
    faq: [
      {
        q: "La formazione AI è obbligatoria?",
        a: "L'Articolo 4 dell'AI Act richiede un livello adeguato di competenza per chi usa l'AI in azienda. Un percorso documentato e proporzionato al ruolo soddisfa questo requisito.",
      },
      {
        q: "Serve anche se usiamo poco l'AI?",
        a: "Sì, soprattutto: i rischi maggiori nascono dall'uso inconsapevole. Anche un percorso base evita gli errori più comuni, come dati esposti e output non verificati.",
      },
      {
        q: "Quanto dura?",
        a: "Si lavora per moduli combinabili: un percorso base per tutti e approfondimenti per ruolo, distribuiti nel tempo con affiancamento.",
      },
    ],
    relatedServices: ["ai-literacy", "valutazione-obblighi-ai-act"],
    relatedArticles: ["ai-literacy-articolo-4", "ai-act-pmi"],
    cta: "Pianifica la formazione AI",
  },
];

export function getPynkSolution(slug: string) {
  return pynkSolutions.find((solution) => solution.slug === slug);
}
