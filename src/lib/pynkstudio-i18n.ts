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
    // NAP: deve coincidere con l'indirizzo della Google Business Profile.
    address: "Via Gino Severini 1, Milano",
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
  videocallPage: {
    metaTitle: "Videocall — PYNK STUDIO",
    eyebrow: "Videocall · PYNK STUDIO",
    titleLead: "La tua",
    titleAccent: "videocall",
    subtitle:
      "Controlla microfono e videocamera, poi entra. Funziona dal browser, da computer o telefono: non serve installare nulla.",
    whenLabel: "Quando",
    topicLabel: "Argomento",
    invalidTitle: "Link non valido",
    invalidBody: "Il link che hai aperto non corrisponde a nessuna prenotazione. Controlla l'email di conferma o scrivici.",
    notVideoBody: "Questa call è telefonica: ti chiamiamo noi al numero che hai indicato.",
    cancelledBody: "Questa call è stata annullata. Se vuoi, puoi prenotarne un'altra.",
    bookAgain: "Prenota una call",
    callTitle: "Call con PYNK STUDIO · 20 min",
    labels: {
      readyTitle: "Pronto a partecipare?",
      joiningAs: "Parteciperai come",
      join: "Partecipa",
      microphone: "Microfono",
      camera: "Videocamera",
      speaker: "Altoparlante",
      defaultDevice: "Predefinito",
      cameraOffPreview: "La videocamera è spenta",
      deviceError: "Videocamera o microfono non disponibili. Controlla i permessi del browser.",
      micOn: "Disattiva microfono",
      micOff: "Attiva microfono",
      cameraOn: "Disattiva videocamera",
      cameraOff: "Attiva videocamera",
      shareScreen: "Presenta lo schermo",
      stopSharing: "Interrompi la presentazione",
      presentingSuffix: "sta presentando",
      deviceSettings: "Impostazioni dispositivi",
      noDevices: "Nessun dispositivo trovato. Controlla i permessi del browser.",
      leave: "Abbandona la chiamata",
      people: "Persone",
      chat: "Chat",
      you: "tu",
      waitingAlone: "In attesa che gli altri partecipino…",
      chatPlaceholder: "Scrivi un messaggio",
      send: "Invia",
      noMessages: "I messaggi sono visibili solo a chi è in chiamata e vengono eliminati alla fine.",
      reconnecting: "Connessione persa. Mi ricollego…",
      enableAudio: "Clicca per attivare l'audio",
      connecting: "Mi collego…",
      left: "Hai abbandonato la chiamata.",
      rejoin: "Rientra",
      tooEarlyLead: "La stanza si apre alle",
      tooEarlyTail: ". Riprova tra poco.",
      ended: "Questa videocall è terminata.",
      cancelled: "Questa call è stata annullata.",
      forbidden: "Questo link non è valido.",
      generic: "Non riesco a collegarmi. Riprova tra qualche istante.",
    },
  },
  consulenzaPage: {
    eyebrow: "Partner tecnologico per aziende",
    titleLead: "La tecnologia deve far funzionare",
    titleAccent: "meglio l’azienda.",
    intro1: "Analizziamo ciò che rallenta il lavoro, progettiamo la soluzione e la realizziamo. ",
    introStrong: "Software, integrazioni, automazioni e infrastruttura",
    intro2: ": un solo team responsabile del risultato.",
    heroCta: "Parliamo del vostro progetto",
    heroSecondary: "Esplora le competenze",
    assurances: ["Prima call di 20 minuti", "Analisi tecnica concreta", "Nessun pacchetto imposto"],
    systemLabel: "Sistema sotto controllo",
    systemTitle: "Architettura aziendale",
    systemSubtitle: "Progettata, documentata, manutenibile.",
    systemRows: [
      { label: "Processi", value: "mappati" },
      { label: "Integrazioni", value: "governate" },
      { label: "Sicurezza", value: "verificata" },
      { label: "Evoluzione", value: "pianificata" },
    ],
    verifiedLabel: "Verificato",
    proofLabel: "Ambiti di competenza",
    proofItems: ["Software su misura", "Cloud e infrastruttura", "Automazioni", "AI applicata", "Cybersecurity", "Supporto continuativo"],
    capabilitiesEyebrow: "Competenze end-to-end",
    capabilitiesTitle: "Dalla criticità operativa al sistema che la risolve.",
    capabilitiesBody: "Non consegniamo tecnologia scollegata dal lavoro reale. Uniamo analisi, sviluppo e gestione per costruire sistemi solidi e comprensibili.",
    capabilities: [
      { title: "Software su misura", desc: "Applicazioni web, portali e strumenti interni costruiti sui vostri flussi." },
      { title: "Sistemi e integrazioni", desc: "CRM, ERP, gestionali, API e servizi che finalmente comunicano tra loro." },
      { title: "Dati e automazioni", desc: "Dati ordinati, attività ripetitive automatizzate e controllo sui passaggi critici." },
      { title: "Sicurezza applicativa", desc: "Accessi, ruoli, protezione dei dati, audit e scelte tecniche verificabili." },
      { title: "Cloud e continuità", desc: "Deploy, monitoraggio, backup e infrastruttura pensati per restare affidabili." },
      { title: "Prodotti mobile-first", desc: "Esperienze veloci e accessibili per clienti, collaboratori e rete vendita." },
    ],
    methodEyebrow: "Come lavoriamo",
    methodIntro: "Ogni scelta parte dal contesto aziendale e arriva a un output verificabile. Niente scatole nere, niente dipendenze inutili.",
    deliverableTitle: "Decisioni documentate",
    deliverableBody: "Priorità, architettura, responsabilità e prossimi passi restano chiari anche dopo la consegna.",
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
    fitEyebrow: "Quando ha senso sentirci",
    targetTitleLead: "Problemi reali, non",
    targetTitleAccent: "brief perfetti.",
    target: [
      "Il lavoro dipende da fogli, email e passaggi manuali che non reggono più.",
      "I sistemi esistenti non comunicano, duplicano dati o creano errori.",
      "Avete un progetto digitale importante e cercate un interlocutore tecnico affidabile.",
    ],
    deliverablesTitleLead: "Cosa",
    deliverablesTitleAccent: "ricevete",
    deliverables: [
      "3–5 criticità prioritarie per impatto.",
      "Piano operativo a 30, 60 e 90 giorni.",
      "Indicazioni sugli strumenti solo se necessarie.",
    ],
    deliverablesNote: "Non è consulenza legale, HR disciplinare né una lista di software da comprare.",
    methodTitleLead: "Un metodo chiaro, dall’analisi alla",
    methodTitleAccent: "messa in produzione.",
    framework: [
      { number: "1", title: "Capire", desc: "Processi, persone, sistemi e vincoli: prima osserviamo il lavoro reale." },
      { number: "2", title: "Progettare", desc: "Definiamo priorità, architettura, rischi, tempi e criteri di successo." },
      { number: "3", title: "Costruire", desc: "Sviluppiamo per iterazioni controllate, con verifiche e visibilità costanti." },
      { number: "4", title: "Gestire", desc: "Messa in produzione, monitoraggio, manutenzione ed evoluzione." },
      { number: "5", title: "Monitoraggio", desc: "Verifica nel tempo e aggiustamenti." },
    ],
    methodNote:
      "Quando il check-up indica strumenti digitali, li progettiamo e realizziamo noi come software house. Prima il sistema, poi il codice.",
    finalEyebrow: "Il primo passo è semplice",
    finalTitleLead: "Raccontateci cosa deve funzionare",
    finalTitleAccent: "meglio.",
    finalBody: "In 20 minuti capiamo il contesto, vi diciamo se possiamo essere utili e quale sarebbe il passo successivo più sensato.",
    finalCta: "Prenota una prima call",
    mobileCta: "Prenota una call",
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
  iaAziendaPage: {
    headerCta: "Richiedi un preventivo",
    badge: "Formazione e adozione dell'IA in azienda",
    heroTitleLead: "L'Intelligenza Artificiale entra in azienda.",
    heroTitleAccent: "Facciamolo nel modo giusto.",
    heroSubtitle:
      "Sempre più aziende utilizzano strumenti come ChatGPT, Claude, Gemini, Microsoft Copilot o Cursor. Noi aiutiamo il tuo team a sfruttarli in modo efficace, definendo regole interne, formando le persone e costruendo processi realmente utili.",
    heroPoints: [
      "Formazione costruita sul lavoro reale della tua azienda",
      "Regole interne chiare sull'uso degli strumenti AI",
      "Attestati nominali e documentazione consegnata",
    ],
    heroCtaPrimary: "Richiedi un preventivo",
    heroCtaSecondary: "Prenota una call",
    reassurance: "Preventivo senza impegno · Risposta entro 24h",
    marquee: [
      "ChatGPT",
      "Claude",
      "Gemini",
      "Microsoft Copilot",
      "Cursor",
      "AI Literacy",
      "Policy aziendale sull'IA",
      "Attestati nominali",
      "Registro formazione",
    ],
    form: {
      title: "Richiedi un preventivo",
      subtitle: "3 passaggi, meno di un minuto.",
      stepLabel: "Passo",
      of: "di",
      step1Title: "Di cosa ha bisogno il tuo team?",
      step1Hint: "Puoi sceglierne più di una.",
      goals: [
        "Formare il team sull'uso dell'IA",
        "Definire regole e linee guida interne",
        "Mettersi in regola con l'AI Act (AI Literacy)",
        "Attestati e registro formazione",
        "Usare l'IA nei processi di lavoro",
        "Non lo so ancora: aiutatemi a capire",
      ],
      planLabel: "Percorso di interesse",
      planRemove: "Rimuovi il percorso scelto",
      step2Title: "Parlaci della tua azienda",
      sizeLabel: "Quante persone parteciperebbero?",
      sizes: ["1–10", "11–20", "21–50", "Oltre 50"],
      timingLabel: "Quando vorreste partire?",
      timings: ["Il prima possibile", "Entro 3 mesi", "Sto solo valutando"],
      step3Title: "A chi mandiamo il preventivo?",
      name: "Nome e cognome *",
      namePlaceholder: "Mario Rossi",
      email: "Email aziendale *",
      emailPlaceholder: "mario@azienda.it",
      phone: "Telefono",
      phonePlaceholder: "Ti richiamiamo noi",
      company: "Azienda",
      companyPlaceholder: "Nome azienda",
      notes: "Qualcosa da aggiungere?",
      notesPlaceholder: "Es. oggi i colleghi usano ChatGPT senza regole condivise…",
      next: "Continua",
      back: "Indietro",
      submit: "Richiedi un preventivo",
      sending: "Invio in corso…",
      privacyLead: "Usiamo i tuoi dati solo per risponderti.",
      privacyLink: "Informativa privacy",
      errorGoals: "Scegli almeno un'opzione.",
      errorRequired: "Inserisci nome ed email.",
      errorEmail: "Inserisci un indirizzo email valido.",
      errorGeneric: "Invio non riuscito. Riprova o chiamaci: ti rispondiamo subito.",
      successTitle: "Richiesta ricevuta.",
      successText:
        "Ti ricontattiamo entro 24 ore lavorative. Vuoi fare prima? Scegli tu quando sentirci: una call di 20 minuti, gratuita.",
      pickDay: "Scegli il giorno",
      pickTime: "Scegli l'orario",
      callPhone: "Telefono per la call *",
      callPhonePlaceholder: "+39 ...",
      confirmCall: "Conferma la call",
      confirmingCall: "Confermo…",
      errorCallPhone: "Inserisci un numero di telefono per la call.",
      errorCall: "Non siamo riusciti a fissare la call. Riprova o chiamaci.",
      skipCall: "Preferisco essere ricontattato",
      skippedText: "Perfetto: ti scriviamo o ti chiamiamo noi entro 24 ore lavorative.",
      callDoneTitle: "Call fissata.",
      callDoneLead: "Ci sentiamo",
      callDoneText: "Ti abbiamo mandato la conferma via email, con tutti i dettagli.",
      callTopicLead: "Landing formazione IA",
    },
    pathEyebrow: "Il metodo",
    pathTitleLead: "Non vendiamo un corso.",
    pathTitleAccent: "Vendiamo un percorso di adozione dell'Intelligenza Artificiale.",
    pathText:
      "La formazione è solo una parte del lavoro. Serve a poco se poi ognuno usa l'IA a modo suo, senza regole e senza sapere cosa può o non può fare con i dati dell'azienda. Per questo il percorso parte da come lavorate oggi e arriva a qualcosa che resta: regole, documenti e persone che sanno cosa fare.",
    pathListTitle: "Il percorso comprende",
    pathItems: [
      "Analisi dell'utilizzo attuale dell'IA",
      "Definizione delle linee guida interne",
      "Formazione del personale",
      "Documentazione aziendale",
      "Attestati",
      "Supporto successivo",
    ],
    gainEyebrow: "Il risultato",
    gainTitleLead: "Cosa",
    gainTitleAccent: "ottieni.",
    gain: [
      { title: "Formazione pratica", desc: "Corso costruito sul lavoro reale dell'azienda." },
      { title: "Linee guida interne", desc: "Regole condivise sull'utilizzo degli strumenti AI." },
      { title: "Documentazione", desc: "Materiale consegnato all'azienda e facilmente consultabile." },
      { title: "Attestati", desc: "Attestati nominali e registro formazione." },
      { title: "Casi reali", desc: "Prompt, esempi e workflow applicabili da subito." },
      { title: "Supporto", desc: "Possibilità di confrontarsi anche dopo il corso." },
    ],
    plansEyebrow: "Prezzi",
    plansTitleLead: "Percorsi",
    plansTitleAccent: "disponibili.",
    plansNote: "Prezzi IVA esclusa. Il preventivo viene confermato dopo una breve analisi del tuo contesto.",
    plansCta: "Richiedi un preventivo",
    plans: [
      {
        id: "base",
        name: "Base",
        price: "790 €",
        vat: "+ IVA",
        badge: "",
        features: ["Fino a 10 partecipanti", "2 ore", "Corso live", "Attestati", "Quiz finale"],
      },
      {
        id: "standard",
        name: "Standard",
        price: "1490 €",
        vat: "+ IVA",
        badge: "Più richiesto",
        features: [
          "Fino a 20 partecipanti",
          "4 ore",
          "Esempi personalizzati",
          "Policy aziendale base",
          "Registro formazione",
          "Attestati",
        ],
      },
      {
        id: "premium",
        name: "Premium",
        price: "2490 €",
        vat: "+ IVA",
        badge: "",
        features: [
          "Assessment iniziale",
          "Giornata completa",
          "Documentazione personalizzata",
          "Linee guida aziendali",
          "Supporto post formazione",
        ],
      },
    ],
    whyEyebrow: "Perché PYNK STUDIO",
    whyTitleLead: "L'IA la usiamo",
    whyTitleAccent: "ogni giorno.",
    why: [
      {
        title: "Sviluppiamo software basato sull'IA",
        desc: "Costruiamo prodotti che integrano modelli di intelligenza artificiale: sappiamo cosa funziona e cosa no.",
      },
      {
        title: "Usiamo l'AI coding ogni giorno",
        desc: "Strumenti come Cursor e Claude fanno parte del nostro lavoro quotidiano, non di una demo.",
      },
      {
        title: "Ne conosciamo limiti e potenzialità",
        desc: "Li vediamo da vicino nei nostri prodotti, e lo raccontiamo senza promesse gonfiate.",
      },
      {
        title: "Esperienza pratica, non teoria",
        desc: "La formazione nasce da ciò che facciamo sul campo, con esempi che il tuo team riconosce.",
      },
    ],
    modelsLabel: "Strumenti che usiamo e di cui parliamo nei corsi",
    models: ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "Cursor"],
    faqTitleLead: "Domande",
    faqTitleAccent: "frequenti",
    faq: [
      {
        q: "Il corso è online?",
        a: "Sì, si svolge in diretta online con un formatore, quindi i partecipanti possono fare domande e lavorare sugli esempi durante la sessione.",
      },
      {
        q: "Può essere svolto in presenza?",
        a: "Sì, possiamo svolgerlo anche in presenza, a Milano o nella vostra sede. Modalità e logistica le concordiamo nel preventivo.",
      },
      {
        q: "Quanto dura?",
        a: "Dipende dal percorso: 2 ore per il Base, 4 ore per lo Standard, una giornata completa per il Premium, che parte anche da un assessment iniziale.",
      },
      {
        q: "È personalizzabile?",
        a: "Sì. Lo Standard include esempi personalizzati sul vostro lavoro, il Premium documentazione e linee guida costruite sulla vostra azienda. Se serve qualcosa di diverso, lo valutiamo nel preventivo.",
      },
      {
        q: "Rilasciate attestati?",
        a: "Sì. Tutti i percorsi prevedono attestati nominali per i partecipanti; lo Standard include anche il registro della formazione.",
      },
      {
        q: "È adatto anche a chi non usa ancora l'IA?",
        a: "Sì. Si parte dalle basi: cosa sono questi strumenti, cosa fanno bene, dove sbagliano e cosa non condividere. Chi già li usa impara a farlo meglio e con regole comuni.",
      },
    ],
    finalTitleLead: "Porta l'Intelligenza Artificiale nella tua azienda",
    finalTitleAccent: "con un metodo concreto.",
    finalSubtitle:
      "Ogni azienda parte da una situazione diversa. Analizziamo il tuo contesto e costruiamo un percorso realmente utile per il tuo team.",
    finalCta: "Richiedi un preventivo",
    finalCall: "Chiama",
    finalWhatsapp: "WhatsApp",
    whatsappHref:
      "https://wa.me/393513768607?text=Buongiorno%2C%20vorrei%20un%20preventivo%20per%20la%20formazione%20sull%27intelligenza%20artificiale%20in%20azienda.",
    stickyCta: "Richiedi un preventivo",
  },
  contattiPage: {
    titleLine1: "Parliamo del vostro",
    titleAccent: "progetto.",
    subtitle:
      "Sviluppo software o consulenza operativa: compilate il form o scriveteci. Call di 20 minuti, senza impegno.",
    email: "info@pynkstudio.eu",
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
    email: "info@pynkstudio.eu",
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
    viewProject: "Scheda del progetto",
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

/** Copy della lingua predefinita, per le superfici fuori dal sito (pannello admin). */
export const pynkDefaultCopy: PynkCopy = translations.it;

export const setPynkLanguage = pynkstudioI18n.setLanguage;
export const usePynkCopy = pynkstudioI18n.useCopy;
export const usePynkLanguage = pynkstudioI18n.useLanguage;
