import { createTenantI18n } from "@/lib/tenant-i18n";

const translations = {
  it: {
    languageLabel: "Lingua",
    heroBody:
      "Bakery di una brasiliana di quartiere a Milano Corvetto, uno spazio dove tradizioni diverse si incontrano. Un luogo che parla di viaggio, contaminazione e quartiere. Dove magari ritrovate un ricordo, o ne create uno nuovo.",
    reserve: "Prenota su WhatsApp",
    menu: "Scopri tutto il menu",
    scroll: "Scorri",
    introEyebrow: "Padoca - la panetteria di quartiere",
    introTitleLead: "Una bakery di quartiere,",
    introTitleAccent: "con radici brasiliane.",
    introBody:
      'Doca viene da "padoca": quella panetteria sotto casa dove vai ogni mattina, conosci chi ti serve e ti senti a casa. Forno, caffe e dolci brasiliani sotto lo stesso tetto, in uno spazio che unisce bottega e laboratorio.',
    categories: [
      { title: "Il salato", kicker: "Dal forno", desc: "Pane a lievitazione naturale, pao de queijo e proposte salate preparate ogni giorno." },
      { title: "Il dolce", kicker: "Ricette brasiliane", desc: "Torta di carote e brigadeiro, dolci di casa e sapori che attraversano l'oceano." },
      { title: "Le bevande", kicker: "Caffe e filtro", desc: "Espresso, caffe filtro e bevande da gustare con calma, al banco o seduti." },
    ],
    aboutEyebrow: "Chi siamo",
    aboutTitle: "Tecnica, memoria e quotidianita.",
    aboutBody:
      "DOCA nasce dal viaggio personale e professionale di Queren Girardi, bakery chef brasiliana arrivata a Milano con il desiderio di creare un luogo capace di unire tecnica, memoria e quotidianita.",
    aboutDetail:
      "Dopo una formazione legata alle Scienze Gastronomiche in Brasile e diverse esperienze nella panificazione contemporanea milanese, Queren ha immaginato una bakery diversa: un posto dove pane, caffe e dolci diventano strumenti di racconto, incontro e contaminazione culturale.",
    reviewsEyebrow: "Dicono di noi",
    reviewsTitleLead: "Una bakery",
    reviewsTitleAccent: "gia cercata.",
    reviewsSource: "Fonti pubbliche e scheda Google",
    google: "Apri su Google",
    findEyebrow: "Come trovarci",
    findTitleLead: "Via Breno 2,",
    findTitleAccent: "Milano Corvetto.",
    findBody: "Ci trovi in zona Corvetto, in Via Breno 2. Passa per il pane, fermati per un caffe o prenota su WhatsApp.",
    address: "Indirizzo",
    contact: "Telefono",
    hours: "Orari",
    maps: "Apri in Google Maps",
    closed: "Chiuso",
    footerTagline: "Pane, caffe, saudade.",
    footerBody: "Bakery brasiliana di quartiere fondata da Queren Girardi a Milano Corvetto. Pane, caffe filtro e dolci brasiliani sotto lo stesso tetto.",
    footerLocation: "Dove siamo",
    footerHours: "Orari",
    whatsappFooter: "Prenota su WhatsApp ->",
    deliveryTitle: "Niente delivery, vieni in bottega.",
    deliveryBody: "Doca lavora pane fresco ogni mattina. Passa, guarda il banco e porta a casa quello che preferisci. Su Too Good To Go trovi la Surprise Bag a fine giornata.",
  },
  pt: {
    languageLabel: "Idioma",
    heroBody:
      "Padaria de bairro de uma brasileira em Milano Corvetto, um espaco onde tradicoes diferentes se encontram. Um lugar que fala de viagem, mistura e vizinhanca. Onde voce pode reencontrar uma lembranca, ou criar uma nova.",
    reserve: "Reserve pelo WhatsApp",
    menu: "Veja o menu completo",
    scroll: "Role",
    introEyebrow: "Padoca - a padaria do bairro",
    introTitleLead: "Uma padaria de bairro,",
    introTitleAccent: "com raizes brasileiras.",
    introBody:
      'Doca vem de "padoca": aquela padaria perto de casa onde voce vai todas as manhas, conhece quem atende e se sente em casa. Forno, cafe e doces brasileiros sob o mesmo teto, em um espaco que une loja e laboratorio.',
    categories: [
      { title: "Os salgados", kicker: "Do forno", desc: "Pao de fermentacao natural, pao de queijo e salgados preparados todos os dias." },
      { title: "Os doces", kicker: "Receitas brasileiras", desc: "Bolo de cenoura com brigadeiro, doces da casa e sabores que atravessam o oceano." },
      { title: "As bebidas", kicker: "Cafe e coado", desc: "Espresso, cafe coado e bebidas para saborear com calma, no balcao ou sentado." },
    ],
    aboutEyebrow: "Quem somos",
    aboutTitle: "Tecnica, memoria e cotidiano.",
    aboutBody:
      "A DOCA nasce da viagem pessoal e profissional de Queren Girardi, bakery chef brasileira que chegou a Milao com o desejo de criar um lugar capaz de unir tecnica, memoria e cotidiano.",
    aboutDetail:
      "Depois de uma formacao ligada as Ciencias Gastronomicas no Brasil e de experiencias na panificacao contemporanea milanesa, Queren imaginou uma padaria diferente: um lugar onde pao, cafe e doces se tornam instrumentos de historia, encontro e mistura cultural.",
    reviewsEyebrow: "Falam de nos",
    reviewsTitleLead: "Uma padaria",
    reviewsTitleAccent: "que ja virou destino.",
    reviewsSource: "Fontes publicas e perfil no Google",
    google: "Abrir no Google",
    findEyebrow: "Como chegar",
    findTitleLead: "Via Breno 2,",
    findTitleAccent: "Milano Corvetto.",
    findBody: "Estamos na Via Breno 2, no bairro Corvetto. Passe para buscar pao, fique para um cafe ou reserve pelo WhatsApp.",
    address: "Endereco",
    contact: "Telefone",
    hours: "Horarios",
    maps: "Abrir no Google Maps",
    closed: "Fechado",
    footerTagline: "Pao, cafe, saudade.",
    footerBody: "Padaria brasileira de bairro fundada por Queren Girardi em Milano Corvetto. Pao, cafe coado e doces brasileiros sob o mesmo teto.",
    footerLocation: "Onde estamos",
    footerHours: "Horarios",
    whatsappFooter: "Reserve pelo WhatsApp ->",
    deliveryTitle: "Sem delivery: venha ate a loja.",
    deliveryBody: "A Doca prepara pao fresco todas as manhas. Passe, veja o balcao e leve o que preferir. No Too Good To Go voce encontra a Surprise Bag no fim do dia.",
  },
  en: {
    languageLabel: "Language",
    heroBody:
      "A Brazilian neighborhood bakery in Milan's Corvetto district, where different traditions meet. A place shaped by travel, exchange and community. Somewhere to find an old memory, or make a new one.",
    reserve: "Book on WhatsApp",
    menu: "Explore the full menu",
    scroll: "Scroll",
    introEyebrow: "Padoca - your neighborhood bakery",
    introTitleLead: "A neighborhood bakery,",
    introTitleAccent: "with Brazilian roots.",
    introBody:
      'Doca comes from "padoca": the bakery around the corner where you go every morning, know the person serving you and feel at home. Brazilian bread, coffee and cakes under one roof, in a space that brings the shop and bakery lab together.',
    categories: [
      { title: "Savoury", kicker: "From the oven", desc: "Naturally leavened bread, pao de queijo and savoury bakes prepared every day." },
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
    findBody: "Find us at Via Breno 2 in Corvetto. Drop in for bread, stay for a coffee or book on WhatsApp.",
    address: "Address",
    contact: "Phone",
    hours: "Hours",
    maps: "Open in Google Maps",
    closed: "Closed",
    footerTagline: "Bread, coffee, saudade.",
    footerBody: "A Brazilian neighborhood bakery founded by Queren Girardi in Milan's Corvetto district. Bread, filter coffee and Brazilian cakes under one roof.",
    footerLocation: "Find us",
    footerHours: "Hours",
    whatsappFooter: "Book on WhatsApp ->",
    deliveryTitle: "No delivery: come by the bakery.",
    deliveryBody: "Doca makes fresh bread every morning. Drop in, look at the counter and take home your favorites. Find the end-of-day Surprise Bag on Too Good To Go.",
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
