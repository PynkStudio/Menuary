import type { MenuaryFeatureKey, MenuaryLandingSlug } from "@/lib/menuary-landings";

/**
 * Testi delle landing verticali (solo italiano: le campagne sono italiane e una
 * variante tradotta non si pubblica finché non è tradotta davvero).
 *
 * Regola sui claim: ogni frase descrive una cosa che il prodotto fa oggi. Le
 * frasi che dipendono da una funzione non ancora pronta portano `requires` e
 * restano nascoste finché `MENUARY_FEATURE_READY[requires]` non è `true`.
 */

export type Gated<T> = T & { requires?: MenuaryFeatureKey };

export type LandingDemoKey =
  | "call"
  | "self-order"
  | "hub"
  | "whatsapp"
  | "menu-sync"
  | "reviews";

export type LandingContent = {
  slug: MenuaryLandingSlug;
  seo: { title: string; description: string; ogTitle: string };
  hero: {
    kicker: string;
    titleA: string;
    titleB: string;
    sub: string;
    primaryCta: string;
    secondaryCta: string;
    proof: string[];
  };
  problem: {
    opener: string;
    title: string;
    scene: string[];
    bullets: Gated<{ text: string }>[];
  };
  solution: {
    opener: string;
    title: string;
    body: string;
    points: Gated<{ title: string; body: string }>[];
  };
  steps: {
    title: string;
    items: Gated<{ title: string; body: string }>[];
  };
  demo: { key: LandingDemoKey; opener: string; title: string; sub: string };
  benefits: { title: string; items: Gated<{ title: string; body: string }>[] };
  related: MenuaryLandingSlug[];
  faq: Gated<{ q: string; a: string }>[];
  finalCta: { titleA: string; titleB: string; sub: string; cta: string };
};

const DEMO_CTA = "Guarda come funziona";

export const LANDING_CONTENT: Record<MenuaryLandingSlug, LandingContent> = {
  /* ------------------------------------------------------------------ */
  "telefonate-prenotazioni-ai": {
    slug: "telefonate-prenotazioni-ai",
    seo: {
      title: "Assistente IA per le telefonate del ristorante",
      description:
        "Il telefono squilla durante il servizio? L'assistente IA di Menuary risponde, verifica la disponibilità, registra prenotazioni e ordini d'asporto e passa la chiamata al personale quando serve.",
      ogTitle: "Il telefono squilla. Il personale continua a lavorare.",
    },
    hero: {
      kicker: "Telefonate e prenotazioni",
      titleA: "Il telefono squilla.",
      titleB: "Il personale continua a lavorare.",
      sub: "L'assistente IA di Menuary risponde alle chiamate del locale: controlla la disponibilità, registra la prenotazione, prende l'ordine d'asporto e risponde su orari, menu e allergeni. Con i dati veri del tuo ristorante.",
      primaryCta: "Scopri l'assistente IA per il tuo ristorante",
      secondaryCta: DEMO_CTA,
      proof: ["Risponde anche nel pieno del servizio", "Parla la lingua del cliente", "Passa la chiamata a voi quando serve"],
    },
    problem: {
      opener: "Venerdì, 20:45",
      title: "Nessuno può rispondere. E il cliente chiama il ristorante accanto.",
      scene: [
        "La sala è piena, la cucina sta uscendo con sei comande e il telefono suona per la terza volta in cinque minuti. Chi risponde lascia un tavolo a metà; chi non risponde perde una prenotazione.",
        "La maggior parte di quelle chiamate chiede sempre le stesse cose. Non servono a te: servono al cliente, e ha bisogno di una risposta subito.",
      ],
      bullets: [
        { text: "“Avete un tavolo per quattro domani alle 21?”" },
        { text: "“Fino a che ora siete aperti la domenica?”" },
        { text: "“La tagliata ha glutine? Mia figlia è celiaca.”" },
        { text: "“Posso ordinare due pizze da asporto per le 20?”" },
        { text: "“Dove posso parcheggiare?”" },
        { text: "“Devo spostare la prenotazione di stasera alle 21:30.”", requires: "reservationChangesByPhone" },
      ],
    },
    solution: {
      opener: "Cosa fa Menuary",
      title: "Un assistente che conosce il tuo locale, non un risponditore automatico.",
      body: "Non legge un messaggio registrato e non ti fa richiamare nessuno. Capisce cosa chiede il cliente e usa le stesse informazioni che gestisci in Menuary: sale, orari, menu, disponibilità dei piatti, regole di prenotazione.",
      points: [
        {
          title: "Prenotazioni vere, non appunti",
          body: "Verifica la disponibilità per data, ora e persone e registra la richiesta in Menuary con nome, telefono e note. La trovi nel pannello prenotazioni, pronta da confermare.",
        },
        {
          title: "Ordini d'asporto e delivery",
          body: "Prende l'ordine sul menu attivo, controlla che l'orario sia dentro l'apertura e manda al cliente il riepilogo su WhatsApp, con il link per pagare se lo accetti.",
        },
        {
          title: "Risposte sul menu e sugli allergeni",
          body: "Cerca nel tuo menu, conosce allergeni e piatti non disponibili e non inventa: se un'informazione non c'è, lo dice.",
        },
        {
          title: "Il personale solo quando serve",
          body: "Gruppi numerosi, eventi, richieste particolari: la chiamata viene passata al numero che scegli tu.",
        },
        {
          title: "Modifica le prenotazioni esistenti",
          body: "Sposta o annulla una prenotazione già registrata, riconoscendo il cliente dal numero.",
          requires: "reservationChangesByPhone",
        },
      ],
    },
    steps: {
      title: "Come funziona",
      items: [
        { title: "Il cliente chiama il tuo numero", body: "Deviamo le chiamate del locale sull'assistente, sempre o solo quando non rispondete." },
        { title: "L'assistente capisce la richiesta", body: "Prenotazione, ordine, orari, menu: risponde nella lingua in cui gli parlano." },
        { title: "Usa i dati di Menuary", body: "Disponibilità, menu e orari sono gli stessi del gestionale, aggiornati in tempo reale." },
        { title: "Tu trovi tutto nel pannello", body: "Prenotazioni e ordini arrivano in Menuary; il cliente riceve il riepilogo su WhatsApp." },
      ],
    },
    demo: {
      key: "call",
      opener: "Una chiamata, in più lingue",
      title: "La stessa richiesta. Qualunque lingua parli il cliente.",
      sub: "Turisti, clienti stranieri, lavoratori di passaggio: non serve avere in sala qualcuno che parli tedesco. La prenotazione che arriva nel pannello è la stessa.",
    },
    benefits: {
      title: "Cosa cambia nel servizio",
      items: [
        { title: "Meno interruzioni", body: "Chi è in sala resta in sala. Nessuno lascia un tavolo per rispondere." },
        { title: "Meno prenotazioni perse", body: "Il cliente che chiama alle 20:45 riceve una risposta, non uno squillo a vuoto." },
        { title: "Meno errori", body: "Niente foglietti o nomi scritti male: la prenotazione nasce già nel sistema." },
        { title: "Clienti stranieri serviti", body: "L'assistente risponde nella lingua del cliente, anche quando il personale non la parla." },
      ],
    },
    related: ["self-order-ai", "gestionale", "whatsapp"],
    faq: [
      {
        q: "Devo cambiare numero di telefono?",
        a: "No. Il tuo numero resta lo stesso: impostiamo una deviazione verso l'assistente, sempre oppure solo quando non rispondete entro qualche squillo.",
      },
      {
        q: "Le prenotazioni vengono confermate in automatico?",
        a: "L'assistente verifica la disponibilità e registra la richiesta in Menuary con tutti i dati. La conferma resta a te, dal pannello prenotazioni.",
      },
      {
        q: "Cosa succede se il cliente chiede qualcosa che l'assistente non sa?",
        a: "Non inventa. Se l'informazione non è tra quelle del locale lo dice e, se lo hai previsto, passa la chiamata al numero del personale.",
      },
      {
        q: "In che lingue risponde?",
        a: "Risponde nella lingua in cui il cliente parla. In fase di attivazione definiamo con te le lingue da coprire per il tuo locale.",
      },
      {
        q: "Può anche prendere ordini d'asporto?",
        a: "Sì, sul menu attivo in quel momento. Controlla orari e prodotti disponibili e invia al cliente il riepilogo su WhatsApp, con il link di pagamento se lo abiliti.",
      },
    ],
    finalCta: {
      titleA: "Non perdere una prenotazione",
      titleB: "perché nessuno può rispondere.",
      sub: "Ti facciamo sentire l'assistente al telefono con il menu e gli orari di un locale vero. Venti minuti, senza impegno.",
      cta: "Scopri l'assistente IA per il tuo ristorante",
    },
  },

  /* ------------------------------------------------------------------ */
  "self-order-ai": {
    slug: "self-order-ai",
    seo: {
      title: "Self ordering con IA per ristoranti",
      description:
        "Un menu digitale che consiglia, spiega gli abbinamenti e aiuta a comporre l'ordine, in qualsiasi lingua. Il self ordering di Menuary lavora come un buon cameriere, dal QR al kiosk.",
      ogTitle: "Self ordering, senza rinunciare al cameriere.",
    },
    hero: {
      kicker: "Self ordering con IA",
      titleA: "Il tuo menu dovrebbe",
      titleB: "anche saper vendere.",
      sub: "Con Menuary il cliente non scorre soltanto una lista: chiede, riceve un consiglio, scopre l'abbinamento giusto e ordina. Come farebbe con un buon cameriere, dal telefono, dal tablet o dal kiosk.",
      primaryCta: "Vedi il self ordering in funzione",
      secondaryCta: DEMO_CTA,
      proof: ["Usa solo il tuo menu", "Risponde nella lingua del cliente", "Consigli, non popup"],
    },
    problem: {
      opener: "Il limite del menu QR",
      title: "Un menu digitale mostra i piatti. Non li racconta.",
      scene: [
        "Il self ordering tradizionale fa risparmiare tempo al personale, ma toglie la parte che fa davvero la differenza: il cameriere che capisce cosa ti va, ti spiega il piatto e ti suggerisce il vino.",
        "Il cliente indeciso scorre, sceglie la cosa più sicura e chiude. Il vegetariano cerca le etichette una per una. Il turista traduce con il telefono.",
      ],
      bullets: [
        { text: "Nessuno spiega un piatto nuovo o poco conosciuto" },
        { text: "Abbinamenti e contorni restano sul menu, non nell'ordine" },
        { text: "Allergie e preferenze diventano una ricerca a mano" },
        { text: "I clienti stranieri ordinano quello che capiscono" },
      ],
    },
    solution: {
      opener: "Cosa fa Menuary",
      title: "Ogni cliente ha il suo cameriere personale. Anche dal telefono.",
      body: "Il cliente scrive come parlerebbe al tavolo. Menuary risponde usando soltanto quello che c'è nel tuo menu: ingredienti, allergeni, tag, prezzi e piatti disponibili in quel momento.",
      points: [
        {
          title: "Parla con il menu",
          body: "“Vorrei qualcosa di leggero”, “Questo è piccante?”, “Non mangio carne e vorrei spendere circa 30 euro”. Menuary propone piatti veri, con il motivo.",
        },
        {
          title: "Abbinamenti al momento giusto",
          body: "“Prendo la tagliata.” “Ottima scelta: se vuoi ti consiglio un contorno e un vino da abbinare.” Vendita assistita, non pubblicità.",
        },
        {
          title: "Decidi tu cosa spingere",
          body: "Scorte da smaltire, piatto del giorno, prodotto stagionale: lo dici a Menuary e, quando è coerente con quello che il cliente cerca, entra tra i suggerimenti.",
          requires: "salesPriorities",
        },
        {
          title: "Conversazione, menu e carrello insieme",
          body: "Il piatto consigliato si aggiunge con un tocco e l'ordine arriva al tuo sistema come ogni altro: cucina, cassa, comande.",
        },
      ],
    },
    steps: {
      title: "Dal tavolo alla cucina",
      items: [
        { title: "Il cliente apre il menu", body: "Dal QR sul tavolo, dal suo smartphone, dal tablet o dal kiosk." },
        { title: "Chiede quello che vuole", body: "Nella sua lingua, con parole sue. Menuary risponde con piatti del tuo menu." },
        { title: "Riceve consigli e abbinamenti", body: "Contorni, vini e dessert quando hanno senso, con le priorità che hai indicato." },
        { title: "Ordina, e l'ordine entra nel sistema", body: "Arriva alla cucina e alla cassa come ogni altro ordine del locale." },
      ],
    },
    demo: {
      key: "self-order",
      opener: "Due modi di ordinare",
      title: "Scegliere da una lista, o farsi consigliare.",
      sub: "Il self ordering tradizionale è menu → scegli → ordina. Con Menuary il cliente parla, scopre, riceve un consiglio e poi ordina.",
    },
    benefits: {
      title: "Cosa cambia al tavolo",
      items: [
        { title: "Più capacità di vendita", body: "Contorni, vini e dessert proposti quando servono, anche nei turni pieni." },
        { title: "Clienti più sicuri di quello che ordinano", body: "Allergie, preferenze e dubbi hanno una risposta prima di ordinare." },
        { title: "Il menu lavora con te", body: "Le priorità della serata arrivano ai clienti senza riscrivere il menu.", requires: "salesPriorities" },
        { title: "Ogni lingua, lo stesso servizio", body: "“I'm vegetarian and I don't like spicy food”: Menuary risponde in inglese, con il tuo menu." },
      ],
    },
    related: ["telefonate-prenotazioni-ai", "menu-delivery", "gestionale"],
    faq: [
      {
        q: "L'IA può inventare piatti o prezzi?",
        a: "No. Menuary risponde usando solo il menu del locale e i piatti disponibili in quel momento. Se un'informazione non c'è, non la dà per certa.",
      },
      {
        q: "Funziona anche sul kiosk?",
        a: "Sì: smartphone del cliente, QR al tavolo, tablet e kiosk usano lo stesso menu e lo stesso carrello.",
      },
      {
        q: "I suggerimenti sono invasivi?",
        a: "No. Menuary propone un abbinamento quando è pertinente all'ordine, dentro la conversazione. Niente finestre a comparsa o sconti forzati.",
      },
      {
        q: "Posso decidere cosa proporre stasera?",
        a: "Sì. Indichi a Menuary i piatti da spingere e li include nei consigli quando sono coerenti con le richieste del cliente.",
        requires: "salesPriorities",
      },
    ],
    finalCta: {
      titleA: "Self ordering,",
      titleB: "senza rinunciare al cameriere.",
      sub: "Ti mostriamo il menu che consiglia su un locale vero, in italiano e in inglese. Venti minuti, senza impegno.",
      cta: "Vedi il self ordering in funzione",
    },
  },

  /* ------------------------------------------------------------------ */
  gestionale: {
    slug: "gestionale",
    seo: {
      title: "Gestionale per ristoranti: cassa, ordini, prenotazioni e menu in un unico sistema",
      description:
        "Cassa, ordini, tavoli, prenotazioni, menu, QR, kiosk, sito e delivery nello stesso sistema. Con Menuary un'informazione si modifica una volta e si aggiorna ovunque serve.",
      ogTitle: "Un sistema. Tutto il ristorante.",
    },
    hero: {
      kicker: "Gestionale per ristoranti",
      titleA: "Un sistema.",
      titleB: "Tutto il ristorante.",
      sub: "Cassa, ordini, sala, prenotazioni, menu, QR, kiosk, sito e delivery lavorano sugli stessi dati. Cambi una cosa una volta, e la trovi aggiornata dove serve.",
      primaryCta: "Porta il tuo ristorante su Menuary",
      secondaryCta: DEMO_CTA,
      proof: ["Un solo accesso", "Una sola versione dei dati", "Configurato con te"],
    },
    problem: {
      opener: "Il ristorante a pezzi",
      title: "Cinque software che non si parlano, e tu in mezzo a copiare.",
      scene: [
        "La cassa ha il suo listino. Il sito ne ha un altro. Il menu QR l'ha fatto un'agenzia. Le prenotazioni stanno su un'app, gli ordini delivery su un tablet per piattaforma, le statistiche in un foglio Excel.",
        "Ogni sistema ha il suo account, il suo abbonamento e la sua versione della verità. E quando cambia un prezzo, qualcuno deve ricordarsi di cambiarlo dappertutto.",
      ],
      bullets: [
        { text: "Più account, più interfacce, più abbonamenti" },
        { text: "Informazioni duplicate e disallineate" },
        { text: "Aggiornamenti manuali, canale per canale" },
        { text: "Nessuno sa davvero cosa sta succedendo in tempo reale" },
      ],
    },
    solution: {
      opener: "Cosa fa Menuary",
      title: "Meno sistemi da coordinare. Meno errori. Meno lavoro operativo.",
      body: "Menuary mette al centro i dati del locale (menu, tavoli, disponibilità, clienti, ordini) e ci collega intorno tutti i punti di contatto. Non devi sincronizzare niente a mano: è un unico sistema.",
      points: [
        {
          title: "Un piatto finisce, sparisce ovunque",
          body: "Lo segni non disponibile una volta: sito, QR, kiosk, ordini online e assistente telefonico smettono di proporlo. Se colleghi il delivery, anche lì.",
        },
        {
          title: "Un prezzo cambia, cambia dappertutto",
          body: "Menu, cassa e canali di vendita leggono lo stesso listino. Niente più “sul sito c'è ancora il prezzo vecchio”.",
        },
        {
          title: "Tutti gli ordini in una coda",
          body: "Sala, QR, asporto, telefono, kiosk e delivery arrivano allo stesso pannello e alle stesse stampanti di cucina.",
        },
        {
          title: "Moduli che accendi quando servono",
          body: "Parti da quello che ti serve oggi e aggiungi il resto dopo, senza migrazioni né nuovi software.",
        },
      ],
    },
    steps: {
      title: "Come si passa a Menuary",
      items: [
        { title: "Analizziamo come lavori", body: "Canali, sale, turni, cassa: partiamo dal tuo servizio, non da un modulo standard." },
        { title: "Importiamo il menu", body: "Anche da una foto del menu cartaceo. Categorie, prezzi, allergeni e varianti." },
        { title: "Accendiamo i moduli", body: "Cassa, prenotazioni, QR, kiosk, sito, delivery: solo quelli che usi." },
        { title: "Lavori da un unico pannello", body: "Da computer, tablet o telefono, con ruoli diversi per il personale." },
      ],
    },
    demo: {
      key: "hub",
      opener: "Un servizio, visto da Menuary",
      title: "Ogni canale entra nello stesso sistema.",
      sub: "Il tavolo 7 ordina dal QR, un cliente prenota al telefono, arriva un ordine da Deliveroo, il kiosk stampa una comanda. Tu vedi tutto nello stesso posto.",
    },
    benefits: {
      title: "Cosa cambia ogni giorno",
      items: [
        { title: "Meno lavoro manuale", body: "Nessun listino da ricopiare, nessun canale da aggiornare a parte." },
        { title: "Meno errori", body: "Un'unica versione del menu, dei prezzi e delle disponibilità." },
        { title: "Più controllo", body: "Ordini, prenotazioni, incassi e statistiche nello stesso pannello." },
        { title: "Meno fornitori", body: "Un solo sistema e un solo interlocutore per tutto il locale." },
      ],
    },
    related: ["menu-delivery", "telefonate-prenotazioni-ai", "google-maps-recensioni"],
    faq: [
      {
        q: "Menuary sostituisce la mia cassa?",
        a: "Può farlo: il modulo cassa gestisce sessioni, movimenti, conti e separazione del conto. Se preferisci tenere la cassa attuale, valutiamo insieme come farla convivere.",
      },
      {
        q: "Devo attivare tutti i moduli?",
        a: "No. Parti da quelli che ti servono e aggiungi gli altri quando vuoi. I dati restano gli stessi.",
      },
      {
        q: "Funziona con più sedi?",
        a: "Sì. Menuary gestisce più sedi con menu, orari, tavoli e ordini separati, sotto lo stesso account.",
      },
      {
        q: "Chi mi aiuta a configurarlo?",
        a: "Noi. Importiamo il menu, configuriamo sale, stampanti e canali e restiamo il tuo riferimento dopo l'attivazione.",
      },
    ],
    finalCta: {
      titleA: "Un sistema.",
      titleB: "Tutto il ristorante.",
      sub: "Ti mostriamo Menuary su un servizio vero: dal menu alla comanda, dalla prenotazione alla cassa.",
      cta: "Porta il tuo ristorante su Menuary",
    },
  },

  /* ------------------------------------------------------------------ */
  whatsapp: {
    slug: "whatsapp",
    seo: {
      title: "Gestire il ristorante da WhatsApp",
      description:
        "Coperti, incassi, disponibilità dei piatti e prenotazioni: con Menuary chiedi e modifichi il tuo ristorante con un messaggio WhatsApp, anche quando non sei nel locale.",
      ogTitle: "Il tuo ristorante, dentro WhatsApp.",
    },
    hero: {
      kicker: "Il ristorante su WhatsApp",
      titleA: "Chiedi al tuo ristorante",
      titleB: "quanto ha incassato. Su WhatsApp.",
      sub: "Coperti di stasera, vendite di oggi, un piatto finito, una fascia da chiudere: scrivi a Menuary come scriveresti al tuo responsabile di sala. Risponde con i dati del locale e, prima di cambiare qualcosa di importante, ti chiede conferma.",
      primaryCta: "Scopri il ristorante che puoi gestire con un messaggio",
      secondaryCta: DEMO_CTA,
      proof: ["Nessuna app da imparare", "Solo numeri autorizzati", "Conferma prima delle modifiche"],
    },
    problem: {
      opener: "Quando non sei nel locale",
      title: "Vuoi solo una risposta. Invece devi aprire il gestionale.",
      scene: [
        "Sei dal fornitore, in auto, o semplicemente a casa. Vuoi sapere quanti coperti ci sono stasera. Apri il gestionale, fai login, cerchi il report giusto. Oppure chiami qualcuno che è in pieno servizio.",
        "Le cose che vuoi sapere sono semplici. Il modo per saperle, no.",
      ],
      bullets: [
        { text: "Login e menu diversi per ogni informazione" },
        { text: "Report pensati per il computer, non per il telefono" },
        { text: "Telefonate al personale nel momento sbagliato" },
        { text: "Piccole modifiche rimandate perché “le faccio dopo dal PC”" },
      ],
    },
    solution: {
      opener: "Cosa fa Menuary",
      title: "Non devi imparare a usare il gestionale. Puoi parlare con il tuo ristorante.",
      body: "Menuary riconosce il tuo numero, capisce cosa chiedi e distingue una domanda da una modifica. Le informazioni arrivano subito; le operazioni importanti aspettano il tuo “sì”.",
      points: [
        { title: "Domande", body: "“Quanti coperti abbiamo stasera?” “Che prenotazioni ci sono domani a pranzo?”" },
        { title: "Analisi", body: "“Quanto abbiamo incassato oggi?” “Qual è stato il piatto più venduto questa settimana?”" },
        { title: "Modifiche operative", body: "“Metti la carbonara non disponibile.” “Sospendi i nuovi ordini per stasera.”" },
        { title: "Operazioni sensibili, con conferma", body: "“Chiudi le prenotazioni dalle 20 alle 21.” Menuary riepiloga e aspetta la tua conferma." },
      ],
    },
    steps: {
      title: "Come funziona",
      items: [
        { title: "Registriamo il tuo numero", body: "Solo i numeri autorizzati possono parlare con il locale, con permessi diversi per titolare e personale." },
        { title: "Scrivi come parli", body: "Niente comandi da ricordare: una domanda o una richiesta in italiano." },
        { title: "Menuary legge o prepara la modifica", body: "Usa i dati di prenotazioni, ordini, menu e cassa." },
        { title: "Confermi, e il sistema si aggiorna", body: "Sito, QR, telefono e canali collegati ricevono la modifica." },
      ],
    },
    demo: {
      key: "whatsapp",
      opener: "Una sera qualsiasi",
      title: "Quattro messaggi, nessun login.",
      sub: "Informazioni, analisi, modifiche e operazioni che richiedono conferma, nella stessa conversazione.",
    },
    benefits: {
      title: "Cosa cambia",
      items: [
        { title: "Controllo anche da fuori", body: "Sai cosa succede nel locale senza chiamare nessuno." },
        { title: "Meno interruzioni al personale", body: "Le domande le fai a Menuary, non a chi è in sala." },
        { title: "Modifiche nel momento giusto", body: "Il piatto finito si toglie subito, non a fine serata." },
        { title: "Sicuro", body: "Numeri autorizzati, permessi per ruolo e conferma prima delle operazioni importanti." },
      ],
    },
    related: ["menu-delivery", "gestionale", "telefonate-prenotazioni-ai"],
    faq: [
      {
        q: "Chiunque può scrivere al mio ristorante e modificarlo?",
        a: "No. Menuary risponde solo ai numeri che autorizziamo, con permessi diversi per titolare e personale.",
      },
      {
        q: "Menuary modifica qualcosa senza chiedermelo?",
        a: "Le operazioni importanti vengono sempre riepilogate e aspettano la tua conferma. Le azioni distruttive, come cancellare il menu, non si fanno da WhatsApp.",
      },
      {
        q: "Serve un'app?",
        a: "No, basta WhatsApp sul tuo telefono.",
      },
    ],
    finalCta: {
      titleA: "Il tuo ristorante,",
      titleB: "dentro WhatsApp.",
      sub: "Ti facciamo provare la conversazione su un locale demo: domande, modifiche e conferme.",
      cta: "Scopri il ristorante che puoi gestire con un messaggio",
    },
  },

  /* ------------------------------------------------------------------ */
  "menu-delivery": {
    slug: "menu-delivery",
    seo: {
      title: "Menu sincronizzato su sito, QR e delivery (Deliveroo, Just Eat, Uber Eats, Glovo)",
      description:
        "Aggiorna il menu una volta: disponibilità e prezzi arrivano a sito, QR, kiosk, asporto e piattaforme delivery collegate. Una sola versione corretta del menu del tuo ristorante.",
      ogTitle: "Aggiorna il menu una volta. Menuary pensa al resto.",
    },
    hero: {
      kicker: "Menu e delivery sincronizzati",
      titleA: "Aggiorna il menu una volta.",
      titleB: "Menuary pensa al resto.",
      sub: "Un piatto finito, un prezzo nuovo, una descrizione da correggere: lo cambi in Menuary e arriva a sito, QR, kiosk, asporto e piattaforme delivery collegate. Non tre menu per vendere lo stesso piatto: uno.",
      primaryCta: "Centralizza il menu del tuo ristorante",
      secondaryCta: DEMO_CTA,
      proof: ["Deliveroo, Just Eat, Uber Eats, Glovo", "Disponibilità e prezzi allineati", "Ordini delivery nello stesso pannello"],
    },
    problem: {
      opener: "La tartare è finita",
      title: "E adesso ricordati dove toglierla.",
      scene: [
        "Il menu del locale vive in sei posti: il sito, il QR, il kiosk, l'asporto, Deliveroo, Just Eat. Ognuno con il suo pannello e la sua password.",
        "Finisce un piatto alle 21? Qualcuno deve disattivarlo ovunque, nel mezzo del servizio. Se se ne dimentica, arriva un ordine che non puoi evadere, e una recensione da una stella.",
      ],
      bullets: [
        { text: "Prodotti esauriti ancora acquistabili" },
        { text: "Prezzi diversi su canali diversi" },
        { text: "Descrizioni e allergeni non allineati" },
        { text: "Ore di lavoro per aggiornare menu che dovrebbero essere uno" },
      ],
    },
    solution: {
      opener: "Cosa fa Menuary",
      title: "Una modifica. Tutti i tuoi canali.",
      body: "Menuary è l'unica fonte del tuo menu. Categorie, prezzi, varianti, extra, allergeni e disponibilità si gestiscono in un posto; i canali leggono da lì. Il valore non è solo il tempo risparmiato: è avere una sola versione corretta del menu.",
      points: [
        {
          title: "Canali interni sempre allineati",
          body: "Sito, QR al tavolo, kiosk, ordini d'asporto e assistente telefonico usano lo stesso menu, in tempo reale.",
        },
        {
          title: "Le piattaforme delivery ricevono le modifiche",
          body: "Colleghiamo Deliveroo, Just Eat, Uber Eats e Glovo: menu, prezzi e disponibilità partono da Menuary a ogni salvataggio.",
        },
        {
          title: "Gli ordini delivery tornano a casa",
          body: "Gli ordini delle piattaforme arrivano nel pannello ordini e in cucina insieme agli altri, e lo stato dell'ordine torna alla piattaforma.",
        },
        {
          title: "Menu diversi dove serve",
          body: "Pranzo, cena, asporto: decidi quali liste e quali piatti vedere su ogni canale, sempre dallo stesso posto.",
        },
        {
          title: "Anche con un messaggio",
          body: "“La tartare è finita, toglila dal menu.” Menuary la disattiva e i canali collegati ricevono la modifica.",
          requires: "ownerWhatsappAssistant",
        },
      ],
    },
    steps: {
      title: "Come funziona",
      items: [
        { title: "Il menu vive in Menuary", body: "Lo importiamo noi, anche da una foto del menu cartaceo." },
        { title: "Colleghiamo i canali", body: "Sito, QR e kiosk sono già collegati; le piattaforme delivery le colleghiamo insieme a te." },
        { title: "Modifichi una volta", body: "Dal pannello, anche dal telefono, nel mezzo del servizio." },
        { title: "I canali si aggiornano", body: "Disponibilità e prezzi arrivano ovunque sia collegato." },
      ],
    },
    demo: {
      key: "menu-sync",
      opener: "Prova tu",
      title: "Un piatto finisce. Guarda dove sparisce.",
      sub: "Scegli una modifica e segui come si propaga ai canali collegati.",
    },
    benefits: {
      title: "Cosa cambia",
      items: [
        { title: "Niente ordini impossibili", body: "Quello che è finito non si può più ordinare, su nessun canale collegato." },
        { title: "Prezzi coerenti", body: "Lo stesso piatto non costa una cifra sul sito e un'altra sul QR." },
        { title: "Meno pannelli da aprire", body: "Un solo posto per il menu, invece di un tablet per piattaforma." },
        { title: "Meno recensioni negative evitabili", body: "Meno ordini annullati perché il piatto non c'era." },
      ],
    },
    related: ["gestionale", "whatsapp", "self-order-ai"],
    faq: [
      {
        q: "Quali piattaforme delivery collegate?",
        a: "Deliveroo, Just Eat, Uber Eats e Glovo. Il collegamento passa da HubRise, il connettore usato da molti gestionali per parlare con le piattaforme: lo configuriamo noi e ti diciamo prima cosa serve.",
      },
      {
        q: "Cosa si sincronizza esattamente?",
        a: "Categorie, piatti, varianti, extra, prezzi e disponibilità. Gli ordini delle piattaforme entrano in Menuary e lo stato dell'ordine torna alla piattaforma.",
      },
      {
        q: "Posso avere un menu diverso per il delivery?",
        a: "Sì. Scegli quali liste e quali piatti mostrare su ogni canale, restando sempre su un unico menu di partenza.",
      },
      {
        q: "Posso togliere un piatto con un messaggio WhatsApp?",
        a: "Sì: lo scrivi a Menuary dal tuo numero autorizzato e il piatto viene disattivato sui canali collegati.",
        requires: "ownerWhatsappAssistant",
      },
    ],
    finalCta: {
      titleA: "Non gestire tre menu",
      titleB: "per vendere lo stesso piatto.",
      sub: "Ti mostriamo una modifica di menu che arriva a sito, QR e delivery. Venti minuti, senza impegno.",
      cta: "Centralizza il menu del tuo ristorante",
    },
  },

  /* ------------------------------------------------------------------ */
  "google-maps-recensioni": {
    slug: "google-maps-recensioni",
    seo: {
      title: "Google Maps e recensioni del ristorante, gestiti da Menuary",
      description:
        "Orari e chiusure sincronizzati con Google, recensioni lette e risposte dal pannello, statistiche della scheda. Con Menuary la presenza su Google diventa parte del gestionale.",
      ogTitle: "La reputazione online del tuo ristorante non dovrebbe essere un altro lavoro.",
    },
    hero: {
      kicker: "Google Maps e recensioni",
      titleA: "La reputazione online",
      titleB: "non dovrebbe essere un altro lavoro.",
      sub: "Il cliente ti trova su Google prima ancora di entrare. Con Menuary orari, chiusure, descrizione e recensioni si gestiscono dallo stesso pannello con cui gestisci il locale.",
      primaryCta: "Gestisci la presenza online con Menuary",
      secondaryCta: DEMO_CTA,
      proof: ["Orari e chiusure sincronizzati", "Recensioni e risposte nel pannello", "Statistiche della scheda Google"],
    },
    problem: {
      opener: "Chiuso per ferie. Su Google, aperto.",
      title: "La scheda Google racconta un altro locale.",
      scene: [
        "Hai cambiato gli orari sul sito ma non su Google. Il cliente arriva il lunedì e trova la serranda abbassata. Tre recensioni aspettano una risposta da due settimane, perché rispondere vuol dire ricordarsi un'altra password.",
        "Google Maps è la vetrina più vista del tuo ristorante. Non dovrebbe essere il posto più trascurato.",
      ],
      bullets: [
        { text: "Orari e chiusure straordinarie da aggiornare due volte" },
        { text: "Recensioni lette tardi, o mai" },
        { text: "Risposte rimandate perché serve un altro accesso" },
        { text: "Nessuna idea di quante persone chiamano o chiedono indicazioni" },
      ],
    },
    solution: {
      opener: "Cosa fa Menuary",
      title: "Presenza e reputazione, dentro lo stesso sistema.",
      body: "Colleghiamo la scheda Google Business Profile del tuo locale a Menuary. Da lì le informazioni partono una volta sola, e le recensioni arrivano dove lavori già.",
      points: [
        {
          title: "Orari sempre giusti",
          body: "Orari settimanali e chiusure straordinarie (ferie, festivi, eventi) si impostano in Menuary e arrivano al sito e a Google.",
        },
        {
          title: "Recensioni nel pannello",
          body: "Le recensioni Google del locale si leggono in Menuary e si risponde da lì: la risposta viene pubblicata su Google.",
        },
        {
          title: "Menuary prepara la risposta",
          body: "Per ogni recensione Menuary propone una bozza nel tono del locale. Tu la leggi, la modifichi se vuoi e la pubblichi.",
          requires: "reviewReplyDrafts",
        },
        {
          title: "Cosa succede sulla scheda",
          body: "Visualizzazioni, chiamate, richieste di indicazioni e clic verso il sito, nello stesso pannello del locale.",
        },
        {
          title: "Le recensioni migliori sul sito",
          body: "Le recensioni Google possono comparire sul sito del ristorante, aggiornate in automatico.",
        },
      ],
    },
    steps: {
      title: "Dalla recensione alla risposta",
      items: [
        { title: "Arriva una nuova recensione", body: "Menuary la raccoglie dalla scheda Google del locale." },
        { title: "La leggi nel pannello", body: "Insieme alle altre, con il voto e il testo del cliente." },
        { title: "Menuary propone una risposta", body: "Una bozza pertinente, che puoi modificare.", requires: "reviewReplyDrafts" },
        { title: "Rispondi", body: "La risposta viene pubblicata su Google, senza aprire un altro pannello." },
      ],
    },
    demo: {
      key: "reviews",
      opener: "Dalla scheda al pannello",
      title: "Quello che il cliente vede su Google, gestito da dove lavori.",
      sub: "Una chiusura straordinaria e una nuova recensione: due lavori che oggi richiedono due pannelli, e con Menuary uno.",
    },
    benefits: {
      title: "Cosa cambia",
      items: [
        { title: "Informazioni coerenti", body: "Sito e Google dicono la stessa cosa, sempre." },
        { title: "Recensioni che ricevono risposta", body: "Rispondere è un gesto, non una procedura." },
        { title: "Meno clienti davanti alla porta chiusa", body: "Le chiusure straordinarie arrivano anche su Google." },
        { title: "Più controllo", body: "Sai quante persone ti trovano, ti chiamano e ti cercano sulla mappa." },
      ],
    },
    related: ["gestionale", "telefonate-prenotazioni-ai", "menu-delivery"],
    faq: [
      {
        q: "Serve avere già una scheda Google?",
        a: "Sì, una scheda Google Business Profile del locale. La colleghi a Menuary con il tuo account Google in pochi passaggi, e ti aiutiamo noi.",
      },
      {
        q: "Menuary risponde da solo alle recensioni?",
        a: "No. Le risposte le pubblichi tu dal pannello: nessuna risposta parte senza di te.",
      },
      {
        q: "Menuary scrive le risposte per me?",
        a: "Menuary prepara una bozza per ogni recensione; tu la approvi o la modifichi prima di pubblicarla.",
        requires: "reviewReplyDrafts",
      },
      {
        q: "Posso gestire più sedi?",
        a: "Sì, ogni sede si collega alla sua scheda Google.",
      },
    ],
    finalCta: {
      titleA: "La tua scheda Google,",
      titleB: "gestita da dove lavori già.",
      sub: "Ti mostriamo orari, chiusure e recensioni gestiti dal pannello Menuary. Venti minuti, senza impegno.",
      cta: "Gestisci la presenza online con Menuary",
    },
  },
};

/** La stessa intelligenza, voci diverse: usato nella sezione ecosistema comune. */
export const ECOSYSTEM_VOICES: Gated<{ who: string; says: string; result: string }>[] = [
  { who: "Cliente al telefono", says: "“Vorrei prenotare per quattro, domani alle 21.”", result: "Menuary verifica la disponibilità e registra la prenotazione." },
  { who: "Cliente su WhatsApp", says: "“Due margherite da asporto per le 20.”", result: "Menuary prende l'ordine sul menu attivo e lo manda in cucina." },
  {
    who: "Cliente al tavolo",
    says: "“Cosa mi consigli con questo vino?”",
    result: "Menuary conosce il menu e propone l'abbinamento.",
    requires: "conversationalMenu",
  },
  {
    who: "Titolare",
    says: "“Stasera spingi il risotto.”",
    result: "Menuary lo usa nei consigli quando è pertinente.",
    requires: "salesPriorities",
  },
  { who: "Titolare, dal pannello", says: "La tartare è finita.", result: "Sparisce da sito, QR, kiosk, telefono e delivery collegati." },
  {
    who: "Titolare su WhatsApp",
    says: "“Quanto abbiamo incassato?”",
    result: "Menuary interroga i dati operativi del locale.",
    requires: "ownerWhatsappAssistant",
  },
];
