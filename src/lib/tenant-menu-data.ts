import { menu as beporkMenu, type MenuCategory, type PriceFormat } from "./menu-data";
import type { MenuAllergen } from "./allergens";

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
        id: "doca-brigadeiros-sortidos",
        name: "Brigadeiros sortidos",
        description:
          "Piccoli dolci brasiliani in pirottino: cacao, pistacchio e varianti da banco secondo produzione.",
        price: s(2.5),
        tags: ["novita"],
        image: "/doca/brigadeiros.jpg",
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

const jfPiqueImage =
  "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=900&q=85";
const jfGrillImage =
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=85";
const jfSoupImage =
  "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85";
const jfRiceImage =
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=85";
const jfTableImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85";

export const juniorFoodMenu: MenuCategory[] = [
  {
    id: "piatti-boliviani",
    title: "Piatti boliviani",
    subtitle: "Dalla carta Junior Food",
    description:
      "Piatti completi, sapori decisi e porzioni generose ispirate alle ricette boliviane.",
    items: [
      {
        id: "jf-pique-macho",
        name: "Pique Macho",
        description: "Manzo, salsicce, cipolla, pomodori, paprika, uova e patate.",
        price: s(15),
        tags: ["firma"],
        image: jfPiqueImage,
      },
      {
        id: "jf-sopa-de-mani",
        name: "Sopa de Mani",
        description: "Arachidi, manzo e patate.",
        price: s(6),
        tags: ["novita"],
        image: jfSoupImage,
      },
      {
        id: "jf-tripitas",
        name: "Tripitas",
        description: "Trippa di manzo, granello, manioca e patate.",
        price: s(10),
        image: jfTableImage,
      },
      {
        id: "jf-lomo-salteado",
        name: "Lomo Salteado",
        description: "Manzo, riso, patate e piselli.",
        price: s(13),
        image: jfGrillImage,
      },
      {
        id: "jf-fideos-uchu",
        name: "Fideos Uchu",
        description:
          "Pasta, manzo, piselli, patate, fagioli, pomodoro, cipolla e carota.",
        price: s(10),
        image: jfSoupImage,
      },
      {
        id: "jf-planchita",
        name: "Planchita",
        description:
          "Costata di manzo, cipolla, pomodoro, salsiccia, pollo, uovo e manioca.",
        price: s(25),
        tags: ["firma"],
        image: jfGrillImage,
      },
      {
        id: "jf-silpancho",
        name: "Silpancho",
        description:
          "Manzo impanato, riso, cipolla, pomodoro, patatine fritte e paprika.",
        price: s(12),
        image: jfRiceImage,
      },
      {
        id: "jf-fricase",
        name: "Fricase",
        description: "Carne di maiale, chuño, mais e pangrattato.",
        price: s(12),
        tags: ["piccante"],
        image: jfTableImage,
      },
      {
        id: "jf-majadito",
        name: "Majadito",
        description: "Riso, uovo, banana e pollo.",
        price: s(8),
        image: jfRiceImage,
      },
      {
        id: "jf-picante-mixto",
        name: "Picante Mixto",
        description:
          "Pollo, riso, lingua di manzo, pomodoro, cipolla, patate, piselli e salsa piccante.",
        price: s(13),
        tags: ["piccante"],
        image: jfTableImage,
      },
    ],
  },
  {
    id: "carni-e-pollo",
    title: "Carni e pollo",
    subtitle: "Griglia, broaster e spiedo",
    description:
      "Tagli alla griglia, pollo croccante e ricette sostanziose per pranzo e cena.",
    items: [
      {
        id: "jf-caldo-mixto",
        name: "Caldo Mixto",
        description:
          "Criadillas di toro, coscia di manzo, pollo, agnello, uova, riso, patate, carote, rape ed erba cipollina.",
        price: s(12),
        image: jfSoupImage,
      },
      {
        id: "jf-rinon-al-jugo",
        name: "Riñón al Jugo",
        description: "Rene, patate e cipolla.",
        price: s(10),
        image: jfTableImage,
      },
      {
        id: "jf-pollo-canasta",
        name: "Pollo a la Canasta",
        description: "Pollo, banana e patate fritte.",
        price: s(13),
        image: jfGrillImage,
      },
      {
        id: "jf-pollo-broaster",
        name: "Pollo a la Broaster",
        description: "Pollo, riso, banana e patate fritte.",
        price: s(13),
        image: jfPiqueImage,
      },
      {
        id: "jf-chuleta-de-res",
        name: "Chuleta de Res",
        description: "Chuleta di manzo, riso e patate fritte.",
        price: s(13),
        image: jfGrillImage,
      },
      {
        id: "jf-lapping",
        name: "Lapping",
        description: "Carne, cipolla, fagioli, patate, formaggio e pomodoro.",
        price: s(15),
        tags: ["firma"],
        image: jfTableImage,
      },
      {
        id: "jf-pollo-al-spiedo",
        name: "Pollo al Spiedo",
        description: "Pollo spiedato, riso, tagliatelle, banana e patatine.",
        price: s(15),
        image: jfRiceImage,
      },
    ],
  },
  {
    id: "tradizionali-della-casa",
    title: "Tradizionali della casa",
    subtitle: "Piatti andini e specialita complete",
    description:
      "Ricette di carne, pollo e mais con ingredienti tipici della cucina sudamericana.",
    items: [
      {
        id: "jf-charque",
        name: "Charque",
        description:
          "Carne di manzo essiccata, patate, mais bollito, uova, cipolle e pomodoro.",
        price: s(13),
        image: jfRiceImage,
      },
      {
        id: "jf-sajta-de-pollo",
        name: "Sajta de Pollo",
        description:
          "Pollo, patate grandi, peperone giallo, piselli, cipolle, arachidi, pomodoro e locoto.",
        price: s(10),
        tags: ["piccante"],
        image: jfPiqueImage,
      },
      {
        id: "jf-pampaku-mixto",
        name: "Pampaku Mixto",
        description: "Maiale, agnello, pollo, anatra e cipolle.",
        price: s(18),
        tags: ["firma"],
        image: jfGrillImage,
      },
      {
        id: "jf-chuleta-de-cerdo",
        name: "Chuleta de Cerdo",
        description: "Braciola di maiale, riso, lattuga e carota.",
        price: s(10),
        image: jfGrillImage,
      },
      {
        id: "jf-anticucho",
        name: "Anticucho",
        description:
          "Cuore di manzo, patate bollite, mais e salsa chili con cipolla cinese.",
        price: s(10),
        tags: ["piccante"],
        image: jfTableImage,
      },
      {
        id: "jf-aji-de-lengua",
        name: "Ají de Lengua",
        description:
          "Lingua di manzo, riso, pomodoro, cipolla, sedano, salsa piccante e patate.",
        price: s(10),
        tags: ["piccante"],
        image: jfSoupImage,
      },
      {
        id: "jf-chajchu",
        name: "Chajchu",
        description:
          "Lombo di pollo, cipolla, carota, patate, chuños, uova, formaggio e locoto.",
        price: s(10),
        tags: ["piccante"],
        image: jfPiqueImage,
      },
      {
        id: "jf-picana",
        name: "Picaña",
        description: "Carne di manzo premium, patate fritte e riso.",
        price: s(15),
        tags: ["firma"],
        image: jfGrillImage,
      },
      {
        id: "jf-escabeche",
        name: "Escabeche",
        description: "Suino marinato, pomodoro, cipolla, carote e mais.",
        price: s(15),
        image: jfRiceImage,
      },
      {
        id: "jf-chicharron-de-cerdo",
        name: "Chicharrón de Cerdo",
        description: "Maiale, patate, choclo, mote morado e chorizo.",
        price: s(15),
        tags: ["firma"],
        image: jfTableImage,
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

// ── Nøm sushi vibes (Genova) ────────────────────────────────────────────────
// Fasce orarie: pranzo 12:00–15:00 (AYCE 18,90 €), aperisushi 19:00–21:00,
// cena 19:00–23:30 (AYCE 32,90 €). Le categorie qui sotto usano `availability`
// con label e finestra oraria; le categorie con set di items diverso fra pranzo
// e cena vengono separate (es. NØM CRUDITÉ è solo cena).
const NOM_DINNER = { label: "Cena", from: "19:00", to: "23:30" } as const;
const NOM_ALL = { label: "Pranzo & cena", from: "12:00", to: "23:30" } as const;

const a = (...keys: MenuAllergen[]) => keys; // shortcut leggibilità

export const nomSushiMenu: MenuCategory[] = [
  // Le formule AYCE NON sono qui — vivono in `tenant-dining-formulas.ts` come
  // modalità di pasto separata, non come prodotti menu. I piatti hanno prezzo 0
  // perché inclusi nella formula attiva (Nøm non vende à la carte).

  // ── ANTIPASTI (pranzo + cena) ──────────────────────────────────────────────
  {
    id: "antipasti",
    title: "Antipasti",
    subtitle: "Vapore, fritti, dim sum classici",
    availability: NOM_ALL,
    items: [
      { id: "ant-involtini-primavera", name: "Involtini di primavera (2 pz)", description: "Involtino fritto ripieno di cavolo cappuccino, carote e cipolla.", price: s(0), allergens: a("glutine") },
      { id: "ant-involtini-gamberi", name: "Involtini di gamberi (3 pz)", description: "Involtini fritti di gamberi serviti con salsa cocktail.", price: s(0), allergens: a("glutine", "crostacei", "uova") },
      { id: "ant-edamame", name: "Edamame", description: "Fagioli di soia.", price: s(0), tags: ["veg"], allergens: a("soia") },
      { id: "ant-alghe-wakame", name: "Alghe wakame", description: "Alghe giapponesi.", price: s(0), tags: ["veg"], allergens: a("sesamo") },
      { id: "ant-ravioli-carne", name: "Ravioli di carne (3 pz)", description: "Ravioli ripieni di carne suina e cavolo cinese.", price: s(0), allergens: a("glutine", "soia") },
      { id: "ant-ravioli-shaomai", name: "Ravioli shaomai (3 pz)", description: "Ravioli ripieni di gamberi, lardello e carote.", price: s(0), allergens: a("glutine", "crostacei", "soia") },
      { id: "ant-gyoza-griglia", name: "Gyoza alla griglia (3 pz)", description: "Ravioli grigliati ripieni di carne suina e cavolo cinese.", price: s(0), allergens: a("glutine", "soia") },
      { id: "ant-gyoza-hot", name: "Gyoza hot (3 pz)", description: "Ravioli fritti ripieni di carne di pollo e cipolle, serviti con jalapeño.", price: s(0), tags: ["piccante"], allergens: a("glutine", "soia") },
      { id: "ant-gyoza-fritti", name: "Gyoza fritti (3 pz)", description: "Ravioli fritti ripieni di carne di pollo e cipolle.", price: s(0), allergens: a("glutine", "soia") },
      { id: "ant-bao-sarpi", name: "Bao Sarpi (3 pz)", description: "Bao ripieno di carne di maiale e cavolo cinese.", price: s(0), allergens: a("glutine", "soia") },
      { id: "ant-pane-vapore", name: "Pane vapore (2 pz)", description: "Pane cinese al vapore senza ripieno.", price: s(0), tags: ["veg"], allergens: a("glutine", "latte") },
      { id: "ant-pane-dolce", name: "Pane dolce (2 pz)", description: "Panino cinese al vapore al latte con ripieno di crema di uova.", price: s(0), allergens: a("glutine", "uova", "latte") },
      { id: "ant-nuvole-drago", name: "Nuvole di drago", description: "Sfoglie fritte a base di farina di tapioca e crostacei.", price: s(0), allergens: a("glutine", "crostacei") },
    ],
  },

  // ── INSALATE ───────────────────────────────────────────────────────────────
  {
    id: "insalate",
    title: "Insalate",
    subtitle: "Verde misto e topping a crudo",
    availability: NOM_ALL,
    items: [
      { id: "ins-polpo", name: "Insalata polpo", description: "Insalata verde mista con polpo, grana e condita.", price: s(0), allergens: a("glutine", "uova", "soia", "sesamo", "molluschi") },
      { id: "ins-gamberi", name: "Insalata gamberi", description: "Insalata verde mista con gamberi, uova e condita.", price: s(0), allergens: a("glutine", "crostacei", "uova", "soia", "sesamo") },
      { id: "ins-sashimi", name: "Insalata sashimi", description: "Insalata verde mista con pesce crudo, condita. Solo cena.", price: s(0), allergens: a("glutine", "uova", "pesce", "soia", "sesamo") },
    ],
  },

  // ── NØM SPECIALS ──────────────────────────────────────────────────────────
  {
    id: "nom-specials",
    title: "Nøm Specials",
    subtitle: "Limite scelta 2 a pranzo · 3 a cena",
    availability: NOM_ALL,
    items: [
      { id: "ns-toast-gamberi", name: "Toast di gamberi", description: "Tramezzini fritti ripieno di gambero e salsa cocktail. Solo cena.", price: s(0), allergens: a("glutine", "crostacei", "uova") },
      { id: "ns-chupa-gamberi", name: "Chupa chups gamberi (2 pz)", description: "Polpette fritte di gambero con salsa cocktail.", price: s(0), allergens: a("glutine", "crostacei", "uova") },
      { id: "ns-chupa-salmone", name: "Chupa chups salmone (2 pz)", description: "Polpette fritte di salmone con philadelphia e salsa teriyaki.", price: s(0), allergens: a("glutine", "uova", "pesce", "soia", "latte") },
      { id: "ns-purea-capesante", name: "Purea capesante", description: "Capesanta cotta servita con purea di patate e salsa teriyaki. Solo cena.", price: s(0), allergens: a("glutine", "soia", "latte", "molluschi") },
      { id: "ns-mo-calamari", name: "Mo' calamari (1 pz)", description: "Hamburger con calamari fritti, iceberg, salsa teriyaki e maionese.", price: s(0), allergens: a("glutine", "uova", "soia", "sesamo", "molluschi") },
      { id: "ns-mo-manzo", name: "Mo' manzo (1 pz)", description: "Hamburger con manzo fritto, iceberg, salsa teriyaki e maionese.", price: s(0), tags: ["firma"], allergens: a("glutine", "uova", "soia", "sesamo") },
      { id: "ns-tempura-picanha", name: "Tempura picanha", description: "Spiedini di picanha fritti in tempura. Solo cena.", price: s(0), allergens: a("glutine", "soia") },
      { id: "ns-picanha-piastra", name: "Picanha piastra", description: "Picanha alla griglia. Solo cena.", price: s(0), allergens: a("glutine", "soia") },
    ],
  },

  // ── DIM SUM ────────────────────────────────────────────────────────────────
  {
    id: "dimsum",
    title: "Dim sum",
    subtitle: "Limite scelta 1 a pranzo · 2 a cena · 3 pezzi a porzione",
    availability: NOM_ALL,
    items: [
      { id: "dim-gamberi", name: "Dim sum gamberi", description: "Ravioli ripieno di gamberi.", price: s(0), allergens: a("glutine", "crostacei", "soia") },
      { id: "dim-chashao", name: "Dim sum chashao", description: "Ravioli ripieni di chashao (maiale arrosto).", price: s(0), allergens: a("glutine", "soia") },
      { id: "dim-manzo", name: "Dim sum manzo", description: "Ravioli ripieno di manzo.", price: s(0), allergens: a("glutine", "soia") },
      { id: "dim-verdure", name: "Dim sum verdure", description: "Ravioli ripieni di spinaci e verdure.", price: s(0), tags: ["veg"], allergens: a("glutine", "soia") },
      { id: "dim-calamari", name: "Dim sum calamari", description: "Ravioli ripieno di calamaro.", price: s(0), allergens: a("glutine", "soia", "molluschi") },
    ],
  },

  // ── NØM CRUDITÉ (solo cena) ────────────────────────────────────────────────
  {
    id: "nom-crudite",
    title: "Nøm Crudité",
    subtitle: "Solo cena · limite scelta 3",
    availability: NOM_DINNER,
    items: [
      { id: "cr-carp-capesante", name: "Carpaccio capesante", description: "Carpaccio capesante in salsa ponzu e lime, con erba cipollina e fragole fresche.", price: s(0), allergens: a("glutine", "soia", "molluschi") },
      { id: "cr-carp-hawaii", name: "Carpaccio Hawaii", description: "Carpaccio pesce misto in salsa ponzu con crema di basilico, servito con arancia e uova di tobiko.", price: s(0), allergens: a("glutine", "pesce", "soia") },
      { id: "cr-gambero-rosso", name: "Gambero rosso", description: "Gambero rosso su un letto di stracciatella in salsa ponzu, servito con kizami wasabi.", price: s(0), tags: ["firma"], allergens: a("glutine", "crostacei", "soia", "latte") },
      { id: "cr-golden-tataki", name: "Golden tataki", description: "Salmone scottato in salsa mango, guarnito con oro alimentare.", price: s(0), allergens: a("glutine", "pesce") },
      { id: "cr-lo-scampo", name: "Lo scampo (limite 1)", description: "Scampo in salsa ponzu, passion fruit e lime.", price: s(0), allergens: a("glutine", "crostacei") },
      { id: "cr-polpo-flambe", name: "Polpo flambé (limite 1)", description: "Polpo cotto con purea di patate, parmigiano e salsa barbecue della casa.", price: s(0), tags: ["firma"], allergens: a("glutine", "soia", "latte", "molluschi") },
    ],
  },

  // ── FINGER FOOD ────────────────────────────────────────────────────────────
  {
    id: "finger-food",
    title: "Finger food",
    subtitle: "Limite scelta 2 a pranzo · 3 a cena · 2 pezzi a porzione",
    availability: NOM_ALL,
    items: [
      { id: "ff-nori-salmone", name: "Nori salmone", description: "Sfoglie di alga nori fritte, ripiene di salmone crudo, erba cipollina, philadelphia, salsa tartufo e spicy.", price: s(0), tags: ["piccante"], allergens: a("glutine", "pesce", "soia") },
      { id: "ff-nori-tonno", name: "Nori tonno", description: "Sfoglie di alga nori fritte, ripiene di tonno crudo, erba cipollina, philadelphia e salsa teriyaki. Solo cena.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte") },
      { id: "ff-sfoglia-peppa", name: "Sfoglia peppa", description: "Sfoglie fritte, ripiene di pork floss, erba cipollina, philadelphia e salsa teriyaki.", price: s(0), allergens: a("glutine", "soia", "latte") },
      { id: "ff-sfoglia-salmone", name: "Sfoglia salmone", description: "Sfoglie fritte, ripiene di salmone crudo, erba cipollina, philadelphia, salsa teriyaki.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte") },
      { id: "ff-pani-puri-salmone", name: "Pani puri salmone", description: "Palline di pane fritto farciti con purea di patate, tartara di salmone, erba cipollina, philadelphia e salsa teriyaki.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte") },
      { id: "ff-pani-puri-ebiten", name: "Pani puri ebiten", description: "Palline di pane fritto farciti con purea di patate, tempura di gamberi, erba cipollina e salsa teriyaki.", price: s(0), allergens: a("glutine", "crostacei", "soia", "latte") },
      { id: "ff-pani-puri-gamberone", name: "Pani puri gamberone", description: "Palline di pane fritto farciti con purea di patate, tartara di gamberone, erba cipollina e salsa passion fruit. Solo cena.", price: s(0), allergens: a("glutine", "crostacei", "soia", "latte") },
    ],
  },

  // ── TACOS ──────────────────────────────────────────────────────────────────
  {
    id: "tacos",
    title: "Tacos",
    subtitle: "Limite scelta 2 · 1 pezzo a porzione",
    availability: NOM_ALL,
    items: [
      { id: "tc-tapas-pesto", name: "Tapas pesto", description: "Tacos fritto con ripieno di riso, pesto, rucola, pomodorini e grana.", price: s(0), tags: ["veg"], allergens: a("glutine") },
      { id: "tc-salmone", name: "Tacos salmone", description: "Tacos fritto con ripieno di riso, salmone crudo, avocado, philadelphia e salsa teriyaki. Solo cena.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte") },
      { id: "tc-surimi", name: "Tacos surimi", description: "Tacos fritto con ripieno di riso, surimi, avocado, philadelphia e salsa teriyaki.", price: s(0), allergens: a("glutine", "crostacei", "pesce", "soia", "latte") },
      { id: "tc-peppa", name: "Tacos peppa", description: "Tacos fritto con ripieno di riso, pork floss e salsa cocktail.", price: s(0), allergens: a("glutine", "uova") },
      { id: "tc-nori-choo-salmone", name: "Nori choo salmone", description: "Alga nori servito con riso bianco, salmone cotto, alghe wakame, mozzarella e semi di sesamo.", price: s(0), allergens: a("glutine", "pesce", "latte", "sesamo") },
      { id: "tc-nori-choo-pollo", name: "Nori choo pollo", description: "Alga nori servito con riso bianco, pollo fritto, alghe wakame, mozzarella e semi di sesamo.", price: s(0), allergens: a("glutine", "uova", "latte", "sesamo") },
    ],
  },

  // ── TAPAS ──────────────────────────────────────────────────────────────────
  {
    id: "tapas",
    title: "Tapas",
    subtitle: "2 pezzi a porzione",
    availability: NOM_ALL,
    items: [
      { id: "tp-salmone", name: "Tapas salmone", description: "Pane tostato farcito con tartara di salmone, erba cipollina, philadelphia e salsa teriyaki.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte") },
      { id: "tp-branzino", name: "Tapas branzino", description: "Pane tostato farcito con tartara di branzino, erba cipollina, philadelphia e salsa teriyaki. Solo cena.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte") },
      { id: "tp-gamberone", name: "Tapas gamberone", description: "Pane tostato farcito con tartara di gamberone, erba cipollina, philadelphia e salsa tartufo. Solo cena.", price: s(0), allergens: a("glutine", "crostacei", "soia", "latte") },
      { id: "tp-pure", name: "Tapas puré", description: "Pane tostato farcito con puré di patate, erba cipollina, philadelphia e salsa teriyaki.", price: s(0), tags: ["veg"], allergens: a("glutine", "soia", "latte") },
    ],
  },

  // ── BOWLS ──────────────────────────────────────────────────────────────────
  {
    id: "bowls",
    title: "Bowls",
    subtitle: "Riso bianco o venere",
    availability: NOM_ALL,
    items: [
      { id: "bw-chirashi-salmone", name: "Chirashi salmone", description: "Ciotola di riso con salmone crudo.", price: s(0), allergens: a("pesce", "sesamo") },
      { id: "bw-cirashi-nom", name: "Cirashi Nøm", description: "Ciotola di riso con pesce misto scottato, salsa teriyaki e salsa spicy.", price: s(0), tags: ["piccante"], allergens: a("glutine", "pesce", "soia", "sesamo") },
      { id: "bw-poke-mango-venere", name: "Poke mango venere", description: "Ciotola di riso venere con salmone crudo, pistacchio, mango, salsa teriyaki e salsa mango.", price: s(0), allergens: a("glutine", "pesce", "soia", "frutta_guscio") },
      { id: "bw-poke-misto-spicy", name: "Poke misto spicy", description: "Ciotola di riso venere con pesce crudo misto e salsa spicy.", price: s(0), tags: ["piccante"], allergens: a("pesce", "sesamo") },
    ],
  },

  // ── ONIGIRI ────────────────────────────────────────────────────────────────
  {
    id: "onigiri",
    title: "Onigiri",
    subtitle: "1 pezzo a porzione",
    availability: NOM_ALL,
    items: [
      { id: "on-ebiten", name: "Onigiri ebiten", description: "Triangolo di riso avvolto da alga nori, con tempura di gamberi, kataifi, salsa teriyaki e maionese.", price: s(0), allergens: a("glutine", "crostacei", "uova", "soia", "sesamo") },
      { id: "on-salmone", name: "Onigiri salmone", description: "Triangolo di riso avvolto da alga nori, con salmone cotto, philadelphia, scaglie di mandorla e salsa teriyaki.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte", "frutta_guscio", "sesamo") },
      { id: "on-pollo", name: "Onigiri pollo", description: "Triangolo di riso avvolto da alga nori, con pollo fritto, philadelphia, cipolla croccante e salsa teriyaki.", price: s(0), allergens: a("glutine", "soia", "latte", "sesamo") },
      { id: "on-hot", name: "Onigiri hot", description: "Triangolo di riso avvolto da alga nori, con salmone cotto, philadelphia, salsa teriyaki e spicy mayo.", price: s(0), tags: ["piccante"], allergens: a("glutine", "uova", "pesce", "soia", "latte", "sesamo") },
    ],
  },

  // ── NIGIRI ─────────────────────────────────────────────────────────────────
  {
    id: "nigiri",
    title: "Nigiri",
    subtitle: "2 pezzi a porzione · 3 pz per il Nøm",
    availability: NOM_ALL,
    items: [
      { id: "ng-salmone", name: "Nigiri salmone", description: "Polpetta di riso con salmone.", price: s(0), allergens: a("pesce") },
      { id: "ng-tonno", name: "Nigiri tonno", description: "Polpetta di riso con tonno. Solo cena.", price: s(0), allergens: a("pesce") },
      { id: "ng-ebi", name: "Nigiri ebi", description: "Polpetta di riso con gambero cotto.", price: s(0), allergens: a("crostacei") },
      { id: "ng-avocado", name: "Nigiri avocado", description: "Polpetta di riso con avocado.", price: s(0), tags: ["veg"] },
      { id: "ng-branzino", name: "Nigiri branzino", description: "Polpetta di riso con branzino crudo.", price: s(0), allergens: a("pesce") },
      { id: "ng-polpo", name: "Nigiri polpo", description: "Polpetta di riso con polpo.", price: s(0), allergens: a("molluschi") },
      { id: "ng-ventresca-spicy", name: "Nigiri ventresca spicy", description: "Polpetta di riso con ventresca di salmone scottato, erba cipollina e spicy mayo. Solo cena.", price: s(0), tags: ["piccante"], allergens: a("uova", "pesce") },
      { id: "ng-salmone-wasabi", name: "Nigiri salmone wasabi", description: "Polpetta di riso con salmone e kizami wasabi. Solo cena.", price: s(0), allergens: a("pesce") },
      { id: "ng-tonno-pistacchio", name: "Nigiri tonno pistacchio", description: "Polpetta di riso con tonno scottato, pistacchio e salsa teriyaki. Solo cena.", price: s(0), allergens: a("glutine", "pesce", "soia", "frutta_guscio") },
      { id: "ng-scottato-branzino", name: "Nigiri scottato branzino", description: "Polpetta di riso con branzino scottato, erba cipollina.", price: s(0), allergens: a("glutine", "pesce", "soia") },
      { id: "ng-scottato-philadelphia", name: "Nigiri scottato philadelphia", description: "Polpetta di riso con salmone scottato, philadelphia, kataifi e salsa teriyaki.", price: s(0), tags: ["firma"], allergens: a("glutine", "pesce", "soia", "latte") },
      { id: "ng-nom", name: "Nigiri Nøm (3 pz)", description: "Nigiri misto scottato con salmone, branzino e tonno, serviti con parmigiano, cipolla croccante e salsa spicy mayo.", price: s(0), tags: ["firma", "piccante"], allergens: a("glutine", "uova", "pesce", "soia") },
    ],
  },

  // ── GUNKAN ─────────────────────────────────────────────────────────────────
  {
    id: "gunkan",
    title: "Gunkan",
    subtitle: "Limite scelta 2 a pranzo · 3 a cena · 2 pezzi a porzione",
    availability: NOM_ALL,
    items: [
      { id: "gk-philadelphia", name: "Gunkan philadelphia", description: "Pallina di riso avvolta da salmone e coperto con philadelphia.", price: s(0), allergens: a("glutine", "pesce", "latte") },
      { id: "gk-spicy", name: "Gunkan spicy", description: "Pallina di riso avvolta da alga nori, farcita con tartara di salmone spicy.", price: s(0), tags: ["piccante"], allergens: a("pesce") },
      { id: "gk-tonno", name: "Gunkan tonno", description: "Pallina di riso avvolta da alga nori, farcita con tartara di tonno. Solo cena.", price: s(0), allergens: a("pesce") },
      { id: "gk-branzino", name: "Gunkan branzino", description: "Pallina di riso avvolta da alga nori, farcita con tartara di branzino.", price: s(0), allergens: a("pesce") },
      { id: "gk-wakame", name: "Gunkan wakame", description: "Pallina di riso avvolta da alga nori, farcita con alghe wakame.", price: s(0), tags: ["veg"], allergens: a("sesamo") },
      { id: "gk-tobiko", name: "Gunkan tobiko", description: "Pallina di riso avvolta da alga nori, farcita con tobiko.", price: s(0), allergens: a("pesce") },
      { id: "gk-fruit", name: "Gunkan fruit", description: "Pallina di riso avvolta da salmone scottato e guarnita con philadelphia, frutta e salsa teriyaki. Solo cena.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte") },
      { id: "gk-chicken", name: "Gunkan chicken", description: "Pallina di riso avvolta da salmone scottato e guarnita con philadelphia, bocconcino di pollo fritto e salsa teriyaki. Solo cena.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte") },
    ],
  },

  // ── TARTARE ────────────────────────────────────────────────────────────────
  {
    id: "tartare",
    title: "Tartare",
    subtitle: "Limite scelta 1",
    availability: NOM_ALL,
    items: [
      { id: "ta-salmone", name: "Tartara salmone", description: "Tartara di salmone e avocado, condita con salsa ponzu.", price: s(0), allergens: a("glutine", "pesce", "soia", "sesamo") },
      { id: "ta-branzino", name: "Tartara branzino", description: "Tartara di branzino e avocado, condita con salsa ponzu.", price: s(0), allergens: a("glutine", "pesce", "soia", "sesamo") },
    ],
  },

  // ── CARPACCI ───────────────────────────────────────────────────────────────
  {
    id: "carpacci",
    title: "Carpacci",
    subtitle: "Limite scelta 1",
    availability: NOM_ALL,
    items: [
      { id: "cp-salmone", name: "Carpaccio salmone", description: "Carpaccio di salmone in salsa ponzu.", price: s(0), allergens: a("glutine", "pesce", "soia", "sesamo") },
      { id: "cp-branzino", name: "Carpaccio branzino", description: "Carpaccio di branzino.", price: s(0), allergens: a("glutine", "pesce", "soia", "sesamo") },
    ],
  },

  // ── SASHIMI ────────────────────────────────────────────────────────────────
  {
    id: "sashimi",
    title: "Sashimi",
    subtitle: "Limite scelta 1",
    availability: NOM_ALL,
    items: [
      { id: "sa-salmone", name: "Sashimi salmone", description: "Salmone crudo.", price: s(0), allergens: a("pesce") },
      { id: "sa-branzino", name: "Sashimi branzino", description: "Branzino crudo.", price: s(0), allergens: a("pesce") },
    ],
  },

  // ── SUSHI MISTO ────────────────────────────────────────────────────────────
  {
    id: "sushi-misto",
    title: "Sushi misto",
    availability: NOM_ALL,
    items: [
      { id: "sm-nigiri", name: "Misto nigiri", description: "Misto di nigiri.", price: s(0), allergens: a("glutine", "crostacei", "pesce", "molluschi") },
      { id: "sm-maki", name: "Misto maki", description: "Misto di uramaki, futomaki e hosomaki.", price: s(0), allergens: a("glutine", "crostacei", "pesce", "soia", "latte", "sesamo", "molluschi") },
      { id: "sm-sushi-sashimi", name: "Misto sushi sashimi", description: "Piatto di sushi misto con uramaki, nigiri e sashimi. Solo cena.", price: s(0), allergens: a("glutine", "crostacei", "pesce", "soia", "latte", "sesamo", "molluschi") },
    ],
  },

  // ── FUTOMAKI ───────────────────────────────────────────────────────────────
  {
    id: "futomaki",
    title: "Futomaki",
    subtitle: "4 pezzi a porzione",
    availability: NOM_ALL,
    items: [
      { id: "fu-salmone", name: "Futomaki salmone", description: "Rotolo di riso avvolto da alga nori, con salmone, avocado e philadelphia.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte") },
      { id: "fu-ebiten", name: "Futomaki ebiten", description: "Rotolo di riso avvolto da alga nori, con tempura di gamberi, avocado, kataifi, philadelphia, maionese e salsa teriyaki.", price: s(0), allergens: a("glutine", "crostacei", "uova", "soia", "latte") },
    ],
  },

  // ── URAMAKI ────────────────────────────────────────────────────────────────
  {
    id: "uramaki",
    title: "Uramaki",
    subtitle: "4 pezzi a porzione",
    availability: NOM_ALL,
    items: [
      { id: "ur-salmone-philadelphia", name: "Salmone philadelphia", description: "Rotolo di riso con salmone, avocado e philadelphia.", price: s(0), allergens: a("pesce", "latte", "sesamo") },
      { id: "ur-black-salmon", name: "Black salmon", description: "Rotolo di riso venere con salmone, philadelphia, avocado, granella di pistacchio e salsa teriyaki.", price: s(0), tags: ["firma"], allergens: a("glutine", "pesce", "soia", "latte", "frutta_guscio", "sesamo") },
      { id: "ur-king-salmone", name: "King salmone", description: "Rotolo di riso con salmone cotto, granella di pistacchio, salsa mango e teriyaki.", price: s(0), allergens: a("glutine", "pesce", "soia", "latte", "sesamo") },
      { id: "ur-new-phila", name: "New phila", description: "Rotolo di riso con salmone, philadelphia, tartara di salmone, erba cipollina, salsa teriyaki e spicy.", price: s(0), tags: ["piccante"], allergens: a("glutine", "pesce", "soia", "latte", "sesamo") },
      { id: "ur-spicy-salmone", name: "Spicy salmone", description: "Rotolo di riso con salmone, tartara di salmone, scaglie di mandorle, salsa mango e spicy.", price: s(0), tags: ["piccante"], allergens: a("pesce", "frutta_guscio", "sesamo") },
      { id: "ur-tasty-salmone", name: "Tasty salmone", description: "Rotolo di riso con salmone crudo e salmone scottato, erba cipollina, olio aromatizzato cipolla.", price: s(0), allergens: a("glutine", "pesce", "soia", "sesamo") },
      { id: "ur-cotto-spicy", name: "Cotto spicy", description: "Rotolo di riso venere con pesce misto cotto, salsa spicy.", price: s(0), tags: ["piccante"], allergens: a("glutine", "pesce", "soia", "sesamo") },
      { id: "ur-sydney", name: "Sydney", description: "Rotolo di riso con tonno e avocado.", price: s(0), allergens: a("pesce", "sesamo") },
      { id: "ur-tokyo", name: "Tokyo", description: "Rotolo di riso con surimi, avocado, philadelphia, cipolla croccante e salsa spicy.", price: s(0), tags: ["piccante"], allergens: a("glutine", "crostacei", "pesce", "latte", "sesamo") },
      { id: "ur-tonno-cotto", name: "Tonno cotto", description: "Rotolo di riso con tonno cotto, philadelphia e salsa spicy mayo.", price: s(0), tags: ["piccante"], allergens: a("glutine", "uova", "pesce", "latte", "sesamo") },
      { id: "ur-new-cali", name: "New cali", description: "Rotolo di riso con surimi fritto, pasta kataifi, salsa teriyaki e maionese.", price: s(0), allergens: a("glutine", "crostacei", "uova", "pesce", "soia", "latte") },
      { id: "ur-california", name: "California", description: "Rotolo di riso con surimi, cetriolo, uova tobiko e maionese.", price: s(0), allergens: a("glutine", "crostacei", "uova", "pesce", "latte") },
      { id: "ur-ebiten", name: "Ebiten", description: "Rotolo di riso con tempura di gamberi, pasta kataifi, salsa teriyaki e maionese.", price: s(0), allergens: a("glutine", "crostacei", "uova", "soia", "latte") },
      { id: "ur-black-ebiten", name: "Black ebiten", description: "Rotolo di riso venere con tempura di gamberi, avocado, pasta kataifi, philadelphia e salsa teriyaki.", price: s(0), allergens: a("glutine", "crostacei", "uova", "soia", "latte") },
      { id: "ur-banana-ebiten", name: "Banana ebiten", description: "Rotolo di riso con tempura di gamberi, banana caramellata, salsa teriyaki e maionese.", price: s(0), allergens: a("glutine", "crostacei", "uova", "soia", "latte") },
      { id: "ur-green-ebiten", name: "Green ebiten", description: "Rotolo di riso con tempura di gamberi, pasta kataifi, philadelphia, salsa avocado e maionese.", price: s(0), allergens: a("glutine", "crostacei", "uova", "latte") },
    ],
  },
];

export function getSeedMenuForTenant(tenantId: string): MenuCategory[] {
  if (tenantId === "faak") return faakMenu;
  if (tenantId === "doca") return docaMenu;
  if (tenantId === "junior-food") return juniorFoodMenu;
  if (tenantId === "nom-sushi") return nomSushiMenu;
  if (tenantId === "officinakam") return officinaKamMenu;
  return beporkMenu;
}
