export const siteConfig = {
  name: "ThePork",
  tagline: "Il maiale è una filosofia. Nel demo Menuary, si chiama ThePork.",
  description:
    "ThePork - ristorante demo, pizzeria e burger house. Burger smashati, pizze firmate e cucina italiana pensata come modello Menuary.",
  url: "https://demo.menuary.it/bepork-demo",
  ogImage: "/og/cover.jpg",

  address: {
    street: "Via Demo, 1",
    zip: "00000",
    city: "Citta Demo",
    province: "DM",
    country: "IT",
    full: "Via Demo, 1 - 00000 Citta Demo (DM)",
  },

  geo: {
    latitude: 41.9,
    longitude: 12.5,
  },

  contact: {
    phone: "+39 000 000 0000",
    phoneDigits: "390000000000",
    phoneLocal: "0000000000",
    email: "",
  },

  social: {
    instagram: "https://www.instagram.com/thepork.demo/",
    instagramHandle: "@thepork.demo",
    facebook: "https://www.facebook.com/theporkdemo/",
  },

  maps: {
    shortUrl: "https://www.google.com/maps/search/?api=1&query=ThePork+restaurant+demo",
    searchUrl:
      "https://www.google.com/maps/search/?api=1&query=ThePork+restaurant+demo",
    embedUrl:
      "https://www.google.com/maps?q=restaurant+demo&output=embed",
    rating: 4.6,
    reviewsCount: 248,
  },

  hours: [
    { day: "Lunedì", slots: [] as string[], closed: true },
    { day: "Martedì", slots: ["19:00 – 00:00"], closed: false },
    { day: "Mercoledì", slots: ["19:00 – 00:00"], closed: false },
    {
      day: "Giovedì",
      slots: ["12:30 – 15:00", "19:00 – 00:00"],
      closed: false,
    },
    {
      day: "Venerdì",
      slots: ["12:30 – 15:00", "19:00 – 00:00"],
      closed: false,
    },
    {
      day: "Sabato",
      slots: ["12:30 – 15:00", "19:00 – 00:00"],
      closed: false,
    },
    { day: "Domenica", slots: ["19:00 – 00:00"], closed: false },
  ],

  hoursSchema: [
    "Tu 19:00-23:59",
    "We 19:00-23:59",
    "Th 12:30-15:00",
    "Th 19:00-23:59",
    "Fr 12:30-15:00",
    "Fr 19:00-23:59",
    "Sa 12:30-15:00",
    "Sa 19:00-23:59",
    "Su 19:00-23:59",
  ],

  whatsapp: {
    defaultMessage:
      "Ciao ThePork! Vorrei prenotare un tavolo. Siamo in ___ persone, per il giorno ___ alle ___. Grazie!",
  },

  delivery: [
    { name: "Glovo", url: "#", active: false },
    { name: "Deliveroo", url: "#", active: false },
    { name: "Just Eat", url: "#", active: false },
    { name: "Uber Eats", url: "#", active: false },
  ],

  disclaimers: {
    coperto: "Coperto € 2,00",
    eventi: "Eventi musicali e sportivi € 3,00",
    aggiunte: "Aggiunte € 0,50 – 1,00",
    senzaLattosio: "Senza lattosio € 1,00",
    impastoNapoletano: "Impasto napoletano € 1,00",
  },
} as const;

export const whatsappUrl = (message?: string) => {
  const text = encodeURIComponent(message ?? siteConfig.whatsapp.defaultMessage);
  return `https://wa.me/${siteConfig.contact.phoneDigits}?text=${text}`;
};

export const telUrl = `tel:${siteConfig.contact.phoneDigits.startsWith("+") ? siteConfig.contact.phoneDigits : "+" + siteConfig.contact.phoneDigits}`;

export type SiteConfig = typeof siteConfig;
