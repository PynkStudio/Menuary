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

export function getTenantContent(tenantId: string): TenantContent {
  return tenantId === "faak" ? faakContent : beporkContent;
}
