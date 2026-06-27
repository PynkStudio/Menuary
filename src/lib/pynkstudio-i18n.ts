import { createTenantI18n } from "@/lib/tenant-i18n";

/**
 * Copy PYNK STUDIO. Il sito usa un doppio registro testuale ("Nerd mode"):
 * plain = linguaggio semplice, nerd = dettaglio tecnico. Entrambi vivono
 * dentro la stessa lingua; la Nerd mode NON è una lingua ma un toggle UI.
 */
export type PynkDual = { plain: string; nerd: string };

export function pynkT(d: PynkDual, nerd: boolean): string {
  return nerd ? d.nerd : d.plain;
}

const it = {
  languageLabel: "Lingua",
  nav: {
    servizi: "Servizi",
    settori: "Settori",
    lavori: "Lavori",
    consulenza: "Consulenza",
    contattaci: "Contattaci",
  },
  footer: {
    piva: "P.IVA 13577530960",
    staff: "Area staff",
    poweredBy: "Powered by",
  },
  homeHero: {
    title: {
      plain: "Costruiamo sistemi AI che reggono il mondo reale.",
      nerd: "AI engineering · RAG · agenti · governance · produzione.",
    } as PynkDual,
    subtitle: {
      plain:
        "Software house tecnica per aziende che vogliono progettare, integrare e governare soluzioni AI moderne: chatbot, agenti, RAG, automazioni, API e software su misura.",
      nerd:
        "OpenAI/Claude/Gemini, Llama/Mistral/Qwen, RAG con vector DB, tool calling, MCP, API REST/GraphQL, Postgres, Supabase, osservabilità, eval e deploy ripetibili.",
    } as PynkDual,
    ctaPrimary: "Cosa costruiamo",
    ctaSecondary: "Vedi i lavori",
  },
  homePortfolio: {
    title: { plain: "Dove abbiamo già messo le mani", nerd: "Portfolio · repo & prod" } as PynkDual,
    subtitle: {
      plain:
        "Alcuni prodotti e siti che abbiamo curato end-to-end: software professionale, strumenti operativi, esperienze web, mobile e titoli creativi.",
      nerd:
        "Estratto di case study: stack, contesto e scelte tecniche dove aggiungono valore; attiva la modalità Nerd per il dettaglio.",
    } as PynkDual,
    cta: { plain: "Vedi tutti i lavori", nerd: "Apri /lavori" } as PynkDual,
  },
  homeDevPillars: [
    {
      id: "web",
      title: { plain: "Siti e web app", nerd: "Web & product engineering" } as PynkDual,
      desc: {
        plain:
          "Dal sito vetrina al portale con login: velocità percepita, SEO sensato e pannello che non spaventa chi deve aggiornarlo.",
        nerd:
          "Next.js App Router, RSC dove utile, Tailwind, shadcn/ui, CMS headless (Sanity/Payload), Vercel/edge, SEO tecnico e Core Web Vitals.",
      } as PynkDual,
      stack: ["Next.js", "React", "TypeScript", "Tailwind", "Supabase", "Vercel"],
    },
    {
      id: "mobile",
      title: { plain: "App iOS e Android", nerd: "Mobile · native & cross" } as PynkDual,
      desc: {
        plain:
          "Per utenti finali o squadre sul campo: notifiche, sessione sicura, integrazione con i vostri backend.",
        nerd:
          "SwiftUI/UIKit per iOS, Kotlin/Jetpack su Android, React Native/Expo per MVP cross-platform, push, keychain, deep linking, store release.",
      } as PynkDual,
      stack: ["Swift", "SwiftUI", "Kotlin", "React Native", "Expo"],
    },
    {
      id: "desktop",
      title: { plain: "Applicazioni desktop", nerd: "Desktop & tooling" } as PynkDual,
      desc: {
        plain:
          "Programmi su misura per ufficio, produzione o amministrazione, anche quando il browser non basta.",
        nerd:
          "macOS nativo (Swift/AppKit), Electron o Tauri per Windows/macOS/Linux, integrazione file system, auto-update, firma notarizzazione Apple.",
      } as PynkDual,
      stack: ["Swift", "AppKit", "Electron", "Tauri", "Rust"],
    },
  ],
  homeCrossSkills: [
    {
      id: "ai",
      title: { plain: "AI e automazioni", nerd: "LLM · RAG · automazione" } as PynkDual,
      desc: {
        plain: "Chatbot, agenti, voice AI, RAG, automazioni e integrazioni progettate con dati, permessi e supervisione sotto controllo.",
        nerd:
          "OpenAI/Anthropic/Gemini APIs, modelli open-weight, pgvector, chunking, retrieval eval, function/tool calling, MCP, queue workers e webhooks.",
      } as PynkDual,
      stack: ["OpenAI", "Claude", "Gemini", "pgvector", "MCP", "Node.js"],
    },
    {
      id: "ux",
      title: { plain: "UX e design", nerd: "Design systems & a11y" } as PynkDual,
      desc: {
        plain: "Interfacce coerenti, accessibili, pensate per chi deve usarle ogni giorno.",
        nerd: "Figma → component library, design tokens, WCAG 2.2 AA, focus management, test utente iterativi.",
      } as PynkDual,
      stack: ["Figma", "WCAG", "Radix", "Storybook"],
    },
    {
      id: "data",
      title: { plain: "Dati e mappe", nerd: "GIS · analytics" } as PynkDual,
      desc: {
        plain: "Dashboard, report e mappe interattive per decidere con numeri sotto mano.",
        nerd: "PostGIS, Mapbox/Leaflet, ETL leggeri, charting (Recharts/Tremor), export CSV/Parquet.",
      } as PynkDual,
      stack: ["PostGIS", "Mapbox", "PostgreSQL", "React"],
    },
    {
      id: "integrazioni",
      title: { plain: "Integrazioni", nerd: "API & event-driven" } as PynkDual,
      desc: {
        plain: "Colleghiamo CRM, gestionale, pagamenti e strumenti che già usate.",
        nerd: "REST/GraphQL, OAuth2, Stripe, Zapier/Make fallback, idempotency, retry/backoff, OpenAPI.",
      } as PynkDual,
      stack: ["REST", "GraphQL", "Stripe", "OAuth2", "webhooks"],
    },
  ],
  homeSectorsStrip: {
    title: { plain: "Settori in cui lavoriamo", nerd: "Verticali & integrazioni tipiche" } as PynkDual,
    subtitle: {
      plain: "Dal commercio ai servizi professionali, dalla cultura all'industria.",
      nerd: "Pattern ripetibili: auth, ruoli, fatturazione, logistica, contenuti multilingua.",
    } as PynkDual,
    pills: ["E-commerce", "Servizi professionali", "Industria", "Cultura e turismo", "PA e associazioni"],
    cta: "Approfondisci i settori",
  },
  homeConsulting: {
    title: { plain: "Consulenza operativa per PMI", nerd: "Ops consulting (secondario)" } as PynkDual,
    desc: {
      plain:
        "Quando il problema non è solo “manca l'app” ma manca ordine in chi fa cosa: check-up in 7 giorni, piano 30/60/90, niente fuffa.",
      nerd: "Workflow discovery, RACI, handoff verso backlog tecnico. Non legal/HR; output misurabile verso execution.",
    } as PynkDual,
    cta: "Scopri la consulenza",
  },
  homeSectionLeads: {
    whatWeDo: {
      plain: "Tre pilastri che tocchiamo in quasi ogni mandato.",
      nerd: "Delivery surfaces: web, mobile, desktop runtimes.",
    } as PynkDual,
    cross: {
      plain: "Ciò che attraversa ogni stack: dati, integrazioni, UX, automazioni.",
      nerd: "Cross-cutting concerns: a11y, APIs, observability, ML hooks.",
    } as PynkDual,
  },
  homeFinal: {
    titleLead: "Prossimo progetto:",
    titleAccent: "il vostro?",
    body: "Obiettivi, tempi, vincoli: parliamone senza giri di parole.",
    cta: "Contattaci",
  },
  serviziPage: {
    heroTitle: { plain: "Cosa costruiamo", nerd: "Service catalog · engineering" } as PynkDual,
    heroSubtitle: {
      plain:
        "Dalla landing che converte al gestionale che toglie email infinite: un solo modo di lavorare — chiaro, misurabile, documentato.",
      nerd:
        "ADR leggeri, repo strutturati, env per staging/prod, contract test sulle API critiche. Handover: non vi lasciamo un black box.",
    } as PynkDual,
    heroCta: "Raccontaci il progetto",
    bottomNote: "Non trovate la voce giusta? Uniamo più ambiti nello stesso progetto.",
    bottomCta: "Scrivici",
  },
  serviziCards: [
    {
      id: "siti",
      title: { plain: "Siti web e landing", nerd: "Marketing sites & landing" } as PynkDual,
      desc: {
        plain:
          "Siti veloci, curati nei testi e nelle immagini, pronti per Google e per i social. Facili da aggiornare quando cambiate offerta.",
        nerd:
          "Next.js 15, ISR/SSG, MDX, sitemap/robots, JSON-LD, OG images dinamiche, CMS headless, analytics privacy-first (Plausible/PostHog).",
      } as PynkDual,
      stack: ["Next.js", "TypeScript", "Tailwind", "Sanity", "Vercel"],
    },
    {
      id: "webapp",
      title: { plain: "Web app e gestionali", nerd: "B2B web apps & admin" } as PynkDual,
      desc: {
        plain:
          "Portali per clienti, back-office, approvazioni e flussi su misura: tutto nel browser, con accessi sicuri.",
        nerd:
          "React SPA o Next full-stack, TanStack Query, Zod, Supabase Auth/RLS o custom JWT, file upload (S3-compatible), audit log.",
      } as PynkDual,
      stack: ["React", "TypeScript", "Supabase", "PostgreSQL", "Zod"],
    },
    {
      id: "mobile",
      title: { plain: "App mobile", nerd: "iOS · Android" } as PynkDual,
      desc: {
        plain:
          "App per i vostri utenti o per il team sul campo: notifiche, login sicuro, aggiornamenti dallo store.",
        nerd:
          "SwiftUI + TCA o MVVM, Kotlin Compose, RN/Expo per time-to-market; push APNs/FCM, deep links, biometric auth.",
      } as PynkDual,
      stack: ["SwiftUI", "Kotlin", "React Native", "Expo"],
    },
    {
      id: "desktop",
      title: { plain: "Applicazioni desktop", nerd: "Desktop clients" } as PynkDual,
      desc: {
        plain:
          "Programmi per Windows e Mac quando servono stampanti, file locali o lavoro senza connessione stabile.",
        nerd:
          "macOS Swift/AppKit, cross-platform Electron/Tauri; auto-update (Sparkle/electron-updater), code signing, crash reporting.",
      } as PynkDual,
      stack: ["Swift", "Electron", "Tauri", "Rust"],
    },
    {
      id: "ai",
      title: { plain: "Automazioni e AI", nerd: "Automation · LLM" } as PynkDual,
      desc: {
        plain:
          "Collegiamo gli strumenti che già usate e, dove ha senso, aggiungiamo assistenti sui vostri documenti.",
        nerd:
          "Node/Python workers, queue (BullMQ), OpenAI/Anthropic, RAG su pgvector, function calling, valutazione offline delle risposte.",
      } as PynkDual,
      stack: ["Node.js", "Python", "OpenAI", "pgvector", "Redis"],
    },
  ],
  settoriPage: {
    heroTitle: { plain: "Settori e contesti", nerd: "Industries · solution patterns" } as PynkDual,
    heroSubtitle: {
      plain:
        "Stesso metodo di ingegneria, lessico adattato al settore: meno slide, più flussi e integrazioni che sanno di produzione.",
      nerd:
        "Blueprint riusabili: auth multi-ruolo, cataloghi, prenotazioni, documentale, integrazioni ERP leggere.",
    } as PynkDual,
    heroCta: "Vedi i servizi",
    bottomCta: "Progetto in uno di questi settori?",
  },
  settoriCards: [
    {
      id: "ecommerce",
      title: { plain: "E-commerce e retail", nerd: "Commerce stack" } as PynkDual,
      desc: {
        plain: "Negozi online, cataloghi ricchi, pagamenti e spedizioni collegati ai vostri processi.",
        nerd:
          "Shopify Hydrogen/Custom storefront, Stripe Connect/SCA, inventory sync, Algolia search, webhooks ordine → WMS/ERP.",
      } as PynkDual,
      stack: ["Shopify", "Stripe", "Next.js", "Algolia"],
    },
    {
      id: "professionisti",
      title: { plain: "Servizi professionali", nerd: "Professional services" } as PynkDual,
      desc: {
        plain: "Studi legali, consulenza, formazione: siti credibili, aree riservate clienti e gestione pratiche.",
        nerd: "Portali con RBAC, document versioning, firma elettronica via provider, logging accessi, export PDF/A.",
      } as PynkDual,
      stack: ["Next.js", "Supabase", "RBAC", "PDF"],
    },
    {
      id: "industria",
      title: { plain: "PMI e industria", nerd: "SMB / manufacturing" } as PynkDual,
      desc: {
        plain: "Strumenti interni per produzione, qualità, commesse e magazzino — meno Excel disperso.",
        nerd: "CRUD app + reporting, barcode/mobile web, integrazione CSV/API verso gestionale, job schedulati, backup.",
      } as PynkDual,
      stack: ["React", "PostgreSQL", "cron", "REST"],
    },
    {
      id: "cultura",
      title: { plain: "Cultura e turismo", nerd: "Culture & tourism" } as PynkDual,
      desc: {
        plain: "Siti multilingua, calendari eventi, prenotazioni e contenuti multimediali.",
        nerd: "i18n routing, CDN media, mappe interattive, caching edge, form rate-limit, integrazione booking provider.",
      } as PynkDual,
      stack: ["Next.js", "i18n", "Mapbox", "CDN"],
    },
    {
      id: "pa",
      title: { plain: "PA e associazioni", nerd: "Public sector / NPO" } as PynkDual,
      desc: {
        plain: "Comunicazione chiara, modulistica, aree riservate volontari o soci.",
        nerd: "Accessibilità AA, cookie policy, hosting UE, ruoli granulari, audit trail, export dati su richiesta.",
      } as PynkDual,
      stack: ["WCAG", "EU hosting", "audit log", "RBAC"],
    },
  ],
  lavoriPage: {
    titleLead: "Lavori e",
    titleAccent: "progetti",
    subtitle:
      "Dal gestionale al sito vetrina, dal coordinamento sul territorio al gioco per telefono: progetti reali, con una scheda che racconta contesto e valore per ciascuno.",
    cta: "Raccontaci il prossimo",
    srTitle: "Progetti realizzati",
    sitesTitleLead: "Siti",
    sitesTitleAccent: "online ora",
    sitesSubtitle:
      "Attività reali che gestiamo sulla nostra piattaforma. Clienti già pubblicati sul proprio dominio — clicca per visitare il sito live.",
    sitesVisit: "Visita il sito",
  },
  // Prenotazione call di consulenza (flusso /prenota-call, stile Calendly).
  prenotaCallPage: {
    metaTitle: "Prenota una call di 20 minuti — PYNK STUDIO",
    metaDescription:
      "Scegli giorno e orario per una call gratuita di 20 minuti con PYNK STUDIO. Lun-ven, 10:00-18:00.",
    eyebrow: "Call gratuita · 20 minuti",
    titleLead: "Prenota la tua",
    titleAccent: "call",
    subtitle:
      "Scegli il momento che preferisci: lun-ven, 10:00–18:00. Bastano 20 minuti per capire come possiamo aiutarti.",
    stepDate: "1 · Scegli il giorno",
    stepTime: "2 · Scegli l'orario",
    stepDetails: "3 · I tuoi dati",
    noSlots: "Nessuno slot disponibile in questo giorno.",
    loadingSlots: "Carico gli orari…",
    slotTaken: "Questo orario è appena stato prenotato. Scegline un altro.",
    backToDate: "← Cambia giorno",
    backToTime: "← Cambia orario",
    selectedLabel: "Hai scelto:",
    form: {
      name: "Nome e cognome *",
      namePlaceholder: "Il tuo nome",
      email: "Email *",
      emailPlaceholder: "email@azienda.it",
      phone: "Telefono *",
      phonePlaceholder: "+39 ...",
      topic: "Argomento della call *",
      topicPlaceholder: "Di cosa vuoi parlare? (es. organizzazione ufficio, nuovo gestionale…)",
      submit: "Conferma prenotazione",
      sending: "Prenoto…",
      errorRequired: "Compila tutti i campi obbligatori.",
      errorEmail: "Inserisci un indirizzo email valido.",
      errorGeneric: "Si è verificato un errore. Riprova.",
    },
    successTitle: "Call confermata!",
    successBody: "Ti abbiamo inviato un'email di conferma. A presto!",
    successAgain: "Prenota un'altra call",
    weekdays: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
    months: [
      "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
      "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
    ],
  },
  consulenzaPage: {
    eyebrow: "Oltre allo sviluppo",
    titleLead: "Consulenza operativa per",
    titleAccent: "PMI",
    intro1: "Mettiamo ordine in workflow e responsabilità prima di parlare di software. Il nostro ingresso tipico è il ",
    introStrong: "Check-up Operativo in 7 giorni",
    intro2: ": un prodotto completo, con esito chiaro.",
    heroCta: "Parliamo 20 minuti",
    checkupTitleLead: "Check-up in",
    checkupTitleAccent: "7 giorni",
    checkupBody:
      "Diagnosi strutturata dei flussi operativi. Alla fine avete criticità prioritarie e un piano concreto — potete anche applicarlo in autonomia.",
    stepsCheckup: [
      { title: "Call preliminare", desc: "20 minuti per capire se il check-up è lo strumento giusto." },
      { title: "Raccolta informazioni", desc: "Documenti, procedure, descrizione dei flussi attuali." },
      { title: "Sessione operativa", desc: "Osserviamo il lavoro reale con chi lo svolge ogni giorno." },
      { title: "Analisi", desc: "Criticità, colli di bottiglia, sovrapposizioni di ruoli." },
      { title: "Restituzione", desc: "Report con priorità e piano a 30, 60 e 90 giorni." },
    ],
    targetTitleLead: "A chi è",
    targetTitleAccent: "rivolto",
    target: [
      "Carico quotidiano ingestibile, poco tempo per capire cosa non funziona.",
      "Molte comunicazioni e scadenze gestite con strumenti non adatti.",
      "Responsabilità poco chiare: tutti fanno tutto, nessuno chiude.",
    ],
    deliverablesTitleLead: "Cosa",
    deliverablesTitleAccent: "ricevete",
    deliverables: [
      "3–5 criticità prioritarie per impatto.",
      "Piano operativo a 30, 60 e 90 giorni.",
      "Indicazioni sugli strumenti solo se necessarie.",
    ],
    deliverablesNote: "Non è consulenza legale, HR disciplinare né una lista di software da comprare.",
    methodTitleLead: "Il nostro",
    methodTitleAccent: "metodo",
    framework: [
      { number: "1", title: "Analisi", desc: "Flussi reali, strumenti, dove si blocca il lavoro." },
      { number: "2", title: "Priorità", desc: "Cosa affrontare prima per massimo impatto." },
      { number: "3", title: "Strutturazione", desc: "Workflow, ruoli, procedure esplicite." },
      { number: "4", title: "Implementazione", desc: "Cambiamenti graduali; strumenti solo se servono." },
      { number: "5", title: "Monitoraggio", desc: "Verifica nel tempo e aggiustamenti." },
    ],
    methodNote:
      "Quando il check-up indica strumenti digitali, li progettiamo e realizziamo noi come software house. Prima il sistema, poi il codice.",
    finalTitleLead: "Volete partire da",
    finalTitleAccent: "qui",
    finalCta: "Contattaci",
  },
  // Landing dedicata alle campagne Google Ads (organizzazione interna PMI/uffici).
  // Pagina chromeless e noindex: non compete con /consulenza, serve solo a convertire.
  organizzazionePage: {
    metaTitle: "Organizzazione interna PMI e uffici — Check-up in 7 giorni | PYNK STUDIO",
    metaDescription:
      "Troppe email, scadenze perse, ruoli confusi? Mettiamo ordine nei processi del tuo ufficio in 7 giorni: criticità prioritarie e piano operativo a 30/60/90 giorni. Prima call gratuita.",
    badge: "Check-up Operativo · 7 giorni",
    heroTitleLead: "Il tuo ufficio è sempre in",
    heroTitleAccent: "emergenza?",
    heroSubtitle:
      "Email infinite, scadenze che saltano e nessuno che sa chi fa cosa. Rimettiamo ordine nei processi interni della tua PMI in 7 giorni — senza stravolgere il team e senza comprare software inutili.",
    heroCtaPrimary: "Richiedi la call gratuita",
    heroCtaSecondary: "Chiama ora",
    heroReassurance: "Call di 20 minuti, senza impegno · Risposta in 24h",
    painTitleLead: "Riconosci questi",
    painTitleAccent: "segnali?",
    pains: [
      "Le informazioni importanti si perdono tra email, chat e fogli sparsi.",
      "Le scadenze saltano perché nessuno ha una visione d'insieme.",
      "Tutti fanno tutto: responsabilità confuse, niente viene mai chiuso davvero.",
      "Il carico quotidiano non lascia tempo per capire cosa non funziona.",
    ],
    benefitsTitleLead: "Cosa cambia dopo il",
    benefitsTitleAccent: "check-up",
    benefits: [
      { title: "Processi chiari", desc: "Workflow e procedure esplicite: ognuno sa cosa fare e quando." },
      { title: "Ruoli definiti", desc: "Responsabilità assegnate, decisioni che non rimbalzano più." },
      { title: "Meno caos digitale", desc: "Comunicazioni e scadenze in un posto solo, non in dieci." },
      { title: "Priorità sulle cose giuste", desc: "Sai dove intervenire prima per il massimo impatto." },
    ],
    processTitleLead: "Come funziona il",
    processTitleAccent: "check-up in 7 giorni",
    process: [
      { number: "1", title: "Call preliminare", desc: "20 minuti per capire se il check-up è lo strumento giusto per te." },
      { number: "2", title: "Raccolta e osservazione", desc: "Analizziamo documenti e flussi reali insieme a chi lavora ogni giorno." },
      { number: "3", title: "Analisi", desc: "Individuiamo criticità, colli di bottiglia e sovrapposizioni di ruoli." },
      { number: "4", title: "Restituzione", desc: "Report con priorità e piano operativo a 30, 60 e 90 giorni." },
    ],
    deliverTitleLead: "Cosa",
    deliverTitleAccent: "ricevi",
    deliverables: [
      "3–5 criticità prioritarie ordinate per impatto reale.",
      "Piano operativo concreto a 30, 60 e 90 giorni.",
      "Indicazioni sugli strumenti digitali solo se servono davvero.",
    ],
    deliverNote:
      "Non è consulenza legale o HR disciplinare, né una lista di software da comprare. È un metodo per far funzionare meglio il lavoro che già fai.",
    faqTitleLead: "Domande",
    faqTitleAccent: "frequenti",
    faq: [
      {
        q: "Dovremo cambiare gestionale o comprare software?",
        a: "No. Prima mettiamo ordine nei processi. Gli strumenti digitali arrivano dopo, solo se il check-up dimostra che servono — e in quel caso possiamo realizzarli noi.",
      },
      {
        q: "Quanto tempo dobbiamo dedicarci?",
        a: "Pochissimo: una call iniziale, la condivisione di alcune informazioni e una breve sessione operativa. Il grosso del lavoro lo facciamo noi.",
      },
      {
        q: "Va bene anche per un ufficio piccolo?",
        a: "Sì. Il check-up è pensato per PMI e uffici dove poche persone gestiscono molte cose: è lì che l'ordine nei processi fa la differenza più grande.",
      },
      {
        q: "Cosa succede dopo la call gratuita?",
        a: "Nessun impegno. Se il check-up è utile te lo proponiamo; altrimenti te lo diciamo chiaramente. La call serve a capirlo insieme.",
      },
    ],
    finalTitleLead: "Basta lavorare nel",
    finalTitleAccent: "caos.",
    finalSubtitle:
      "Lascia i tuoi dati: ti ricontattiamo entro 24 ore per fissare una call gratuita di 20 minuti.",
    formTitle: "Richiedi la call gratuita",
  },
  contattiPage: {
    titleLine1: "Parliamo del vostro",
    titleAccent: "progetto.",
    subtitle:
      "Sviluppo software o consulenza operativa: compilate il form o scriveteci. Call di 20 minuti, senza impegno.",
    email: "info@pynkstudio.it",
    phoneLabel: "+39 351 3768607",
    phoneHref: "tel:+393513768607",
    whatsappLabel: "Scrivici su WhatsApp",
    whatsappHref: "https://wa.me/393513768607?text=Buongiorno%2C%20vorrei%20informazioni%20su%20PYNK%20STUDIO.",
    copyAria: "Copia email",
    form: {
      name: "Nome *",
      namePlaceholder: "Il vostro nome",
      company: "Azienda",
      companyPlaceholder: "Nome azienda",
      people: "Numero persone",
      peoplePlaceholder: "es. 5-10",
      sector: "Settore",
      sectorPlaceholder: "es. Servizi, consulenza, logistica",
      email: "Email *",
      emailPlaceholder: "email@azienda.it",
      phone: "Telefono",
      phoneOptional: "(opzionale)",
      phonePlaceholder: "+39 ...",
      message: "Breve descrizione del problema *",
      messagePlaceholder:
        "Descrivete obiettivi, tempistiche o contesto (es. nuovo sito, app, integrazione, check-up operativo)...",
      submit: "Invia messaggio",
      errorRequired: "Compila nome, email e descrizione del problema.",
      errorEmail: "Inserisci un indirizzo email valido.",
      success: "Messaggio inviato! Vi ricontattiamo al più presto.",
      errorGeneric: "Si è verificato un errore. Riprova più tardi.",
    },
  },
  unsubscribePage: {
    title: "Disiscrizione email",
    body:
      "Vuoi smettere di ricevere comunicazioni da PYNK STUDIO? Inserisci la tua email: rimuoviamo l'indirizzo dalla lista contatti.",
    emailPlaceholder: "la-tua@email.it",
    submit: "Conferma disiscrizione",
    success: "Richiesta ricevuta: l'indirizzo verrà rimosso dalla lista.",
    invalid: "Inserisci un indirizzo email valido.",
    error: "Si è verificato un errore. Riprova più tardi.",
  },
  visitCard: {
    name: "Massimo Pernozzoli",
    role: "CEO · Pynk Studio",
    phoneLabel: "+39 351 376 8607",
    phoneHref: "tel:+393513768607",
    email: "info@pynkstudio.it",
    saveContact: "Salva in rubrica",
    downloadVcf: "Scarica .vcf",
    qrHint: "Scansiona per aprire questa pagina",
    toastDownloaded: "vCard scaricata: apri il file per aggiungere il contatto alla rubrica.",
  },
  nerdToggle: {
    enable: "Attiva modalità tecnica",
    disable: "Disattiva modalità tecnica",
    hint: "Per chi conosce stack e linguaggi",
  },
  portfolioLabels: {
    platform: "Piattaforma",
    web: "Web",
    game: "Gioco / 3D",
    tool: "Tool",
    mobile: "Mobile",
    desktop: "Desktop",
    openSite: "Apri sito",
    testflight: "Prova su TestFlight",
    noLink: "Scheda senza link esterno.",
  },
} as const;

const translations = { it } as const;

export type PynkLanguage = keyof typeof translations;
export type PynkCopy = (typeof translations)["it"];

export const pynkstudioI18n = createTenantI18n({
  tenantId: "pynkstudio",
  previewSlug: "pynkstudio",
  defaultLanguage: "it",
  translations,
});

export const setPynkLanguage = pynkstudioI18n.setLanguage;
export const usePynkCopy = pynkstudioI18n.useCopy;
export const usePynkLanguage = pynkstudioI18n.useLanguage;
