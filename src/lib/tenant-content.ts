import { PLATFORM_OPERATOR } from "@/lib/legal/platform-operator";

export type TenantSoul = {
  id: string;
  kicker: string;
  title: string;
  desc: string;
  href: string;
  image: string;
};

export type TenantDish = {
  name: string;
  desc: string;
  price: string;
  image: string;
  variant: "red" | "mustard" | "green" | "pink";
  href: string;
};

export type TenantContent = {
  logoSrc: string;
  logoAlt: string;
  showcaseLogoSrc: string;
  showcaseLogoAlt: string;
  description: string;
  url: string;
  social: {
    instagram: string;
    facebook: string;
    instagramLabel: string;
    facebookLabel: string;
  };
  contact: {
    phone: string;
    email?: string;
    whatsappDigits: string;
    whatsappMessage: string;
  };
  address: {
    street: string;
    zip: string;
    city: string;
    province: string;
    full: string;
  };
  /**
   * Identità del titolare del trattamento per le pagine legali (privacy/cookie),
   * quando diversa dal nome/indirizzo commerciale del tenant (es. ditta individuale
   * dietro un nome commerciale). Se assente, le pagine legali derivano titolare e
   * indirizzo da name/address/contact del tenant.
   */
  legal?: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    piva?: string;
    pec?: string;
  };
  maps: {
    searchUrl: string;
    embedUrl: string;
  };
  hero: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    body: string;
    backdrop: string;
    ctaLabel: string;
  };
  soulsIntro: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    body: string;
  };
  souls: TenantSoul[];
  dishesIntro: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  dishes: TenantDish[];
  findUs: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    body: string;
    mapTitle: string;
  };
  footer: {
    tagline: string;
    body: string;
  };
  delivery: {
    title: string;
    body: string;
    partners: Array<{ name: string; url: string; active: boolean }>;
  };
};

const beporkContent: TenantContent = {
  logoSrc: "/logo.png",
  logoAlt: "ThePork",
  showcaseLogoSrc: "/logo-payoff.png",
  showcaseLogoAlt: "ThePork - demo restaurant",
  description:
    "ThePork - ristorante demo, pizzeria e burger house. Burger smashati, pizze firmate e cucina italiana pensata come modello Menuary.",
  url: "https://demo.menuary.it/bepork-demo",
  social: {
    instagram: "https://www.instagram.com/thepork.demo/",
    facebook: "https://www.facebook.com/theporkdemo/",
    instagramLabel: "Instagram ThePork",
    facebookLabel: "Facebook ThePork",
  },
  contact: {
    phone: "+39 000 000 0000",
    whatsappDigits: "390000000000",
    whatsappMessage:
      "Ciao ThePork! Vorrei prenotare un tavolo. Siamo in ___ persone, per il giorno ___ alle ___. Grazie!",
  },
  address: {
    street: "Via Demo, 1",
    zip: "00000",
    city: "Citta Demo",
    province: "DM",
    full: "Via Demo, 1 - 00000 Citta Demo (DM)",
  },
  maps: {
    searchUrl:
      "https://www.google.com/maps/search/?api=1&query=ThePork+restaurant+demo",
    embedUrl:
      "https://www.google.com/maps?q=restaurant+demo&output=embed",
  },
  hero: {
    eyebrow: "Ristorante - Pizzeria - Burger House",
    titleLead: "Il maiale",
    titleAccent: "e una filosofia.",
    body:
      "Qui si chiama ThePork. Burger smashati, pizze firmate e cucina italiana con carattere, pronta da mostrare come modello.",
    backdrop: "/photos/burger-esagerato.png",
    ctaLabel: "Prenota su WhatsApp",
  },
  soulsIntro: {
    eyebrow: "Tre anime, una casa",
    titleLead: "Tutte le facce della fame,",
    titleAccent: "in un posto solo.",
    body:
      "ThePork non e un burger bar. E un ristorante demo con tre anime forti che convivono nello stesso tavolo.",
  },
  souls: [
    {
      id: "burger",
      kicker: "American Taste",
      title: "Burger House",
      desc: "Tredici panini firmati, smash, pulled, scottona. Due mani, nessuna scusa.",
      href: "/menu#burger",
      image: "/photos/burger-esagerato.png",
    },
    {
      id: "pizza",
      kicker: "Italian Style",
      title: "Pizza House",
      desc: "Classiche come devono essere. Speciali ThePork come non te le aspetti.",
      href: "/menu#pizze-speciali",
      image: "/photos/pizza-multigusto.png",
    },
    {
      id: "cucina",
      kicker: "Tradizione italiana",
      title: "Cucina di casa",
      desc: "Primi della tradizione, tagliata Angus, piatti generosi e servizio diretto. Si mangia sul serio.",
      href: "/menu#secondi",
      image: "/photos/orecchiette-brasciole.png",
    },
  ],
  dishesIntro: {
    eyebrow: "Scelti dalla casa",
    title: "I piatti che ci chiedono tutti.",
    subtitle: "Sei motivi per tornare. Piu dodici che non hai ancora provato.",
  },
  dishes: [
    {
      name: "Esagerato Pork",
      desc: "Scottona, pulled, bacon, stracciatella. Il panino che si ricorda.",
      price: "€ 15,00",
      image: "/photos/burger-esagerato.png",
      variant: "red",
      href: "/menu#burger",
    },
    {
      name: "Pizza all'Assassina",
      desc: "Spaghetti croccanti, pomodoro, stracciatella. Una firma italiana in una fetta.",
      price: "€ 10,00",
      image: "/photos/pizza-multigusto.png",
      variant: "mustard",
      href: "/menu#pizze-speciali",
    },
    {
      name: "Tagliata Pork",
      desc: "300 gr di Angus, datterino, rucola, grana. Secca e giusta.",
      price: "€ 18,00",
      image: "/photos/tagliata-pork.png",
      variant: "green",
      href: "/menu#secondi",
    },
    {
      name: "Assassina Pork",
      desc: "Burger di scottona + spaghetti all'assassina + stracciatella.",
      price: "€ 13,00",
      image: "/photos/burger-assassina.png",
      variant: "pink",
      href: "/menu#burger",
    },
    {
      name: "Mega Stick",
      desc: "La grigliata che chiude la serata: tagliata, costata, bombette, zampina.",
      price: "€ 50,00",
      image: "/photos/stinco-pork.png",
      variant: "red",
      href: "/menu#secondi",
    },
    {
      name: "Orecchiette con le brasciole",
      desc: "Il ragu della domenica, ogni sera.",
      price: "Primi",
      image: "/photos/orecchiette-padella.png",
      variant: "mustard",
      href: "/menu#primi",
    },
  ],
  findUs: {
    eyebrow: "Come trovarci",
    titleLead: "Nel cuore della citta,",
    titleAccent: "dove si mangia davvero.",
    body:
      "Un indirizzo demo pensato per mostrare prenotazioni, mappa, orari e contatti senza esporre riferimenti reali.",
    mapTitle: "Mappa ThePork",
  },
  footer: {
    tagline: "Il maiale e una filosofia.",
    body:
      "Ristorante, pizzeria e burger house demo. Burger smashati, pizze firmate e cucina italiana pensata come modello Menuary.",
  },
  delivery: {
    title: "Fame ora, tavolo pieno?",
    body: "Presto ordini ThePork anche a domicilio.",
    partners: [
      { name: "Glovo", url: "#", active: false },
      { name: "Deliveroo", url: "#", active: false },
      { name: "Just Eat", url: "#", active: false },
      { name: "Uber Eats", url: "#", active: false },
    ],
  },
};

const faakContent: TenantContent = {
  logoSrc: "/faak/logo.svg",
  logoAlt: "FAAK",
  showcaseLogoSrc: "/faak/hero-claim.png",
  showcaseLogoAlt: "FAAK - cibo e vino a ribellione naturale",
  description:
    "FAAK porta a Milano cibo e vino a ribellione naturale: colazioni, pranzo, aperitivo e tavoli occupati con un'identita forte e riconoscibile.",
  url: "https://www.faakfaak.it",
  social: {
    instagram: "https://www.instagram.com/faakfuoco/",
    facebook: "https://www.facebook.com/people/Faakfuoco/61557919406709/",
    instagramLabel: "Instagram FAAK",
    facebookLabel: "Facebook FAAK",
  },
  contact: {
    phone: "02 38323510",
    whatsappDigits: "390238323510",
    whatsappMessage:
      "Ciao FAAK! Vorrei occupare un tavolo. Siamo in ___ persone, per il giorno ___ alle ___. Grazie!",
  },
  address: {
    street: "Via Arnaldo da Brescia, 5",
    zip: "20159",
    city: "Milano",
    province: "MI",
    full: "Via Arnaldo da Brescia, 5 - 20159 Milano (MI)",
  },
  maps: {
    searchUrl:
      "https://www.google.com/maps/search/?api=1&query=FAAK+Via+Arnaldo+da+Brescia+5+Milano",
    embedUrl:
      "https://www.google.com/maps?q=FAAK+Via+Arnaldo+da+Brescia+5+Milano&output=embed",
  },
  hero: {
    eyebrow: "Cibo e vino a ribellione naturale - Milano",
    titleLead: "Fermamente diversi.",
    titleAccent: "Attivamente ribelli.",
    body:
      "FAAK non si limita a cambiare insegna: cambia voce, materia e ritmo. Colazione, pranzo, aperitivo e sera entrano in una piattaforma che assorbe l'anima del locale.",
    backdrop: "/faak/fire-bread.png",
    ctaLabel: "Occupa un tavolo",
  },
  soulsIntro: {
    eyebrow: "Un tenant, molte ore del giorno",
    titleLead: "La stessa piattaforma,",
    titleAccent: "un carattere completamente diverso.",
    body:
      "Per FAAK la navigazione diventa manifesto: mattina, giorno e aperitivo sostituiscono il lessico ThePork e mostrano come il sistema regga un'identita nuova.",
  },
  souls: [
    {
      id: "mattina",
      kicker: "FAAK la mattina",
      title: "Colazione irrequieta",
      desc: "Caffe, forno, grafica diretta e tono netto. Una prima fascia oraria con voce propria.",
      href: "/menu#faak-mattina",
      image: "/faak/mattina.png",
    },
    {
      id: "giorno",
      kicker: "FAAK il giorno",
      title: "Pranzo con fuoco",
      desc: "Padella, brace, verdure e piatti che parlano come il locale: chiari, energici, non neutri.",
      href: "/menu#faak-giorno",
      image: "/faak/giorno.png",
    },
    {
      id: "aperitivo",
      kicker: "FAAK da bere",
      title: "Aperitivo manifesto",
      desc: "Vino, cocktail e socialita entrano nella stessa esperienza senza perdere riconoscibilita.",
      href: "/menu#faak-aperitivo",
      image: "/faak/aperitivo.png",
    },
  ],
  dishesIntro: {
    eyebrow: "Dimostrazione di flessibilita",
    title: "Non cambiamo pelle. Cambiamo locale.",
    subtitle:
      "La griglia contenuti resta quella della piattaforma; testi, immagini e tensione visiva diventano FAAK.",
  },
  dishes: [
    {
      name: "Claim di brand",
      desc: "Cibo e vino a ribellione naturale trasformati in apertura memorabile.",
      price: "hero",
      image: "/faak/hero-claim.png",
      variant: "mustard",
      href: "/menu#faak-mattina",
    },
    {
      name: "Viviana Varese",
      desc: "La presenza della chef diventa un elemento narrativo, non un dettaglio secondario.",
      price: "story",
      image: "/faak/chef.png",
      variant: "red",
      href: "/menu#faak-giorno",
    },
    {
      name: "Fuoco e pane",
      desc: "La piattaforma puo ospitare immagini manifesto senza perdere leggibilita o struttura.",
      price: "visual",
      image: "/faak/fire-bread.png",
      variant: "pink",
      href: "/menu#faak-sera",
    },
  ],
  findUs: {
    eyebrow: "Vieni da noi",
    titleLead: "Milano, Isola.",
    titleAccent: "Una presenza che si sente.",
    body:
      "Via Arnaldo da Brescia, 5. Anche recapiti, CTA e mappa seguono il tenant, non un template generico.",
    mapTitle: "Mappa FAAK",
  },
  footer: {
    tagline: "Cibo e vino a ribellione naturale.",
    body:
      "FAAK mostra il punto: Menuary non ospita soltanto contenuti diversi, ma puo incarnare voce, atmosfera e priorita di ogni locale.",
  },
  delivery: {
    title: "FAAK a casa tua",
    body: "La demo conserva spazio per delivery, bottega e servizi esterni del locale.",
    partners: [
      { name: "Glovo", url: "https://glovoapp.com", active: true },
      { name: "Cosa porto", url: "https://cosaporto.it", active: true },
    ],
  },
};

const libritechContent: TenantContent = {
  logoSrc: "/libritech/logo.svg",
  logoAlt: "LibriTech",
  showcaseLogoSrc: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
  showcaseLogoAlt: "LibriTech — Tech & Startup Books",
  description:
    "LibriTech: libreria specializzata in tecnologia, startup e innovazione digitale. 30 titoli tra satira, strategia e tecnica per chi fa impresa.",
  url: "https://libritech.it",
  social: {
    instagram: "https://www.instagram.com/libritech/",
    facebook: "https://www.facebook.com/libritech",
    instagramLabel: "Instagram LibriTech",
    facebookLabel: "Facebook LibriTech",
  },
  contact: {
    phone: "+39 02 1234 5678",
    whatsappDigits: "390212345678",
    whatsappMessage: "Ciao LibriTech! Vorrei informazioni su un libro. Grazie!",
  },
  address: {
    street: "Via della Startup, 42",
    zip: "20124",
    city: "Milano",
    province: "MI",
    full: "Via della Startup, 42 - 20124 Milano (MI)",
  },
  maps: {
    searchUrl: "https://www.google.com/maps/search/?api=1&query=Via+della+Startup+42+Milano",
    embedUrl: "https://www.google.com/maps?q=Via+della+Startup+42+Milano&output=embed",
  },
  hero: {
    eyebrow: "Libreria tech & startup · Milano",
    titleLead: "Libri per chi",
    titleAccent: "non sceglie il facile.",
    body: "30 titoli tra satira, strategia e tecnica per founder, investitori e chiunque lavori con un foglio Excel aperto e troppe aspettative.",
    backdrop: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=80",
    ctaLabel: "Vai al catalogo",
  },
  soulsIntro: {
    eyebrow: "Tre sezioni, una libreria",
    titleLead: "Startup, Tecnologia",
    titleAccent: "e Finanza.",
    body: "Tre aree tematiche per coprire tutto quello che serve sapere — e qualcosa che è meglio scoprire prima degli altri.",
  },
  souls: [
    {
      id: "startup",
      kicker: "Sezione Startup",
      title: "Dai pitch alle exit",
      desc: "Tutto il ciclo di vita di una startup raccontato senza filtri: fundraising, team, crescita e quei momenti in cui il runway finisce prima del previsto.",
      href: "#catalogo",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "tech",
      kicker: "Sezione Tech",
      title: "IA, dati e algoritmi",
      desc: "Intelligenza artificiale, machine learning e automazione spiegati a chi vuole capire davvero — senza il vocabolario da convegno.",
      href: "#catalogo",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "finanza",
      kicker: "Sezione Finanza",
      title: "Soldi, metriche e KPI",
      desc: "Cashflow, valutazioni, debito e tutto quello che sta in mezzo: libri che trasformano i numeri da nemici in alleati (o almeno in conoscenti tollerabili).",
      href: "#catalogo",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
    },
  ],
  dishesIntro: {
    eyebrow: "I più venduti",
    title: "I libri che non possiamo smettere di consigliare.",
    subtitle: "Dalla satira all'utilità pratica: i titoli che i lettori salvano di più nella wishlist.",
  },
  dishes: [
    {
      name: "Prompt Engineering per C-Level Ansiosi",
      desc: "Come parlare con l'IA senza aspettarsi miracoli o licenziamenti di massa.",
      price: "€29.90",
      image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80",
      variant: "red",
      href: "#catalogo",
    },
    {
      name: "Il Piccolo Manuale del Mega Round",
      desc: "Term sheet, governance e euforia pre-scaling con il tono giusto.",
      price: "€32.90",
      image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80",
      variant: "mustard",
      href: "#catalogo",
    },
    {
      name: "Cap Table al Tramonto",
      desc: "Tutto su quote, dilution e soci entusiasti prima del post-money.",
      price: "€26.90",
      image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80",
      variant: "green",
      href: "#catalogo",
    },
  ],
  findUs: {
    eyebrow: "Dove siamo",
    titleLead: "Milano,",
    titleAccent: "Via della Startup.",
    body: "Vieni a sfogliare il catalogo di persona. Oppure acquista online e scegli tra spedizione e ritiro in sede.",
    mapTitle: "Mappa LibriTech",
  },
  footer: {
    tagline: "Libri per chi non sceglie il facile.",
    body: "LibriTech — libreria specializzata in tecnologia, startup e innovazione digitale. Demo tenant su piattaforma Bizery.",
  },
  delivery: {
    title: "Spedizione in tutta Italia",
    body: "Ordini online con consegna in 2-3 giorni lavorativi. Ritiro gratuito in sede a Milano.",
    partners: [],
  },
};

const valentinaOrciuoliContent: TenantContent = {
  logoSrc: "/favicon.svg",
  logoAlt: "Valentina Orciuoli",
  showcaseLogoSrc: "/valentina-orciuoli/anxiety-mockup-standup.png",
  showcaseLogoAlt: "Anxiety di Valentina Orciuoli",
  description:
    "Valentina Orciuoli scrive fantasy orientale: emozioni antiche, draghi cinesi e mondi in cui la luce combatte dentro l'ombra.",
  url: "https://demo.weuseorpheo.com/valentina-orciuoli/link",
  social: {
    instagram: "https://www.instagram.com/di.vale_in.peggio/",
    facebook: "https://www.facebook.com/",
    instagramLabel: "Instagram Valentina Orciuoli",
    facebookLabel: "Facebook Valentina Orciuoli",
  },
  contact: {
    phone: "",
    email: "valentina.orciuoli@weuseorpheo.com",
    whatsappDigits: "",
    whatsappMessage: "Ciao Valentina! Vorrei informazioni sui tuoi libri.",
  },
  address: {
    street: "",
    zip: "",
    city: "",
    province: "",
    full: "Italia",
  },
  maps: {
    searchUrl: "https://www.google.com/maps/search/?api=1&query=Italia",
    embedUrl: "https://www.google.com/maps?q=Italia&output=embed",
  },
  hero: {
    eyebrow: "Author site fantasy · Orpheo",
    titleLead: "Valentina",
    titleAccent: "Orciuoli.",
    body:
      "Fantasy orientale, emozioni antiche e draghi che respirano luce. Il primo capitolo della saga e Anxiety.",
    backdrop: "/valentina-orciuoli/anxiety-mockup-standup.png",
    ctaLabel: "Scopri Anxiety",
  },
  soulsIntro: {
    eyebrow: "The Emotion Dragons Trilogy",
    titleLead: "Ogni emozione",
    titleAccent: "ha il suo drago.",
    body:
      "Una saga fantasy dove il mondo interiore dei personaggi prende forma in creature imperiali, cieli notturni e prove di coraggio.",
  },
  souls: [],
  dishesIntro: {
    eyebrow: "Libri",
    title: "The Emotion Dragons Trilogy.",
    subtitle: "Il percorso comincia con Anxiety, primo volume della trilogia.",
  },
  dishes: [],
  findUs: {
    eyebrow: "Link",
    titleLead: "Segui",
    titleAccent: "Valentina Orciuoli.",
    body: "Tutti i link ufficiali dell'autrice sono raccolti nella pagina link del sito.",
    mapTitle: "Link Valentina Orciuoli",
  },
  footer: {
    tagline: "Fantasy orientale, draghi ed emozioni.",
    body:
      "Author site per Valentina Orciuoli: libri, social, eventi e contenuti editoriali in un'unica esperienza.",
  },
  delivery: {
    title: "Acquista Anxiety",
    body: "Disponibile su Amazon Kindle.",
    partners: [
      {
        name: "Amazon · Anxiety",
        url: "https://www.amazon.it/Anxiety-Valentina-Orciuoli-ebook/dp/B0F1KVZKFC",
        active: true,
      },
      {
        name: "Amazon · Fury",
        url: "https://www.amazon.it/Fury-Emotion-Dragons-Trilogy-Vol-ebook/dp/B0GKWCS774",
        active: true,
      },
    ],
  },
};

const officinakamContent: TenantContent = {
  logoSrc: "/officinakam/logo.svg",
  logoAlt: "Officina KAM",
  showcaseLogoSrc: "/officinakam/hero-moto.jpg",
  showcaseLogoAlt: "Officina KAM - Precisione meccanica",
  description:
    "Officina KAM — manutenzione professionale per auto e moto. Diagnostica avanzata, preventivi chiari, interventi su appuntamento.",
  url: "https://officinakam.it",
  social: {
    instagram: "https://www.instagram.com/officinakam/",
    facebook: "https://www.facebook.com/officinakam/",
    instagramLabel: "Instagram Officina KAM",
    facebookLabel: "Facebook Officina KAM",
  },
  contact: {
    phone: "+39 333 456 7890",
    email: "info@officinakam.it",
    whatsappDigits: "393334567890",
    whatsappMessage:
      "Ciao Officina KAM! Vorrei prenotare un appuntamento per il mio veicolo. Grazie!",
  },
  address: {
    street: "Via Bonfadini, 71",
    zip: "20138",
    city: "Milano",
    province: "MI",
    full: "Via Bonfadini, 71 - 20138 Milano (MI)",
  },
  maps: {
    searchUrl:
      "https://www.google.com/maps/search/?api=1&query=Via+Bonfadini+71+Milano",
    embedUrl:
      "https://www.google.com/maps?q=Via+Bonfadini+71+Milano&output=embed",
  },
  hero: {
    eyebrow: "Officina auto e moto · Milano",
    titleLead: "Precisione meccanica.",
    titleAccent: "Diagnostica avanzata.",
    body:
      "Manutenzione professionale per auto e moto. Strumenti diagnostici di ultima generazione, preventivi chiari e interventi su appuntamento.",
    backdrop: "/officinakam/hero-moto.jpg",
    ctaLabel: "Prenota un appuntamento",
  },
  soulsIntro: {
    eyebrow: "Tre specializzazioni, un'unica officina",
    titleLead: "Auto, Moto e Diagnostica",
    titleAccent: "in un unico posto.",
    body:
      "Copriamo l'intera gamma dei veicoli con attrezzature professionali e personale specializzato per ogni tipo di intervento.",
  },
  // Riutilizziamo "souls" come categorie di servizio
  souls: [
    {
      id: "auto",
      kicker: "Manutenzione ordinaria",
      title: "Auto",
      desc: "Pneumatici, pastiglie freno, dischi, tagliandi, sospensioni. Tutto per tenere la tua auto in perfetta efficienza.",
      href: "#servizi",
      image: "/officinakam/hero-moto.jpg",
    },
    {
      id: "moto",
      kicker: "Manutenzione completa",
      title: "Moto",
      desc: "Tagliandi, impianto frenante, trasmissione, sospensioni, pneumatici. Esperienza specifica per ogni modello.",
      href: "#servizi",
      image: "/officinakam/hero-moto.jpg",
    },
    {
      id: "diagnostica",
      kicker: "Tecnologia avanzata",
      title: "Diagnostica",
      desc: "Scanner OBD multimarca, check completo dell'elettronica, lettura e azzeramento anomalie. Diagnosi certa in pochi minuti.",
      href: "#servizi",
      image: "/officinakam/hero-moto.jpg",
    },
  ],
  dishesIntro: {
    eyebrow: "Servizi in evidenza",
    title: "Quello che ci chiedono di più.",
    subtitle: "Interventi rapidi, preventivi chiari, nessuna sorpresa in fattura.",
  },
  // Riutilizziamo "dishes" come servizi in evidenza
  dishes: [
    {
      name: "Tagliando completo",
      desc: "Cambio olio e filtri, controllo freni, livelli e usura. Tutto in un unico intervento.",
      price: "Da preventivo",
      image: "/officinakam/hero-moto.jpg",
      variant: "red",
      href: "#contatti",
    },
    {
      name: "Diagnostica OBD",
      desc: "Lettura errori, check sensori e centraline. Risultato immediato, soluzione chiara.",
      price: "Da preventivo",
      image: "/officinakam/hero-moto.jpg",
      variant: "mustard",
      href: "#contatti",
    },
    {
      name: "Kit freni completo",
      desc: "Sostituzione pastiglie e dischi freno, spurgo impianto. Sicurezza al primo posto.",
      price: "Da preventivo",
      image: "/officinakam/hero-moto.jpg",
      variant: "green",
      href: "#contatti",
    },
    {
      name: "Revisione sospensioni",
      desc: "Ammortizzatori, molle e silent block. Comfort e tenuta di strada ripristinati.",
      price: "Da preventivo",
      image: "/officinakam/hero-moto.jpg",
      variant: "pink",
      href: "#contatti",
    },
    {
      name: "Pneumatici montati",
      desc: "Fornitura e montaggio con equilibratura. Auto e moto, qualsiasi misura.",
      price: "Da preventivo",
      image: "/officinakam/hero-moto.jpg",
      variant: "red",
      href: "#contatti",
    },
    {
      name: "Check-up pre-viaggio",
      desc: "Controllo completo prima di partire: livelli, freni, pneumatici, luci e impianto elettrico.",
      price: "Gratuito",
      image: "/officinakam/hero-moto.jpg",
      variant: "mustard",
      href: "#contatti",
    },
  ],
  findUs: {
    eyebrow: "Dove siamo",
    titleLead: "Vieni a trovarci,",
    titleAccent: "siamo a Milano.",
    body:
      "Lavoriamo solo su appuntamento per garantire tempi certi e qualità costante. Contattaci per prenotare o richiedere un preventivo.",
    mapTitle: "Mappa Officina KAM",
  },
  footer: {
    tagline: "Precisione meccanica. Diagnostica avanzata.",
    body:
      "Officina KAM — manutenzione professionale per auto e moto a Milano. Interventi su appuntamento, preventivi chiari, nessuna sorpresa.",
  },
  delivery: {
    title: "Ritiro e consegna a domicilio",
    body: "Presto disponibile il servizio di ritiro e riconsegna del veicolo presso la tua sede.",
    partners: [],
  },
};

const studioaranzullaContent: TenantContent = {
  logoSrc: "/studioaranzulla/logo.svg",
  logoAlt: "Studio Legale Aranzulla",
  showcaseLogoSrc: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=900&q=80",
  showcaseLogoAlt: "Studio Legale Aranzulla — Avv. Lara Aranzulla",
  description:
    "Studio Legale Aranzulla — assistenza legale professionale in diritto civile, famiglia, lavoro e penale. Consulenza chiara, difesa concreta.",
  url: "https://www.studiolegalearanzulla.it",
  social: {
    instagram: "https://www.instagram.com/studiolegalearanzulla/",
    facebook: "https://www.facebook.com/studiolegalearanzulla/",
    instagramLabel: "Instagram Studio Legale Aranzulla",
    facebookLabel: "Facebook Studio Legale Aranzulla",
  },
  contact: {
    phone: "+39 0000 000000",
    email: "info@studiolegalearanzulla.it",
    whatsappDigits: "390000000000",
    whatsappMessage:
      "Buongiorno, sono interessato/a a una consulenza legale. Potete ricontattarmi? Grazie.",
  },
  address: {
    street: "Via Roma 1",
    zip: "00000",
    city: "— da completare —",
    province: "—",
    full: "Contattare lo studio per l'indirizzo",
  },
  maps: {
    searchUrl: "https://www.google.com/maps/search/?api=1&query=Studio+Legale+Aranzulla",
    embedUrl: "https://www.google.com/maps?q=Studio+Legale+Aranzulla&output=embed",
  },
  hero: {
    eyebrow: "Studio Legale · Assistenza Legale Professionale",
    titleLead: "Il diritto",
    titleAccent: "spiegato chiaro.",
    body:
      "Avvocato Lara Aranzulla. Assistenza legale concreta in diritto civile, famiglia, lavoro e penale. Prima consulenza per capire dove sei e cosa puoi fare.",
    backdrop: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=1600&q=80",
    ctaLabel: "Richiedi una consulenza",
  },
  soulsIntro: {
    eyebrow: "Aree di pratica",
    titleLead: "Ogni situazione merita",
    titleAccent: "la giusta competenza.",
    body:
      "Dallo studio legale alle aule di tribunale: affrontiamo ogni materia con preparazione specifica e attenzione al risultato concreto.",
  },
  souls: [
    {
      id: "civile",
      kicker: "Diritto Civile",
      title: "Tutela dei diritti",
      desc: "Contratti, responsabilità civile, risarcimenti, recupero crediti e controversie tra privati. Assistenza in ogni fase del procedimento.",
      href: "#aree",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "famiglia",
      kicker: "Diritto di Famiglia",
      title: "Separazioni e affidi",
      desc: "Separazione, divorzio, affidamento dei figli, mantenimento e modifica delle condizioni. Assistenza attenta anche nelle fasi più delicate.",
      href: "#aree",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "lavoro",
      kicker: "Diritto del Lavoro",
      title: "Tutela del lavoratore",
      desc: "Licenziamenti, mobbing, discriminazioni, mancato pagamento di stipendi e accordi sindacali. Difesa dei diritti in sede giudiziale e stragiudiziale.",
      href: "#aree",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
    },
  ],
  dishesIntro: {
    eyebrow: "Servizi legali",
    title: "Quello di cui hai bisogno, quando ne hai bisogno.",
    subtitle: "Consulenza chiara prima di ogni decisione. Assistenza concreta in ogni fase.",
  },
  dishes: [
    {
      name: "Prima Consulenza",
      desc: "Colloquio iniziale per analizzare la situazione, capire i rischi e definire la strategia più adatta.",
      price: "Su appuntamento",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
      variant: "red",
      href: "#consulenza",
    },
    {
      name: "Diritto Penale",
      desc: "Difesa in sede penale, indagini preliminari, udienza preliminare e dibattimento. Assistenza dal primo atto.",
      price: "Da preventivo",
      image: "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=900&q=80",
      variant: "mustard",
      href: "#aree",
    },
    {
      name: "Diritto Commerciale",
      desc: "Contratti commerciali, costituzione societaria, controversie tra soci e recupero crediti commerciali.",
      price: "Da preventivo",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
      variant: "green",
      href: "#aree",
    },
    {
      name: "Stragiudiziale",
      desc: "Mediazione, negoziazione assistita e accordi extragiudiziali. Soluzioni rapide quando è possibile evitare il tribunale.",
      price: "Da preventivo",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
      variant: "pink",
      href: "#consulenza",
    },
    {
      name: "Diritto Successorio",
      desc: "Testamenti, successioni, divisioni ereditarie e impugnazioni. Tutela del patrimonio familiare.",
      price: "Da preventivo",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
      variant: "red",
      href: "#aree",
    },
    {
      name: "Assistenza Continuativa",
      desc: "Supporto legale regolare per privati e piccole imprese: contratti, pareri e gestione del rischio.",
      price: "Formula mensile",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80",
      variant: "mustard",
      href: "#consulenza",
    },
  ],
  findUs: {
    eyebrow: "Contatti",
    titleLead: "Vieni in studio",
    titleAccent: "o scrivici.",
    body:
      "Primo contatto via email o telefono. Fissato l'appuntamento, l'incontro avviene in studio oppure, su richiesta, in videochiamata.",
    mapTitle: "Mappa Studio Legale Aranzulla",
  },
  footer: {
    tagline: "Il diritto spiegato chiaro.",
    body:
      "Studio Legale Aranzulla — Avv. Lara Aranzulla. Assistenza legale professionale in diritto civile, famiglia, lavoro e penale.",
  },
  delivery: {
    title: "",
    body: "",
    partners: [],
  },
};

const docaContent: TenantContent = {
  logoSrc: "/doca/logo-doca.webp",
  logoAlt: "Doca Milano",
  showcaseLogoSrc: "/doca/logo-doca.webp",
  showcaseLogoAlt: "Logo Doca",
  description:
    "Doca — bakery brasiliana a Milano, zona Corvetto. Pane a lievitazione naturale con farine Mulino Viva, pão de queijo, torta di mais con guava, caffè filtro Cafezal. International breakfast with brazilian soul.",
  url: "https://www.instagram.com/doca.milano/",
  social: {
    instagram: "https://www.instagram.com/doca.milano/",
    facebook: "",
    instagramLabel: "Instagram @doca.milano",
    facebookLabel: "",
  },
  contact: {
    phone: "352 067 2840",
    email: "info@doca.milano",
    whatsappDigits: "393520672840",
    whatsappMessage:
      "Olá Doca! Vorrei ordinare.",
  },
  address: {
    street: "Via Breno, 2",
    zip: "20139",
    city: "Milano",
    province: "MI",
    full: "Via Breno, 2 - 20139 Milano (MI) · zona Corvetto / San Luigi",
  },
  maps: {
    searchUrl:
      "https://www.google.com/maps/place/Doca+-+Pane,+Caff%C3%A8,+Saudade/@45.44248,9.2149812,17z/data=!3m1!4b1!4m6!3m5!1s0x4786c500463a3c21:0xab855fc6d4b925c3!8m2!3d45.44248!4d9.2149812!16s%2Fg%2F11ydc8s49q?entry=ttu",
    embedUrl:
      "https://www.google.com/maps?q=Doca+-+Pane%2C+Caff%C3%A8%2C+Saudade+Via+Breno+2+Milano&output=embed",
  },
  hero: {
    eyebrow: "Bakery brasiliana · Milano Corvetto",
    titleLead: "Pane, caffè,",
    titleAccent: "saudade.",
    body:
      "Una piccola bakery di quartiere a sud di Milano. Lievitazione naturale con farine del Mulino Viva, caffè filtro da singola piantagione, ricette brasiliane di Queren — non il Brasile da cartolina, quello dell'infanzia.",
    backdrop: "/doca/brigadeiros.jpg",
    ctaLabel: "Ordina ora",
  },
  soulsIntro: {
    eyebrow: "Padoca — la panetteria di quartiere",
    titleLead: "Tecnica e memoria,",
    titleAccent: "professionalità e radici.",
    body:
      "Doca viene da \"padoca\": quella panetteria sotto casa dove vai ogni mattina, conosci chi ti serve e ti senti a casa. Forno, caffè e dolci brasiliani sotto lo stesso tetto, in uno spazio che unisce bottega e laboratorio.",
  },
  souls: [
    {
      id: "pane",
      kicker: "Dal forno",
      title: "Il salato",
      desc: "Pane a lievitazione naturale, pão de queijo e proposte salate preparate ogni giorno.",
      href: "/menu#pane",
      image: "/doca/pane-campagna.webp",
    },
    {
      id: "caffe",
      kicker: "Ricette brasiliane",
      title: "Il dolce",
      desc: "Torta di carote e brigadeiro, dolci di casa e sapori che attraversano l'oceano.",
      href: "/menu#dolci",
      image: "/doca/caffe-filtro.jpg",
    },
    {
      id: "dolci",
      kicker: "Caffè e filtro",
      title: "Le bevande",
      desc: "Espresso, caffè filtro e bevande da gustare con calma, al banco o seduti.",
      href: "/menu#caffe",
      image: "/doca/le-bevande.webp",
    },
  ],
  dishesIntro: {
    eyebrow: "Quello che sforniamo",
    title: "Quello che cerchi quando entri da Doca.",
    subtitle: "Niente croissant, niente cinnamon rolls. Una colazione fatta in un altro modo — e qualche sorpresa al banco.",
  },
  dishes: [
    {
      name: "Pão de queijo",
      desc: "Manioca e formaggio Branzi: la versione Doca del classico brasiliano. Caldo, elastico, da mangiare subito.",
      price: "€ 2,50",
      image: "/doca/pao-de-queijo.jpg",
      variant: "mustard",
      href: "/menu#dolci",
    },
    {
      name: "Torta di mais con guava",
      desc: "Confettura di guava fresca da guave biologiche siciliane. Una fetta umida, dolce e profumata.",
      price: "€ 4,50",
      image: "/doca/torta-mais.jpg",
      variant: "red",
      href: "/menu#dolci",
    },
    {
      name: "Torta di carote & ganache",
      desc: "Carote dell'orto e ganache al cioccolato fondente sopra. Il classico bolo de cenoura brasiliano, fatto qui.",
      price: "€ 4,50",
      image: "/doca/dolci.jpg",
      variant: "pink",
      href: "/menu#dolci",
    },
    {
      name: "Caffè filtro · Cafezal",
      desc: "Singola piantagione brasiliana, miscela dolce e morbida. Versato lento, bevuto seduti.",
      price: "€ 3,50",
      image: "/doca/caffe-filtro.jpg",
      variant: "red",
      href: "/menu#caffe",
    },
    {
      name: "Pão da colônia",
      desc: "Pane bianco in cassetta di origine italo-brasiliana. Mollica fitta, perfetto per tostare la mattina dopo.",
      price: "€ 7,00 / pagnotta",
      image: "/doca/pane-bancone.jpg",
      variant: "green",
      href: "/menu#pane",
    },
    {
      name: "Cookies noci dell'Amazzonia",
      desc: "Friabili fuori, morbidi dentro. La nota tostata viene dalle noci, non da decorazioni esotiche.",
      price: "€ 3,00",
      image: "/doca/dolci.jpg",
      variant: "mustard",
      href: "/menu#dolci",
    },
  ],
  findUs: {
    eyebrow: "Come trovarci",
    titleLead: "Via Breno 2,",
    titleAccent: "Milano Corvetto.",
    body:
      "Ci trovi in zona Corvetto, in Via Breno 2. Passa per il pane, fermati per un caffè o ordina dal menu.",
    mapTitle: "Mappa Doca — Via Breno 2, Milano",
  },
  footer: {
    tagline: "International breakfast with brazilian soul.",
    body:
      "Doca — pane, caffè, saudade. Bakery di una brasiliana di quartiere fondata da Queren Girardi in Via Breno 2, Milano. Lievitazione naturale, caffè filtro Cafezal, ricette di casa.",
  },
  delivery: {
    title: "Niente delivery, vieni in bottega.",
    body: "Doca lavora pane fresco ogni mattina, in laboratorio aperto. Niente spedizioni: si passa, si guarda e si porta a casa. Su Too Good To Go è attiva la Surprise Bag a fine giornata.",
    partners: [
      { name: "Too Good To Go", url: "https://www.toogoodtogo.com/it/find/milano/doca-panecaffesaudade/bakedgoods/surprisebagmedia-153281183328024192", active: true },
    ],
  },
};

const nomSushiImages = {
  hero:
    "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1800&q=85",
  rolls:
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=85",
  platter:
    "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1200&q=85",
  nigiri:
    "https://images.unsplash.com/photo-1563612116625-3012372fccce?auto=format&fit=crop&w=1200&q=85",
  darkNigiri:
    "https://images.unsplash.com/photo-1615361200141-f45040f367be?auto=format&fit=crop&w=1200&q=85",
  board:
    "https://images.unsplash.com/photo-1607301405390-d831c242f59b?auto=format&fit=crop&w=1200&q=85",
};

const nomSushiContent: TenantContent = {
  logoSrc: "/nom-sushi/logo.svg",
  logoAlt: "Nøm sushi vibes",
  showcaseLogoSrc: "/nom-sushi/logo.svg",
  showcaseLogoAlt: "Nøm sushi vibes — All you can eat & sushi fusion · Genova",
  description:
    "Nøm sushi vibes — sushi fusion all you can eat nel centro storico di Genova. Pranzo 18,90 €, cena 32,90 €, aperisushi e una carta che mescola dimsum, tacos, gunkan e uramaki di firma.",
  url: "https://nomsushivibes.wordpress.com/",
  social: {
    instagram: "https://instagram.com/nom_sushi/",
    facebook: "https://www.facebook.com/nomsushi",
    instagramLabel: "Instagram Nøm sushi",
    facebookLabel: "Facebook Nøm sushi",
  },
  contact: {
    phone: "010 8992422",
    email: "hello@nomsushi.it",
    whatsappDigits: "390108992422",
    whatsappMessage:
      "Ciao Nøm! Vorrei prenotare un tavolo. Siamo in ___ persone, per il giorno ___ alle ___. Grazie!",
  },
  address: {
    street: "Salita di S. Matteo, 21 R",
    zip: "16123",
    city: "Genova",
    province: "GE",
    full: "Salita di S. Matteo, 21 R - 16123 Genova (GE)",
  },
  maps: {
    searchUrl:
      "https://www.google.com/maps/search/?api=1&query=N%C3%B8m+sushi+vibes+Salita+di+S.+Matteo+21+Genova",
    embedUrl:
      "https://www.google.com/maps?q=N%C3%B8m+sushi+vibes+Salita+di+S.+Matteo+21+R+Genova&output=embed",
  },
  hero: {
    eyebrow: "Sushi fusion · Aperisushi · Genova centro storico",
    titleLead: "Nigiri, roll",
    titleAccent: "e vibrazioni.",
    body:
      "Una carta fusion in tre ritmi: pranzo all you can eat, aperisushi serale e cena estesa con dim sum, tacos di riso, gunkan e uramaki di firma. A due passi da Piazza De Ferrari.",
    backdrop: nomSushiImages.hero,
    ctaLabel: "Prenota un tavolo",
  },
  soulsIntro: {
    eyebrow: "Tre rituali",
    titleLead: "Pranzo, aperitivo,",
    titleAccent: "cena lunga.",
    body:
      "Nøm cambia passo durante la giornata: AYCE 12–15, aperisushi 19–21 e cena 19–23:30. Il menu segue questi tempi e mette in primo piano le sezioni giuste.",
  },
  souls: [
    {
      id: "pranzo",
      kicker: "Pranzo · 12:00–15:00",
      title: "All you can eat 18,90",
      desc: "Antipasti, dim sum, nigiri, gunkan, futomaki e uramaki. Ridotto bambini 12,90.",
      href: "/menu#pranzo",
      image: nomSushiImages.rolls,
    },
    {
      id: "aperisushi",
      kicker: "Aperisushi · 19:00–21:00",
      title: "Aperisushi 13,90",
      desc: "Un drink più combo cucina o combo sushi. Edamame, gunkan, nigiri, hosomaki, uramaki.",
      href: "/menu#aperisushi",
      image: nomSushiImages.platter,
    },
    {
      id: "cena",
      kicker: "Cena · 19:00–23:30",
      title: "Cena AYCE 32,90",
      desc: "Carta estesa con tartare, carpacci, sashimi, Nøm Crudité e Nøm Specials. Festivi/weekend 20,90 a pranzo.",
      href: "/menu#cena",
      image: nomSushiImages.darkNigiri,
    },
  ],
  dishesIntro: {
    eyebrow: "Nøm signatures",
    title: "Roll, crudi e piccoli colpi di fuoco.",
    subtitle: "Una selezione costruita su riso, alghe, salmone, ponzu e contrasti fusion.",
  },
  dishes: [
    {
      name: "Nigiri Nøm",
      desc: "Misto scottato con salmone, branzino e tonno, parmigiano, cipolla croccante e spicy mayo.",
      price: "AYCE",
      image: nomSushiImages.nigiri,
      variant: "red",
      href: "/menu#nigiri",
    },
    {
      name: "Black Salmon",
      desc: "Rotolo di riso venere con salmone, philadelphia, avocado, granella di pistacchio e teriyaki.",
      price: "AYCE",
      image: nomSushiImages.rolls,
      variant: "mustard",
      href: "/menu#uramaki",
    },
    {
      name: "Tacos salmone",
      desc: "Tacos fritto con riso, salmone crudo, avocado, philadelphia e teriyaki. Solo a cena.",
      price: "AYCE",
      image: nomSushiImages.board,
      variant: "pink",
      href: "/menu#tacos",
    },
    {
      name: "Tartare Branzino",
      desc: "Tartare di branzino e avocado in salsa ponzu. Solo a cena.",
      price: "AYCE cena",
      image: nomSushiImages.darkNigiri,
      variant: "green",
      href: "/menu#tartare",
    },
    {
      name: "Polpo Flambé",
      desc: "Polpo cotto con purea di patate, parmigiano e barbecue della casa. Nøm Crudité.",
      price: "AYCE cena",
      image: nomSushiImages.platter,
      variant: "red",
      href: "/menu#nom-crudite",
    },
    {
      name: "Gunkan Fruit",
      desc: "Riso avvolto da salmone scottato, philadelphia, frutta e teriyaki.",
      price: "AYCE cena",
      image: nomSushiImages.board,
      variant: "mustard",
      href: "/menu#gunkan",
    },
  ],
  findUs: {
    eyebrow: "Come trovarci",
    titleLead: "Salita di S. Matteo,",
    titleAccent: "Genova centro storico.",
    body:
      "Pranzo 12:00–15:00, cena 19:00–23:30. A due passi da Piazza De Ferrari e dal Palazzo Ducale, nei caruggi tra San Matteo e San Lorenzo.",
    mapTitle: "Mappa Nøm sushi — Salita di S. Matteo 21, Genova",
  },
  footer: {
    tagline: "Sushi che vibra. All you can eat a Genova.",
    body:
      "Nøm sushi vibes — Salita di S. Matteo 21 R, Genova. Pranzo 12:00–15:00, cena 19:00–23:30, aperisushi 19:00–21:00. hello@nomsushi.it",
  },
  delivery: {
    title: "Prenota, poi passa da noi",
    body: "Per ora si prenota il tavolo o si scrive su Instagram. L'asporto digitale arriverà più avanti.",
    partners: [],
  },
};

const juniorFoodContent: TenantContent = {
  logoSrc: "/favicons/junior-food/icon.svg",
  logoAlt: "Junior Food",
  showcaseLogoSrc:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85",
  showcaseLogoAlt: "Junior Food - cucina sudamericana a Bergamo",
  description:
    "Junior Food - cucina sudamericana a Bergamo. Specialita latine, feijoada, pique macho, silpancho e prenotazioni tavolo per pranzo e cena.",
  url: "https://demo.menuary.it/junior-food",
  social: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    instagramLabel: "Instagram Junior Food",
    facebookLabel: "Facebook Junior Food",
  },
  contact: {
    phone: "+39 389 479 6163",
    whatsappDigits: "393894796163",
    whatsappMessage:
      "Ciao Junior Food! Vorrei prenotare un tavolo. Siamo in ___ persone, per il giorno ___ alle ___. Grazie!",
  },
  address: {
    street: "Via Gianbattista Moroni",
    zip: "24127",
    city: "Bergamo",
    province: "BG",
    full: "Via Gianbattista Moroni, 24127 Bergamo BG",
  },
  maps: {
    searchUrl: "https://maps.app.goo.gl/BvAqtD8Tbs87TiHn6",
    embedUrl:
      "https://www.google.com/maps?q=Via+Gianbattista+Moroni+Bergamo&output=embed",
  },
  hero: {
    eyebrow: "Autentica cucina Sud Americana",
    titleLead: "Assapora il ritmo",
    titleAccent: "del Sud America.",
    body:
      "La tradizione culinaria latina incontra il gusto contemporaneo: specialita iconiche, street food gourmet e cocktail esotici.",
    backdrop:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=85",
    ctaLabel: "Prenota",
  },
  soulsIntro: {
    eyebrow: "La nostra Storia",
    titleLead: "I veri profumi",
    titleAccent: "dell'America Latina.",
    body:
      "Junior nasce per essere un ponte tra culture, dove la cottura lenta della carne alla griglia e la freschezza degli ingredienti tropicali si incontrano.",
  },
  souls: [
    {
      id: "griglia",
      kicker: "Cottura lenta",
      title: "Carne alla griglia",
      desc: "Tagli generosi, sapori decisi e piatti pensati per essere condivisi.",
      href: "#menu",
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=85",
    },
    {
      id: "tradizione",
      kicker: "Ricette latine",
      title: "Specialita iconiche",
      desc: "Feijoada, pique macho, fideos uchu e silpancho in una carta essenziale.",
      href: "#menu",
      image:
        "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=900&q=85",
    },
    {
      id: "cocktail",
      kicker: "Serata tropicale",
      title: "Cocktail esotici",
      desc: "Agrumi, spezie e freschezza per accompagnare pranzo e cena.",
      href: "#prenota",
      image:
        "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=85",
    },
  ],
  dishesIntro: {
    eyebrow: "Il menu",
    title: "I piu amati",
    subtitle: "I piatti sudamericani piu richiesti dalla casa.",
  },
  dishes: [
    {
      name: "Pique Macho",
      desc: "Manzo, salsicce, cipolla, pomodori, paprika, uova e patate.",
      price: "15€",
      image:
        "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=900&q=85",
      variant: "red",
      href: "#menu",
    },
    {
      name: "Planchita",
      desc: "Costata di manzo, cipolla, pomodoro, salsiccia, pollo, uova e manioca.",
      price: "25€",
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=85",
      variant: "mustard",
      href: "#menu",
    },
    {
      name: "Fideos Uchu",
      desc: "Manzo, pasta, cipolla, pomodori, piselli, uova, fagioli, carota e patate.",
      price: "10€",
      image:
        "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85",
      variant: "green",
      href: "#menu",
    },
    {
      name: "Silpancho",
      desc: "Manzo impanato, riso, cipolla, pomodori, paprika, uova e patatine fritte.",
      price: "12€",
      image:
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=85",
      variant: "pink",
      href: "#menu",
    },
  ],
  findUs: {
    eyebrow: "Vieni a trovarci",
    titleLead: "Bergamo,",
    titleAccent: "Via Gianbattista Moroni.",
    body:
      "Clienti senza prenotazione benvenuti; per cena consigliamo di riservare il tavolo.",
    mapTitle: "Mappa Junior Food - Bergamo",
  },
  footer: {
    tagline: "Autentica cucina Sud Americana.",
    body:
      "Junior Food porta a Bergamo piatti latini, cotture lente, ingredienti tropicali e una sala pensata per stare insieme.",
  },
  delivery: {
    title: "",
    body: "",
    partners: [],
  },
};

const kimosContent: TenantContent = {
  logoSrc: "/kimos/logo.svg",
  logoAlt: "Pizzeria Kimos",
  showcaseLogoSrc: "/kimos/logo.svg",
  showcaseLogoAlt: "Pizzeria Kimos - pizza, kebab e fritti a Milano",
  description:
    "Pizzeria Kimos a Milano Santa Giulia: pizze tradizionali, kebab, panini, focacce e fritti. Menu online e ordini diretti in Via Bruno Cassinari 3.",
  url: "https://pizzeria-kimos.it",
  social: {
    instagram: "",
    facebook: "https://www.facebook.com/profile.php?id=100054450701009",
    instagramLabel: "",
    facebookLabel: "Facebook Pizzeria Kimos",
  },
  contact: {
    phone: "02 513404",
    whatsappDigits: "3902513404",
    whatsappMessage:
      "Ciao Pizzeria Kimos! Vorrei fare un ordine. Mi potete aiutare?",
  },
  address: {
    street: "Via Bruno Cassinari, 3",
    zip: "20138",
    city: "Milano",
    province: "MI",
    full: "Via Bruno Cassinari, 3 - 20138 Milano (MI)",
  },
  maps: {
    searchUrl: "https://maps.app.goo.gl/55BuJJ4iMh6ZWqrs7",
    embedUrl:
      "https://www.google.com/maps?q=Pizzeria+Kimos+Via+Bruno+Cassinari+3+Milano&output=embed",
  },
  hero: {
    eyebrow: "Pizzeria di quartiere - Santa Giulia, Milano",
    titleLead: "Pizza, kebab",
    titleAccent: "e fame vera.",
    body:
      "A Santa Giulia si ordina senza giri di parole: pizze tradizionali, panini kebab, focacce e fritti preparati per il tavolo o da portare via.",
    backdrop: "/kimos/menu-board-spread.png",
    ctaLabel: "Ordina ora",
  },
  soulsIntro: {
    eyebrow: "Una carta che non lascia fuori nessuno",
    titleLead: "Dal forno allo spiedo,",
    titleAccent: "fino all'ultimo fritto.",
    body:
      "Kimos tiene insieme le scelte che servono davvero a pranzo, a cena e quando arriva quella fame da risolvere bene.",
  },
  souls: [
    {
      id: "pizza",
      kicker: "Dal forno",
      title: "Pizze tradizionali",
      desc: "Classiche, giganti e componibili: la parte più ampia della carta Kimos.",
      href: "/menu#pizze-tradizionali",
      image: "/kimos/menu-board-spread.png",
    },
    {
      id: "kebab",
      kicker: "Dallo spiedo",
      title: "Kebab e panini",
      desc: "Panino, piadina e piatto kebab con insalata, salse e varianti complete.",
      href: "/menu#kebab",
      image: "/kimos/menu-board-kebab.png",
    },
    {
      id: "fritti",
      kicker: "Da condividere",
      title: "Fritti e sfizi",
      desc: "Alette, nuggets, crocchette, falafel e mix fritti per completare l'ordine.",
      href: "/menu#fritti",
      image: "/kimos/menu-board-plates.png",
    },
  ],
  dishesIntro: {
    eyebrow: "Scelte Kimos",
    title: "Le basi di un ordine fatto bene.",
    subtitle: "Pochi dubbi, molta scelta: pizza, kebab e fritti da comporre come vuoi.",
  },
  dishes: [
    {
      name: "Menu panino kebab",
      desc: "Panino kebab, patatine fritte e Coca-Cola 33 cl.",
      price: "€ 9,50",
      image: "/kimos/menu-board-kebab.png",
      variant: "red",
      href: "/menu#menu-completi",
    },
    {
      name: "Menu piadina kebab",
      desc: "Piadina kebab, patatine fritte e Coca-Cola 33 cl.",
      price: "€ 10,00",
      image: "/kimos/menu-board-kebab.png",
      variant: "mustard",
      href: "/menu#menu-completi",
    },
    {
      name: "Piatto kebab",
      desc: "Kebab completo con pane, insalata e contorno.",
      price: "€ 9,50",
      image: "/kimos/menu-board-plates.png",
      variant: "green",
      href: "/menu#kebab",
    },
    {
      name: "Mix fritti",
      desc: "Dodici pezzi misti: olive, mozzarelline, alette, crocchette, onion rings e nuggets.",
      price: "€ 12,50",
      image: "/kimos/menu-board-plates.png",
      variant: "pink",
      href: "/menu#fritti",
    },
  ],
  findUs: {
    eyebrow: "Santa Giulia, Milano",
    titleLead: "Passa da Kimos,",
    titleAccent: "oppure ordina online.",
    body:
      "Siamo in Via Bruno Cassinari 3, a pochi minuti dalla stazione di Milano Rogoredo. Pranzo e cena, tutti i giorni.",
    mapTitle: "Mappa Pizzeria Kimos - Milano",
  },
  footer: {
    tagline: "Pizza, kebab e fritti a Santa Giulia.",
    body:
      "Pizzeria Kimos prepara pizze tradizionali, kebab, panini, focacce e fritti in Via Bruno Cassinari 3 a Milano.",
  },
  delivery: {
    title: "Vuoi ordinare subito?",
    body: "Scegli i piatti dal menu online e invia il tuo ordine a Kimos.",
    partners: [
      {
        name: "Just Eat",
        url: "https://www.justeat.it/restaurants-pizzeriakimos/menu",
        active: true,
      },
    ],
  },
};

const pynkstudioContent: TenantContent = {
  logoSrc: "/pynkstudio/pynk-logo-transparent.png",
  logoAlt: "PYNK STUDIO",
  showcaseLogoSrc: "/pynkstudio/pynk-logo.png",
  showcaseLogoAlt: "PYNK STUDIO — Software house AI e sviluppo su misura",
  description:
    "Software house specializzata in soluzioni AI: chatbot, agenti, RAG, AI locale e cloud, integrazioni, governance tecnica e conformità AI Act.",
  url: "https://pynkstudio.it",
  social: {
    instagram: "https://www.instagram.com/pynkstudios",
    facebook: "https://www.linkedin.com/company/pynkstudio",
    instagramLabel: "Instagram @pynkstudios",
    facebookLabel: "LinkedIn PYNK STUDIO",
  },
  contact: {
    phone: "+39 351 376 8607",
    email: "info@pynkstudio.it",
    whatsappDigits: "393513768607",
    whatsappMessage: "Buongiorno, vorrei informazioni su PYNK STUDIO.",
  },
  address: {
    street: "—",
    zip: "20100",
    city: "Milano",
    province: "MI",
    full: "Milano (MI) · P.IVA 13577530960",
  },
  legal: {
    name: `PYNK STUDIO di ${PLATFORM_OPERATOR.legalName}`,
    address: PLATFORM_OPERATOR.address,
    phone: "+39 351 376 8607",
    email: "info@pynkstudio.it",
    piva: PLATFORM_OPERATOR.piva,
    pec: PLATFORM_OPERATOR.pec,
  },
  maps: {
    searchUrl: "https://www.google.com/maps/search/?api=1&query=Milano",
    embedUrl: "https://www.google.com/maps?q=Milano&output=embed",
  },
  hero: {
    eyebrow: "Software house · Milano",
    titleLead: "Costruiamo sistemi AI",
    titleAccent: "che reggono il mondo reale.",
    body:
      "Progettiamo e implementiamo soluzioni AI moderne: chatbot, agenti, RAG, workflow, API e integrazioni governate da processi tecnici chiari.",
    backdrop: "/pynkstudio/pynk-logo.png",
    ctaLabel: "Contattaci",
  },
  soulsIntro: {
    eyebrow: "Cosa facciamo",
    titleLead: "Tre pilastri,",
    titleAccent: "un solo metodo.",
    body: "Web, mobile e desktop: delivery surface diverse, stessa cura ingegneristica.",
  },
  souls: [
    {
      id: "web",
      kicker: "Web & product engineering",
      title: "Siti e web app",
      desc: "Dal sito vetrina al portale con login: velocità percepita, SEO sensato e pannello che non spaventa chi deve aggiornarlo.",
      href: "/servizi",
      image: "/pynkstudio/pynk-logo.png",
    },
    {
      id: "mobile",
      kicker: "Mobile · native & cross",
      title: "App iOS e Android",
      desc: "Per utenti finali o squadre sul campo: notifiche, sessione sicura, integrazione con i vostri backend.",
      href: "/servizi",
      image: "/pynkstudio/pynk-logo.png",
    },
    {
      id: "desktop",
      kicker: "Desktop & tooling",
      title: "Applicazioni desktop",
      desc: "Programmi su misura per ufficio, produzione o amministrazione, anche quando il browser non basta.",
      href: "/servizi",
      image: "/pynkstudio/pynk-logo.png",
    },
  ],
  dishesIntro: {
    eyebrow: "Portfolio",
    title: "Dove abbiamo già messo le mani.",
    subtitle:
      "Prodotti e siti curati end-to-end: software professionale, strumenti operativi, esperienze web, mobile e titoli creativi.",
  },
  dishes: [
    {
      name: "PerX",
      desc: "Gestionale desktop per studi peritali: pratiche di sinistro in ordine, meno errori, tempi più contenuti.",
      price: "perx.it",
      image: "/pynkstudio/pynk-logo.png",
      variant: "pink",
      href: "https://perx.it",
    },
    {
      name: "CAT Dispatcher",
      desc: "Coordina sul territorio le attività CAT con logiche chiare e automazioni su assegnazioni e comunicazioni.",
      price: "catdispatcher.it",
      image: "/pynkstudio/pynk-logo.png",
      variant: "red",
      href: "https://catdispatcher.it",
    },
    {
      name: "Echoes",
      desc: "Scoperta musicale guidata dall'AI: descrivi un'emozione e trova brani che ci stanno dentro.",
      price: "echoesmusic.it",
      image: "/pynkstudio/pynk-logo.png",
      variant: "mustard",
      href: "https://echoesmusic.it",
    },
  ],
  findUs: {
    eyebrow: "Contatti",
    titleLead: "Parliamo del vostro",
    titleAccent: "progetto.",
    body: "Sviluppo software o consulenza operativa: call di 20 minuti, senza impegno.",
    mapTitle: "PYNK STUDIO",
  },
  footer: {
    tagline: "Software, web e app su misura.",
    body: "PYNK STUDIO — software house AI: sviluppo sistemi AI, web app, integrazioni, governance tecnica e conformità AI Act. P.IVA 13577530960.",
  },
  delivery: {
    title: "Prossimo progetto: il vostro?",
    body: "Obiettivi, tempi, vincoli: parliamone senza giri di parole.",
    partners: [],
  },
};

const cascinaErranteContent: TenantContent = {
  logoSrc: "/cascina-errante/logo-square.png",
  logoAlt: "Cascina Errante",
  showcaseLogoSrc: "/cascina-errante/logo-horizontal.png",
  showcaseLogoAlt: "Cascina Errante - Poesia e Fantasia",
  description:
    "Cascina Errante unisce ospitalità elegante, agricoltura innovativa, cucina a vista, bottega, avventure outdoor ed eventi nel cuore della natura lombarda.",
  url: "https://cascinaerrante.it",
  social: {
    instagram: "",
    facebook: "",
    instagramLabel: "Instagram Cascina Errante",
    facebookLabel: "Facebook Cascina Errante",
  },
  contact: {
    phone: "+39 095 123 4567",
    email: "info@cascinaerrante.it",
    whatsappDigits: "393331234567",
    whatsappMessage:
      "Ciao Cascina Errante! Vorrei prenotare una visita o un tavolo. Siamo in ___ persone, per il giorno ___ alle ___. Grazie!",
  },
  address: {
    street: "Via delle Cascine, 123",
    zip: "20010",
    city: "Milano",
    province: "MI",
    full: "Via delle Cascine, 123 - 20010 Milano (MI)",
  },
  maps: {
    searchUrl:
      "https://www.google.com/maps/search/?api=1&query=Cascina+Errante+Via+delle+Cascine+123+Milano",
    embedUrl:
      "https://www.google.com/maps?q=Cascina+Errante+Via+delle+Cascine+123+Milano&output=embed",
  },
  hero: {
    eyebrow: "Cascina · Bottega · Adventure · Eventi",
    titleLead: "Poesia",
    titleAccent: "e Fantasia.",
    body:
      "Dove tradizione e innovazione si incontrano nel cuore della natura lombarda. Un'esperienza che rispetta la natura e celebra l'eccellenza.",
    backdrop: "/cascina-errante/logo.png",
    ctaLabel: "Prenota l'esperienza",
  },
  soulsIntro: {
    eyebrow: "Le nostre anime creative",
    titleLead: "Quattro storie,",
    titleAccent: "una sola visione.",
    body:
      "Ogni aspetto di Cascina Errante racconta una storia diversa, unita dalla passione per la qualità e il rispetto per la natura.",
  },
  souls: [
    {
      id: "cascina",
      kicker: "Ospitalità elegante",
      title: "La Cascina",
      desc: "Ospitalità elegante e fattoria innovativa nel cuore della natura lombarda.",
      href: "/chi-siamo",
      image: "/cascina-errante/logo.png",
    },
    {
      id: "bottega",
      kicker: "Dal campo alla tavola",
      title: "La Bottega",
      desc: "Prodotti freschi, liofilizzati e conserve della nostra produzione.",
      href: "/menu",
      image: "/cascina-errante/logo-horizontal.png",
    },
    {
      id: "eventi",
      kicker: "Esperienze su misura",
      title: "Eventi & Privé",
      desc: "Food truck premium ed esperienze itineranti per occasioni private e aziendali.",
      href: "/prenota",
      image: "/cascina-errante/logo-square.png",
    },
  ],
  dishesIntro: {
    eyebrow: "Le nostre eccellenze",
    title: "Innovazione tecnologica e tradizione artigianale.",
    subtitle:
      "Ogni prodotto racconta la storia della nostra passione per la qualità e il rispetto della natura.",
  },
  dishes: [
    {
      name: "Microgreens Premium",
      desc: "Giovani germogli ricchi di nutrienti e sapore intenso.",
      price: "€ 6-12",
      image: "/cascina-errante/logo.png",
      variant: "green",
      href: "/menu",
    },
    {
      name: "Miele Aromatizzato",
      desc: "Basilico, menta e peperoni per un miele unico al mondo.",
      price: "€ 15-22",
      image: "/cascina-errante/logo-horizontal.png",
      variant: "mustard",
      href: "/menu",
    },
    {
      name: "Liofilizzati Adventure",
      desc: "Piatti gourmet per escursionisti e avventurieri.",
      price: "€ 18-35",
      image: "/cascina-errante/logo-square.png",
      variant: "red",
      href: "/prenota",
    },
  ],
  findUs: {
    eyebrow: "Come trovarci",
    titleLead: "Immersa nel verde,",
    titleAccent: "vicina a Milano.",
    body:
      "Vieni a trovarci nella nostra cascina in Lombardia per vivere il ristorante, la bottega e le nostre esperienze.",
    mapTitle: "Mappa Cascina Errante",
  },
  footer: {
    tagline: "Poesia e fantasia.",
    body:
      "Cascina, bottega, avventure ed eventi: tradizione e innovazione nel cuore della natura lombarda.",
  },
  delivery: {
    title: "Porta a casa i sapori della cascina.",
    body:
      "Ordina i prodotti disponibili oppure prenota un'esperienza in cascina.",
    partners: [
      { name: "Ordina online", url: "/ordina", active: true },
      { name: "Prenota", url: "/prenota", active: true },
    ],
  },
};

import { findTenantById } from "./tenant-registry";

export function getTenantContent(tenantId: string): TenantContent {
  if (tenantId === "cascina-errante") return cascinaErranteContent;
  if (tenantId === "faak") return faakContent;
  if (tenantId === "libritech") return libritechContent;
  if (tenantId === "valentina-orciuoli") return valentinaOrciuoliContent;
  if (tenantId === "officinakam") return officinakamContent;
  if (tenantId === "studioaranzulla") return studioaranzullaContent;
  if (tenantId === "pynkstudio") return pynkstudioContent;
  if (tenantId === "doca") return docaContent;
  if (tenantId === "junior-food") return juniorFoodContent;
  if (tenantId === "nom-sushi") return nomSushiContent;
  if (tenantId === "kimos") return kimosContent;
  // Ogni tenant deve avere il proprio blocco content sopra.
  // Fallback per verticale: non restituire mai contenuto food per tenant non-food.
  const profile = findTenantById(tenantId);
  if (profile?.vertical === "creative") return valentinaOrciuoliContent;
  if (profile?.vertical === "services") return officinakamContent;
  return beporkContent;
}
