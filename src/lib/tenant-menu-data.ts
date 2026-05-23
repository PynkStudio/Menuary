import { menu as beporkMenu, type MenuCategory, type PriceFormat } from "./menu-data";

const s = (value: number): PriceFormat => ({ kind: "single", value });

export const faakMenu: MenuCategory[] = [
  {
    id: "faak-mattina",
    title: "FAAK la mattina",
    subtitle: "Caffe, forno, cose vive",
    description: "Una colazione che non sembra uscita da un template.",
    items: [
      {
        id: "faak-croissant",
        name: "Croissant e crema",
        description: "Sfoglia, crema del giorno e caffe come si deve.",
        price: s(4.5),
        tags: ["firma"],
        image: "/faak/mattina.png",
      },
      {
        id: "faak-pane-burro",
        name: "Pane, burro, confettura",
        description: "Pane tostato, burro montato e confettura stagionale.",
        price: s(6),
        image: "/faak/fire-bread.png",
      },
      {
        id: "faak-uova",
        name: "Uova, pane e fuoco",
        description: "Uova morbide, pane caldo, olio buono e un taglio netto.",
        price: s(9),
        tags: ["novita"],
      },
    ],
  },
  {
    id: "faak-giorno",
    title: "FAAK il giorno",
    subtitle: "Pranzo senza posa",
    description: "Piatti diretti, vegetali, brace e padella.",
    items: [
      {
        id: "faak-padella",
        name: "Padella del giorno",
        description: "Verdure, fondo, erbe e quello che il mercato ha deciso.",
        price: s(14),
        tags: ["firma", "veg"],
        image: "/faak/giorno.png",
      },
      {
        id: "faak-pane-fuoco",
        name: "Fuoco e pane senza padrone",
        description: "Pane, brace, fermenti e materia naturale.",
        price: s(12),
        tags: ["firma"],
        image: "/faak/fire-bread.png",
      },
      {
        id: "faak-piatto-viviana",
        name: "Piatto Viviana",
        description: "Una portata manifesto: essenziale, colorata, non addomesticata.",
        price: s(18),
        image: "/faak/chef.png",
      },
    ],
  },
  {
    id: "faak-aperitivo",
    title: "FAAK da bere",
    subtitle: "Vino, cocktail, ribellione naturale",
    items: [
      {
        id: "faak-calice",
        name: "Calice naturale",
        description: "Rotazione di vini vivi, scelti per non stare zitti.",
        price: s(7),
        tags: ["firma"],
        image: "/faak/aperitivo.png",
      },
      {
        id: "faak-spritz",
        name: "Spritz FAAK",
        description: "Amaro, agrume, bolle e niente posa.",
        price: s(9),
        image: "/faak/aperitivo.png",
      },
      {
        id: "faak-stuzzichi",
        name: "Stuzzichi occupa-tavolo",
        description: "Assaggi dalla cucina, pane, salse e cose da condividere.",
        price: s(13),
        tags: ["novita"],
      },
    ],
  },
  {
    id: "faak-sera",
    title: "FAAK la sera",
    subtitle: "Cena e santapazienza",
    items: [
      {
        id: "faak-menu-sera",
        name: "Menu della sera",
        description: "Percorso compatto dalla cucina, pensato per il tavolo intero.",
        price: s(38),
        tags: ["firma"],
      },
      {
        id: "faak-vino-sera",
        name: "Abbina il vino",
        description: "Tre calici in accompagnamento, naturali e non ornamentali.",
        price: s(20),
      },
    ],
  },
];

export const docaMenu: MenuCategory[] = [
  {
    id: "pane",
    title: "Pane",
    subtitle: "Lievitazione naturale, farine vive",
    description:
      "Una carta corta da forno di quartiere: pane quotidiano, pani speciali e pezzi legati alla memoria brasiliana.",
    items: [
      {
        id: "doca-pao-colonia",
        name: "Pão da colônia",
        description:
          "Pane bianco in cassetta di origine italo-brasiliana, mollica fitta e profumo da colazione.",
        price: s(7),
        tags: ["firma"],
        image: "/doca/pane-bancone.jpg",
      },
      {
        id: "doca-pane-semi-integrale",
        name: "Pane semi-integrale",
        description:
          "Lievitazione naturale, crosta sottile e farine piemontesi del Mulino Viva.",
        price: s(6.5),
        image: "/doca/pane-scaffale.jpg",
      },
      {
        id: "doca-pane-semi",
        name: "Pane ai semi",
        description:
          "Pagnotta con semi tostati, pensata per casa e per accompagnare una colazione salata.",
        price: s(7.5),
        image: "/doca/pane-scaffale.jpg",
      },
    ],
  },
  {
    id: "dolci",
    title: "Dolci brasiliani",
    subtitle: "Guava, mais, carote, manioca",
    description:
      "Niente croissant di repertorio: dolci da banco con ingredienti brasiliani e mano da pasticceria contemporanea.",
    items: [
      {
        id: "doca-pao-queijo",
        name: "Pão de queijo",
        description:
          "Amido di manioca e formaggio Branzi. Caldo, elastico, da mangiare appena uscito.",
        price: s(2.5),
        tags: ["firma"],
        image: "/doca/pao-de-queijo.jpg",
      },
      {
        id: "doca-torta-mais-guava",
        name: "Torta di mais con guava",
        description:
          "Farina di mais italiana, ricotta fresca e confettura di guava fatta in casa.",
        price: s(4.5),
        tags: ["firma"],
        image: "/doca/torta-mais.jpg",
      },
      {
        id: "doca-bolo-cenoura",
        name: "Torta di carote & ganache",
        description:
          "Il bolo de cenoura brasiliano, con ganache al cioccolato fondente.",
        price: s(4.5),
        image: "/doca/dolci.jpg",
      },
      {
        id: "doca-cookie-amazzonia",
        name: "Cookie noci dell'Amazzonia",
        description:
          "Cookie morbido con noci dell'Amazzonia: tostato, essenziale, non decorativo.",
        price: s(3),
        image: "/doca/dolci.jpg",
      },
    ],
  },
  {
    id: "caffe",
    title: "Caffè",
    subtitle: "Cafezal e tempi piu lenti",
    description:
      "Espresso italiano e filtro brasiliano, per tenere insieme il gesto veloce e quello conviviale.",
    items: [
      {
        id: "doca-caffe-filtro",
        name: "Caffè filtro Cafezal",
        description:
          "Singola piantagione brasiliana, tazza morbida e dolce, servita senza fretta.",
        price: s(3.5),
        tags: ["firma"],
        image: "/doca/caffe-filtro.jpg",
      },
      {
        id: "doca-espresso",
        name: "Espresso",
        description:
          "Il gesto italiano del banco, con una miscela brasiliana scelta per Doca.",
        price: s(1.5),
        image: "/doca/caffe-filtro.jpg",
      },
      {
        id: "doca-cappuccino",
        name: "Cappuccino",
        description:
          "Latte montato fine e caffè morbido. Da abbinare a pão de queijo o torta di mais.",
        price: s(2.5),
      },
    ],
  },
];

export const officinaKamMenu: MenuCategory[] = [
  {
    id: "moto",
    title: "Moto",
    subtitle: "Tagliandi, freni, pneumatici e sospensioni",
    description: "Listino indicativo per moto stradali, naked, touring e scooter.",
    items: [
      {
        id: "m-tagl",
        name: "Tagliando completo moto",
        description: "Olio, filtri, controllo livelli, freni e serraggi principali.",
        price: s(120),
        tags: ["firma"],
      },
      {
        id: "m-pneu",
        name: "Cambio pneumatici coppia",
        description: "Montaggio, equilibratura e controllo valvole.",
        price: s(60),
      },
      {
        id: "m-fren",
        name: "Pastiglie freno + spurgo",
        description: "Intervento su anteriore o posteriore, esclusi ricambi speciali.",
        price: s(95),
      },
      {
        id: "m-fork",
        name: "Revisione forcelle",
        description: "Smontaggio, paraoli, raschia-polvere e olio idraulico.",
        price: s(240),
      },
      {
        id: "m-cat",
        name: "Kit catena, pignone e corona",
        description: "Sostituzione trasmissione con kit originale o equivalente.",
        price: s(180),
      },
    ],
  },
  {
    id: "auto",
    title: "Auto",
    subtitle: "Manutenzione ordinaria e straordinaria",
    description: "Interventi comuni su benzina, diesel, GPL e ibride leggere.",
    items: [
      {
        id: "a-tagl",
        name: "Tagliando completo",
        description: "Olio sintetico, quattro filtri e check sicurezza.",
        price: s(160),
        tags: ["firma"],
      },
      {
        id: "a-fren",
        name: "Pastiglie + dischi anteriori",
        description: "Ricambi equivalenti certificati, manodopera inclusa.",
        price: s(220),
      },
      {
        id: "a-dist",
        name: "Sostituzione distribuzione",
        description: "Cinghia, tendicinghia e pompa acqua dove prevista.",
        price: s(480),
      },
      {
        id: "a-clima",
        name: "Sanificazione clima + gas",
        description: "Ricarica R134a o R1234yf e trattamento igienizzante.",
        price: s(85),
      },
      {
        id: "a-amm",
        name: "Ammortizzatori coppia",
        description: "Intervento su assale anteriore o posteriore.",
        price: s(260),
      },
    ],
  },
  {
    id: "diagnostica",
    title: "Diagnostica",
    subtitle: "OBD, centraline e service reset",
    description: "Controlli elettronici e test rapidi per individuare il problema.",
    items: [
      {
        id: "d-obd",
        name: "Diagnosi OBD completa",
        description: "Lettura errori, report e cancellazione anomalie risolte.",
        price: s(35),
        tags: ["firma"],
      },
      {
        id: "d-reset",
        name: "Service reset",
        description: "Azzeramento spia tagliando dopo manutenzione documentata.",
        price: s(20),
      },
      {
        id: "d-batt",
        name: "Test batteria + alternatore",
        description: "Controllo stato batteria, alternatore e cadute di tensione.",
        price: s(0),
      },
      {
        id: "d-air",
        name: "Codifica sensori o iniettori",
        description: "Configurazioni elettroniche a partire da diagnosi completata.",
        price: s(45),
      },
    ],
  },
];

export function getSeedMenuForTenant(tenantId: string): MenuCategory[] {
  if (tenantId === "faak") return faakMenu;
  if (tenantId === "doca") return docaMenu;
  if (tenantId === "officinakam") return officinaKamMenu;
  return beporkMenu;
}
