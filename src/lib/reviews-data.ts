export type Review = {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date: string;
  isLocalGuide?: boolean;
  reviewsCount?: number;
  photosCount?: number;
  sourceLabel?: string;
};

export const reviews: Review[] = [
  {
    id: "vitale",
    author: "Francesco Vitale",
    rating: 5,
    text: "Se siete alla ricerca di un ottimo locale nel centro di Bari non cercate oltre. Menu ampio, atmosfera invitante, personale cordiale e attento. Non sono mai rimasto deluso.",
    date: "6 mesi fa",
    isLocalGuide: true,
    reviewsCount: 26,
    photosCount: 3520,
  },
  {
    id: "caso",
    author: "Antonella Caso",
    rating: 5,
    text: "A pranzo con gli studenti: li ho convinti ad evitare l'hamburger americano e sono rimasti soddisfattissimi di quelli italiani, abbondanti e squisiti. Ho preso un'assassina spettacolare!",
    date: "4 mesi fa",
    isLocalGuide: true,
    reviewsCount: 77,
    photosCount: 237,
  },
  {
    id: "scamarcia",
    author: "Cristian Scamarcia",
    rating: 5,
    text: "Esperienza positiva in tutto: panini di ottima qualità, prezzo nella media e servizio efficiente. Uno dei migliori panini che abbia mai provato.",
    date: "6 mesi fa",
    isLocalGuide: true,
    reviewsCount: 17,
    photosCount: 19,
  },
  {
    id: "berardi",
    author: "Francesco Berardi",
    rating: 4,
    text: "Ottimo pub per passare una serata diversa, cibo molto particolare ed abbondante di alta qualità. Personale gentile. Conto giustificato dai suoi piatti.",
    date: "3 mesi fa",
    isLocalGuide: true,
    reviewsCount: 47,
    photosCount: 28,
  },
];

export const googleRating = {
  average: 3.9,
  count: 1282,
  profileUrl:
    "https://www.google.com/maps/search/?api=1&query=Be+Pork+Via+Quintino+Sella+128+Bari",
};

export const officinaKamReviews: Review[] = [
  {
    id: "kam-bellini",
    author: "Marco Bellini",
    rating: 5,
    text:
      "Tagliando e revisione forcelle sulla mia Monster. Preventivo rispettato, lavoro pulito e spiegato con foto. Da oggi è la mia officina di fiducia.",
    date: "2 settimane fa",
    isLocalGuide: true,
    reviewsCount: 142,
    photosCount: 31,
  },
  {
    id: "kam-russo",
    author: "Giulia Russo",
    rating: 5,
    text:
      "Distribuzione e tagliando alla Golf. Mi hanno avvisata prima di ogni extra e l'auto era pronta nei tempi promessi.",
    date: "1 mese fa",
    reviewsCount: 18,
  },
  {
    id: "kam-cossu",
    author: "Andrea Cossu",
    rating: 5,
    text:
      "Spia motore risolta in mezz'ora dopo tre tentativi altrove. Diagnosi chiara, prezzo onesto e grande competenza sull'elettronica.",
    date: "1 mese fa",
    isLocalGuide: true,
    reviewsCount: 89,
  },
  {
    id: "kam-piras",
    author: "Luca Piras",
    rating: 5,
    text:
      "Restauro Vespa seguito passo passo. Mi hanno coinvolto su ricambi e finiture, risultato sopra le aspettative.",
    date: "2 mesi fa",
    reviewsCount: 7,
  },
];

export const officinaKamGoogleRating = {
  average: 4.9,
  count: 312,
  profileUrl:
    "https://www.google.com/maps/search/?api=1&query=Officina+KAM+Via+Bonfadini+71+Milano",
};

export const docaReviews: Review[] = [
  {
    id: "doca-lacucinaitaliana",
    author: "La Cucina Italiana",
    rating: 5,
    text:
      "Doca rifugge i cliché delle classiche bakery: niente croissant o cinnamon roll, ma pane, caffè Cafezal, guava fatta in casa e noci dell'Amazzonia.",
    date: "Marzo 2026",
    sourceLabel: "LCI",
  },
  {
    id: "doca-puntarella",
    author: "Puntarella Rossa",
    rating: 5,
    text:
      "Un piccolo forno internazionale, contemporaneo e familiare. Da provare torta di carote con ganache, torta di mais con guava e pão de queijo.",
    date: "Febbraio 2026",
    sourceLabel: "PR",
  },
  {
    id: "doca-virtu",
    author: "Virtù Quotidiane",
    rating: 5,
    text:
      "Nel quartiere Argonne, Doca è diventata una meta per chi considera il pane il protagonista della tavola: laboratorio di ricerca e bakery di quartiere.",
    date: "Aprile 2026",
    sourceLabel: "VQ",
  },
];

export const docaGoogleRating = {
  average: 5,
  count: 3,
  profileUrl:
    "https://www.google.com/maps/place/Doca+-+Pane,+Caff%C3%A8,+Saudade/@45.44248,9.2149812,17z/data=!3m1!4b1!4m6!3m5!1s0x4786c500463a3c21:0xab855fc6d4b925c3!8m2!3d45.44248!4d9.2149812!16s%2Fg%2F11ydc8s49q!18m1!1e1?entry=ttu",
};

export const juniorFoodReviews: Review[] = [
  {
    id: "jf-cecilia-romero",
    author: "Cecilia Romero",
    rating: 5,
    text:
      "Proprietario molto gentile e cordiale, cucina latinoamericana ottima e prezzi convenienti.",
    date: "3 settimane fa",
    isLocalGuide: false,
  },
  {
    id: "jf-sandry-lopez",
    author: "Sandry Lopez",
    rating: 4,
    text:
      "Tutto molto buono, porzioni abbondanti e camerieri gentili. Ambiente vivace.",
    date: "1 mese fa",
    isLocalGuide: false,
  },
  {
    id: "jf-vincenzo-semilia",
    author: "Vincenzo Semilia",
    rating: 5,
    text:
      "Ottimo cibo, locale pulito e prezzi molto bassi. Una tappa concreta per mangiare bene.",
    date: "2 mesi fa",
    isLocalGuide: false,
  },
];

export const juniorFoodGoogleRating = {
  average: 4.1,
  count: 29,
  profileUrl: "https://maps.app.goo.gl/BvAqtD8Tbs87TiHn6",
};

export const kimosReviews: Review[] = [
  {
    id: "kimos-thomas-fischer",
    author: "Thomas Fischer",
    rating: 5,
    text: "Excellent kebab in Santa Giulia.",
    date: "8 mesi fa",
    isLocalGuide: true,
    reviewsCount: 52,
    photosCount: 3,
  },
  {
    id: "kimos-stef",
    author: "Stef",
    rating: 5,
    text:
      "Ottima esperienza! Tutti simpatici e il kebab è davvero buonissimo! Consiglio vivamente a tutti!",
    date: "2 mesi fa",
    isLocalGuide: true,
    reviewsCount: 8,
    photosCount: 3,
  },
  {
    id: "kimos-andrea-teotto",
    author: "Andrea Teotto",
    rating: 5,
    text: "Ottimo servizio. Personale cordiale e disponibile.",
    date: "1 mese fa",
    isLocalGuide: true,
    reviewsCount: 24,
    photosCount: 25,
  },
];

export const kimosGoogleRating = {
  average: 3.9,
  count: 327,
  profileUrl: "https://maps.app.goo.gl/55BuJJ4iMh6ZWqrs7",
};

export const nomSushiReviews: Review[] = [
  {
    id: "nom-martina-rosso",
    author: "Martina Rosso",
    rating: 5,
    text:
      "Formula all you can eat chiara, servizio rapido e roll curati. Ho apprezzato soprattutto gunkan e nigiri scottati.",
    date: "3 settimane fa",
    isLocalGuide: true,
    reviewsCount: 41,
  },
  {
    id: "nom-lorenzo-campi",
    author: "Lorenzo Campi",
    rating: 5,
    text:
      "Aperisushi comodo prima di uscire in centro: drink, edamame e sushi misto senza appesantire. Locale piccolo ma molto piacevole.",
    date: "1 mese fa",
    reviewsCount: 18,
  },
  {
    id: "nom-chiara-lauro",
    author: "Chiara Lauro",
    rating: 4,
    text:
      "Carta lunga ma ordinata, con allergeni leggibili e piatti fusion interessanti. Cena riuscita, tornerò per provare i Nøm Specials.",
    date: "2 mesi fa",
    isLocalGuide: true,
    reviewsCount: 73,
  },
  {
    id: "nom-paolo-venturi",
    author: "Paolo Venturi",
    rating: 5,
    text:
      "Ottimo rapporto qualità prezzo a pranzo. Dim sum buoni, salmone fresco e personale presente anche con sala piena.",
    date: "2 mesi fa",
    reviewsCount: 12,
  },
];

export const nomSushiGoogleRating = {
  average: 4.4,
  count: 486,
  profileUrl:
    "https://www.google.com/maps/search/?api=1&query=N%C3%B8m+sushi+vibes+Salita+di+S.+Matteo+21+R+Genova",
};

export function getReviewsForTenant(tenantId: string): Review[] {
  if (tenantId === "nom-sushi") return nomSushiReviews;
  if (tenantId === "doca") return docaReviews;
  if (tenantId === "junior-food") return juniorFoodReviews;
  if (tenantId === "kimos") return kimosReviews;
  return tenantId === "officinakam" ? officinaKamReviews : reviews;
}

export function getGoogleRatingForTenant(tenantId: string) {
  if (tenantId === "nom-sushi") return nomSushiGoogleRating;
  if (tenantId === "doca") return docaGoogleRating;
  if (tenantId === "junior-food") return juniorFoodGoogleRating;
  if (tenantId === "kimos") return kimosGoogleRating;
  return tenantId === "officinakam" ? officinaKamGoogleRating : googleRating;
}
