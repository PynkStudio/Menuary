export type Review = {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date: string;
  isLocalGuide?: boolean;
  reviewsCount?: number;
  photosCount?: number;
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

export function getReviewsForTenant(tenantId: string): Review[] {
  return tenantId === "officinakam" ? officinaKamReviews : reviews;
}

export function getGoogleRatingForTenant(tenantId: string) {
  return tenantId === "officinakam" ? officinaKamGoogleRating : googleRating;
}
