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
  logoAlt: "Be Pork",
  showcaseLogoSrc: "/logo-payoff.png",
  showcaseLogoAlt: "Be Pork - Mordi e Godi",
  description:
    "Be Pork - ristorante, pizzeria e burger house nel centro di Bari. Burger smashati, pizze firmate, cucina pugliese che non chiede permesso.",
  url: "https://bepork.it",
  social: {
    instagram: "https://www.instagram.com/bepork2.0/",
    facebook: "https://www.facebook.com/BurgerPork/",
    instagramLabel: "Instagram Be Pork",
    facebookLabel: "Facebook Be Pork",
  },
  contact: {
    phone: "+39 347 466 7087",
    whatsappDigits: "393474667087",
    whatsappMessage:
      "Ciao Be Pork! Vorrei prenotare un tavolo. Siamo in ___ persone, per il giorno ___ alle ___. Grazie!",
  },
  address: {
    street: "Via Quintino Sella, 128",
    zip: "70123",
    city: "Bari",
    province: "BA",
    full: "Via Quintino Sella, 128 - 70123 Bari (BA)",
  },
  maps: {
    searchUrl:
      "https://www.google.com/maps/search/?api=1&query=Be+Pork+Via+Quintino+Sella+128+Bari",
    embedUrl:
      "https://www.google.com/maps?q=Be+Pork+Via+Quintino+Sella+128+Bari&output=embed",
  },
  hero: {
    eyebrow: "Ristorante - Pizzeria - Burger House - Bari",
    titleLead: "Il maiale",
    titleAccent: "e una filosofia.",
    body:
      "A Bari, si chiama Be Pork. Burger smashati, pizze firmate, cucina pugliese che non chiede permesso.",
    backdrop: "/photos/burger-esagerato.png",
    ctaLabel: "Prenota su WhatsApp",
  },
  soulsIntro: {
    eyebrow: "Tre anime, una casa",
    titleLead: "Tutte le facce della fame,",
    titleAccent: "in un posto solo.",
    body:
      "Be Pork non e un burger bar. E un ristorante con tre anime forti che convivono nello stesso tavolo.",
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
      desc: "Classiche come devono essere. Speciali Be Pork come non te le aspetti.",
      href: "/menu#pizze-speciali",
      image: "/photos/pizza-multigusto.png",
    },
    {
      id: "cucina",
      kicker: "Tradizione Pugliese",
      title: "Cucina Pugliese",
      desc: "Crudo alla barese, orecchiette con le brasciole, tagliata Angus. Si mangia sul serio.",
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
      desc: "Spaghetti croccanti, pomodoro, stracciatella. Bari in una fetta.",
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
      desc: "Il ragu della domenica, a Bari, ogni sera.",
      price: "Primi",
      image: "/photos/orecchiette-padella.png",
      variant: "mustard",
      href: "/menu#primi",
    },
  ],
  findUs: {
    eyebrow: "Come trovarci",
    titleLead: "In centro a Bari,",
    titleAccent: "dove si mangia davvero.",
    body:
      "Via Quintino Sella, cuore del quartiere Murat. Due passi dal mare, meno da un buon bicchiere di birra.",
    mapTitle: "Mappa Be Pork",
  },
  footer: {
    tagline: "Il maiale e una filosofia.",
    body:
      "Ristorante, pizzeria e burger house nel centro di Bari. Burger smashati, pizze firmate, cucina pugliese che non chiede permesso.",
  },
  delivery: {
    title: "Fame ora, tavolo pieno?",
    body: "Presto ordini Be Pork anche a domicilio.",
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
      "Per FAAK la navigazione diventa manifesto: mattina, giorno e aperitivo sostituiscono il lessico Be Pork e mostrano come il sistema regga un'identita nuova.",
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
  logoSrc: "/doca/vetrina.jpg",
  logoAlt: "Doca Milano",
  showcaseLogoSrc: "/doca/brigadeiros.jpg",
  showcaseLogoAlt: "Brigadeiros Doca su vassoio rosso",
  description:
    "Doca — bakery brasiliana a Milano, zona Corvetto. Pane a lievitazione naturale con farine Mulino Viva, pão de queijo, torta di mais con guava, caffè filtro Cafezal. International breakfast with brazilian soul.",
  url: "https://www.instagram.com/doca.milano/",
  social: {
    instagram: "https://www.instagram.com/doca.milano/",
    facebook: "https://www.instagram.com/doca.milano/",
    instagramLabel: "Instagram @doca.milano",
    facebookLabel: "Instagram @doca.milano",
  },
  contact: {
    phone: "Instagram @doca.milano",
    whatsappDigits: "",
    whatsappMessage:
      "Olá Doca! Vorrei sapere cosa c'è oggi al banco.",
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
      "https://www.google.com/maps/search/?api=1&query=Doca+-+Pane%2C+Caff%C3%A8%2C+Saudade+Via+Breno+2+Milano",
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
    ctaLabel: "Scrivici su Instagram",
  },
  soulsIntro: {
    eyebrow: "Padoca — la panetteria di quartiere",
    titleLead: "Tecnica e memoria,",
    titleAccent: "professionalità e radici.",
    body:
      "Doca viene da \"padoca\": quella panetteria sotto casa dove vai ogni mattina, conosci chi ti serve e ti senti a casa. Forno, caffè e dolci brasiliani sotto lo stesso tetto, dietro la finestra del laboratorio.",
  },
  souls: [
    {
      id: "pane",
      kicker: "Dal laboratorio",
      title: "Pane a lievitazione naturale",
      desc: "Semi-integrale, con segale, ai semi e il pão da colônia — il pane in cassetta italo-brasiliano. Farine del Mulino Viva, in Piemonte. Si compra direttamente dalla finestra del laboratorio.",
      href: "/menu#pane",
      image: "/doca/pane-scaffale.jpg",
    },
    {
      id: "caffe",
      kicker: "Cafezal roastery",
      title: "Espresso & filtro",
      desc: "Espresso e caffè filtro da singola piantagione brasiliana. Una miscela dolce e morbida, scelta insieme alla torrefazione Cafezal. Si beve seduti o al banco, niente fretta.",
      href: "/menu#caffe",
      image: "/doca/caffe-filtro.jpg",
    },
    {
      id: "dolci",
      kicker: "Colazione internazionale, anima brasiliana",
      title: "Dolci e lievitati",
      desc: "Pão de queijo con manioca e Branzi, torta di carote con ganache al cioccolato, torta di mais con confettura di guava siciliana bio, cookies con noci dell'Amazzonia.",
      href: "/menu#dolci",
      image: "/doca/dolci.jpg",
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
      "Un ex centro scommesse trasformato in bakery, in zona San Luigi-Corvetto. Aperti da mercoledì a sabato, 08:30–13:00; chiusi lunedì, martedì e domenica. Pane direttamente dalla finestra del laboratorio, dolci e caffè al banco.",
    mapTitle: "Mappa Doca — Via Breno 2, Milano",
  },
  footer: {
    tagline: "International breakfast with brazilian soul.",
    body:
      "Doca — pane, caffè, saudade. Bakery brasiliana di quartiere fondata da Queren Girardi in Via Breno 2, Milano. Lievitazione naturale, caffè filtro Cafezal, ricette di casa.",
  },
  delivery: {
    title: "Niente delivery, vieni in bottega.",
    body: "Doca lavora pane fresco ogni mattina, in laboratorio aperto. Niente spedizioni: si passa, si guarda e si porta a casa. Su Too Good To Go è attiva la Surprise Bag a fine giornata.",
    partners: [
      { name: "Too Good To Go", url: "https://www.toogoodtogo.com/it/find/milano/doca-panecaffesaudade/bakedgoods/surprisebagmedia-153281183328024192", active: true },
    ],
  },
};

import { findTenantById } from "./tenant-registry";

export function getTenantContent(tenantId: string): TenantContent {
  if (tenantId === "faak") return faakContent;
  if (tenantId === "libritech") return libritechContent;
  if (tenantId === "officinakam") return officinakamContent;
  if (tenantId === "studioaranzulla") return studioaranzullaContent;
  if (tenantId === "doca") return docaContent;
  // Ogni tenant deve avere il proprio blocco content sopra.
  // Fallback per verticale: non restituire mai contenuto BePork per tenant services.
  const profile = findTenantById(tenantId);
  if (profile?.vertical === "services") return officinakamContent;
  return beporkContent;
}
