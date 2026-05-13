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

export function getSeedMenuForTenant(tenantId: string): MenuCategory[] {
  return tenantId === "faak" ? faakMenu : beporkMenu;
}
