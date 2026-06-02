import { createTenantI18n } from "@/lib/tenant-i18n";

const translations = {
  it: {
    languageLabel: "Lingua",
    heroBody:
      "Bakery di una brasiliana di quartiere a Milano Corvetto, uno spazio dove tradizioni diverse si incontrano. Un luogo che parla di viaggio, contaminazione e quartiere. Dove magari ritrovate un ricordo… o ne create uno nuovo.",
    reserve: "Prenota ora",
    reserveHere: "Prenota qui",
    menu: "Scopri tutto il menu",
    scroll: "Scorri",
    introEyebrow: "Padoca - la panetteria di quartiere",
    introTitleLead: "Una bakery di quartiere,",
    introTitleAccent: "con radici brasiliane.",
    introBody:
      'Doca viene da "padoca": quella panetteria sotto casa dove vai ogni mattina, conosci chi ti serve e ti senti a casa. Forno, caffè e dolci brasiliani sotto lo stesso tetto, in uno spazio che unisce bottega e laboratorio.',
    categories: [
      { title: "Il salato", kicker: "Dal forno", desc: "Pane a lievitazione naturale, pão de queijo e proposte salate preparate ogni giorno." },
      { title: "Il dolce", kicker: "Ricette brasiliane", desc: "Torta di carote e brigadeiro, dolci di casa e sapori che attraversano l'oceano." },
      { title: "Le bevande", kicker: "Caffè e filtro", desc: "Espresso, caffè filtro e bevande da gustare con calma, al banco o seduti." },
    ],
    aboutEyebrow: "Chi siamo",
    aboutTitle: "Tecnica, memoria e quotidianità.",
    aboutBody:
      "DOCA nasce dal viaggio personale e professionale di Queren Girardi, bakery chef brasiliana arrivata a Milano con il desiderio di creare un luogo capace di unire tecnica, memoria e quotidianità.",
    aboutDetail:
      "Dopo una formazione legata alle Scienze Gastronomiche in Brasile e diverse esperienze nella panificazione contemporanea milanese, Queren ha immaginato una bakery diversa: un posto dove pane, caffè e dolci diventano strumenti di racconto, incontro e contaminazione culturale.",
    reviewsEyebrow: "Dicono di noi",
    reviewsTitleLead: "Una bakery",
    reviewsTitleAccent: "già cercata.",
    reviewsSource: "Fonti pubbliche e scheda Google",
    google: "Apri su Google",
    findEyebrow: "Come trovarci",
    findTitleLead: "Via Breno 2,",
    findTitleAccent: "Milano Corvetto.",
    findBody: "Ci trovi in zona Corvetto, in Via Breno 2. Passa per il pane, fermati per un caffè o prenota qui.",
    address: "Indirizzo",
    contact: "Telefono",
    hours: "Orari",
    maps: "Apri in Google Maps",
    closed: "Chiuso",
    footerTagline: "Pane, caffè, saudade.",
    footerBody: "Bakery di una brasiliana di quartiere fondata da Queren Girardi a Milano Corvetto. Pane, caffè filtro e dolci brasiliani sotto lo stesso tetto.",
    footerLocation: "Dove siamo",
    footerHours: "Orari",
    whatsappFooter: "Prenota qui ->",
    deliveryTitle: "Niente delivery, vieni in bottega.",
    deliveryBody: "Doca lavora pane fresco ogni mattina. Passa, guarda il banco e porta a casa quello che preferisci. Su Too Good To Go trovi la Surprise Bag a fine giornata.",
    surpriseBagCta: "Salva una Surprise Bag",
  },
  pt: {
    languageLabel: "Idioma",
    heroBody:
      "Padaria de bairro de uma brasileira em Milano Corvetto, um espaço onde tradições diferentes se encontram. Um lugar que fala de viagem, mistura e vizinhança. Onde você pode reencontrar uma lembrança… ou criar uma nova.",
    reserve: "Reserve agora",
    reserveHere: "Reserve aqui",
    menu: "Veja o menu completo",
    scroll: "Role",
    introEyebrow: "Padoca - a padaria do bairro",
    introTitleLead: "Uma padaria de bairro,",
    introTitleAccent: "com raízes brasileiras.",
    introBody:
      'Doca vem de "padoca": aquela padaria perto de casa onde você vai todas as manhãs, conhece quem atende e se sente em casa. Forno, café e doces brasileiros sob o mesmo teto, em um espaço que une loja e laboratório.',
    categories: [
      { title: "Os salgados", kicker: "Do forno", desc: "Pão de fermentação natural, pão de queijo e salgados preparados todos os dias." },
      { title: "Os doces", kicker: "Receitas brasileiras", desc: "Bolo de cenoura com brigadeiro, doces da casa e sabores que atravessam o oceano." },
      { title: "As bebidas", kicker: "Café e coado", desc: "Espresso, café coado e bebidas para saborear com calma, no balcão ou sentado." },
    ],
    aboutEyebrow: "Quem somos",
    aboutTitle: "Técnica, memória e cotidiano.",
    aboutBody:
      "A DOCA nasce da viagem pessoal e profissional de Queren Girardi, bakery chef brasileira que chegou a Milão com o desejo de criar um lugar capaz de unir técnica, memória e cotidiano.",
    aboutDetail:
      "Depois de uma formação ligada às Ciências Gastronômicas no Brasil e de experiências na panificação contemporânea milanesa, Queren imaginou uma padaria diferente: um lugar onde pão, café e doces se tornam instrumentos de história, encontro e mistura cultural.",
    reviewsEyebrow: "Falam de nos",
    reviewsTitleLead: "Uma padaria",
    reviewsTitleAccent: "que já virou destino.",
    reviewsSource: "Fontes públicas e perfil no Google",
    google: "Abrir no Google",
    findEyebrow: "Como chegar",
    findTitleLead: "Via Breno 2,",
    findTitleAccent: "Milano Corvetto.",
    findBody: "Estamos na Via Breno 2, no bairro Corvetto. Passe para buscar pão, fique para um café ou reserve aqui.",
    address: "Endereço",
    contact: "Telefone",
    hours: "Horários",
    maps: "Abrir no Google Maps",
    closed: "Fechado",
    footerTagline: "Pão, café, saudade.",
    footerBody: "Padaria de bairro de uma brasileira fundada por Queren Girardi em Milano Corvetto. Pão, café coado e doces brasileiros sob o mesmo teto.",
    footerLocation: "Onde estamos",
    footerHours: "Horários",
    whatsappFooter: "Reserve aqui ->",
    deliveryTitle: "Sem delivery: venha até a loja.",
    deliveryBody: "A Doca prepara pão fresco todas as manhãs. Passe, veja o balcão e leve o que preferir. No Too Good To Go você encontra a Surprise Bag no fim do dia.",
    surpriseBagCta: "Salve uma Surprise Bag",
  },
  en: {
    languageLabel: "Language",
    heroBody:
      "A Brazilian neighborhood bakery in Milan's Corvetto district, where different traditions meet. A place shaped by travel, exchange and community. Somewhere to find an old memory, or make a new one.",
    reserve: "Book now",
    reserveHere: "Book here",
    menu: "Explore the full menu",
    scroll: "Scroll",
    introEyebrow: "Padoca - your neighborhood bakery",
    introTitleLead: "A neighborhood bakery,",
    introTitleAccent: "with Brazilian roots.",
    introBody:
      'Doca comes from "padoca": the bakery around the corner where you go every morning, know the person serving you and feel at home. Brazilian bread, coffee and cakes under one roof, in a space that brings the shop and bakery lab together.',
    categories: [
      { title: "Savoury", kicker: "From the oven", desc: "Naturally leavened bread, pão de queijo and savoury bakes prepared every day." },
      { title: "Sweet", kicker: "Brazilian recipes", desc: "Carrot cake with brigadeiro, homemade cakes and flavors that travel across the ocean." },
      { title: "Drinks", kicker: "Coffee and filter", desc: "Espresso, filter coffee and drinks to enjoy slowly, at the counter or seated." },
    ],
    aboutEyebrow: "About us",
    aboutTitle: "Technique, memory and everyday life.",
    aboutBody:
      "DOCA grew out of Queren Girardi's personal and professional journey. The Brazilian bakery chef arrived in Milan wanting to create a place that could bring together technique, memory and everyday life.",
    aboutDetail:
      "After studying a field related to Gastronomic Sciences in Brazil and working in Milan's contemporary baking scene, Queren imagined a different bakery: a place where bread, coffee and cakes become ways to share stories, meet and mix cultures.",
    reviewsEyebrow: "What they say",
    reviewsTitleLead: "A bakery",
    reviewsTitleAccent: "worth seeking out.",
    reviewsSource: "Public sources and Google profile",
    google: "Open on Google",
    findEyebrow: "Find us",
    findTitleLead: "Via Breno 2,",
    findTitleAccent: "Milan Corvetto.",
    findBody: "Find us at Via Breno 2 in Corvetto. Drop in for bread, stay for a coffee or book here.",
    address: "Address",
    contact: "Phone",
    hours: "Hours",
    maps: "Open in Google Maps",
    closed: "Closed",
    footerTagline: "Bread, coffee, saudade.",
    footerBody: "A Brazilian neighborhood bakery founded by Queren Girardi in Milan's Corvetto district. Bread, filter coffee and Brazilian cakes under one roof.",
    footerLocation: "Find us",
    footerHours: "Hours",
    whatsappFooter: "Book here ->",
    deliveryTitle: "No delivery: come by the bakery.",
    deliveryBody: "Doca makes fresh bread every morning. Drop in, look at the counter and take home your favorites. Find the end-of-day Surprise Bag on Too Good To Go.",
    surpriseBagCta: "Save a Surprise Bag",
  },
} as const;

export type DocaLanguage = keyof typeof translations;

export const docaI18n = createTenantI18n({
  tenantId: "doca",
  previewSlug: "doca",
  defaultLanguage: "it",
  translations,
});

export const setDocaLanguage = docaI18n.setLanguage;
export const useDocaCopy = docaI18n.useCopy;
export const useDocaLanguage = docaI18n.useLanguage;
