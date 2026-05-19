export type LibritechBook = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

const images = [
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1510925758641-869d353cecc7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1497561813398-8fcc7a37b567?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
] as const;

const seeds: Omit<LibritechBook, "imageUrl">[] = [
  {
    id: "pitch-deck-e-figli",
    name: "Pitch Deck & Figli",
    description: "Una guida semiseria per founder che vogliono convincere investitori, parenti e coinquilini che la startup questa volta ha davvero senso.",
    price: 21.9,
  },
  {
    id: "il-fondo-del-caffe-seed",
    name: "Il Fondo del Caffè Seed",
    description: "Dalle prime pitch call al primo bonifico, racconta come raccogliere capitale senza perdere lucidità, dignità e password del conto.",
    price: 18.5,
  },
  {
    id: "cashflow-per-romantici",
    name: "Cashflow per Romantici",
    description: "Per chi crede ancora che numeri, visione e sentimenti possano convivere in un foglio Excel senza drammi trimestrali.",
    price: 19.9,
  },
  {
    id: "exit-strategy-per-anime-sensibili",
    name: "Exit Strategy per Anime Sensibili",
    description: "M&A, acquisizioni e addii ben confezionati spiegati a chi si affeziona persino al vecchio logo della propria app.",
    price: 24.0,
  },
  {
    id: "burn-rate-e-buoni-propositi",
    name: "Burn Rate e Buoni Propositi",
    description: "Un promemoria ironico ma utile sul perché tagliare costi e slide superflue resta il gesto più romantico del fare impresa.",
    price: 17.9,
  },
  {
    id: "linvestitore-che-sussurrava-ai-kpi",
    name: "L'Investitore che Sussurrava ai KPI",
    description: "Metriche, trazione e storytelling raccontati dal punto di vista di chi annuisce in call e poi chiede il churn vero.",
    price: 23.4,
  },
  {
    id: "startup-senza-sonno",
    name: "Startup senza Sonno",
    description: "Cronaca pratica di roadmap, bug, board meeting e caffeina per squadre che confondono il product-market fit con l'insonnia.",
    price: 20.0,
  },
  {
    id: "cap-table-al-tramonto",
    name: "Cap Table al Tramonto",
    description: "Tutto quello che volevi sapere su quote, dilution e soci entusiasti prima di leggere la riga che dice post-money.",
    price: 26.9,
  },
  {
    id: "il-manuale-del-finto-unicorn",
    name: "Il Manuale del Finto Unicorn",
    description: "Valutazioni gonfiate, vanity metrics e foto con hoodie neutra: la satira definitiva del culto della crescita a ogni costo.",
    price: 22.9,
  },
  {
    id: "ipo-aperitivi-e-altre-delusioni",
    name: "IPO, Aperitivi e Altre Delusioni",
    description: "Dedicato a chi ha già scelto il locale per festeggiare la quotazione, ma non ha ancora sistemato i fondamentali.",
    price: 25.5,
  },
  {
    id: "growth-hacking-per-persone-con-bollette",
    name: "Growth Hacking per Persone con Bollette",
    description: "Tecniche di crescita spiegate senza fumo motivazionale, per team che devono aumentare utenti prima che arrivi la prossima rata.",
    price: 18.9,
  },
  {
    id: "algoritmi-apericene-e-margine-lordo",
    name: "Algoritmi, Apericene e Margine Lordo",
    description: "Un tour elegante nel business moderno dove recommendation engine, networking e contabilità creativa si sfiorano troppo spesso.",
    price: 27.0,
  },
  {
    id: "prompt-engineering-per-c-level-ansiosi",
    name: "Prompt Engineering per C-Level Ansiosi",
    description: "Come parlare con l'IA senza aspettarsi miracoli, licenziamenti di massa o presentazioni generate meglio del team marketing.",
    price: 29.9,
  },
  {
    id: "machine-learning-per-riunioni-inutili",
    name: "Machine Learning per Riunioni Inutili",
    description: "Introduzione accessibile ai modelli intelligenti, pensata per distinguere la vera automazione dal solito vocabolario da sala riunioni.",
    price: 28.4,
  },
  {
    id: "il-ceo-che-voleva-essere-un-meme",
    name: "Il CEO che Voleva Essere un Meme",
    description: "Brand personale, social strategy e leadership performativa in un racconto feroce su ego, virality e keynote con troppo fumo.",
    price: 21.4,
  },
  {
    id: "excel-karma-e-valutazioni",
    name: "Excel, Karma e Valutazioni",
    description: "Per chi sa che un multiplo generoso può cambiare la giornata, ma non sostituisce un business che regga oltre il keynote.",
    price: 19.4,
  },
  {
    id: "debito-buono-debito-cattivo-debito-su-linkedin",
    name: "Debito Buono, Debito Cattivo, Debito su LinkedIn",
    description: "Un piccolo trattato sui soldi presi in prestito e su quelli raccontati online come leva strategica con troppo entusiasmo.",
    price: 24.9,
  },
  {
    id: "etf-e-tisane",
    name: "ETF & Tisane",
    description: "Investire con calma, disciplina e ironia: il libro giusto per chi vuole rendimenti sobri e notifiche molto meno drammatiche.",
    price: 16.9,
  },
  {
    id: "intelligenza-artificiale-per-umani-a-fattura",
    name: "Intelligenza Artificiale per Umani a Fattura",
    description: "Spiega come usare agenti, automazioni e modelli generativi per lavorare meglio senza trasformare ogni brief in fantascienza aziendale.",
    price: 31.0,
  },
  {
    id: "la-sindrome-del-founder",
    name: "La Sindrome del Founder",
    description: "Controllo totale, ottimismo tossico e sprint eterni raccontati con lucidità da chi ha già provato a fare tutto da solo.",
    price: 20.9,
  },
  {
    id: "monetizza-questo-sentimento",
    name: "Monetizza Questo Sentimento",
    description: "Una riflessione ironica sul capitalismo emotivo, dagli abbonamenti alle community fino ai corsi che vendono serenità premium.",
    price: 22.0,
  },
  {
    id: "il-venture-capitalista-di-quartiere",
    name: "Il Venture Capitalista di Quartiere",
    description: "Come riconoscere un investitore davvero utile, evitando quelli che portano solo buzzword, brunch e zero term sheet.",
    price: 26.0,
  },
  {
    id: "remote-first-caos-sempre",
    name: "Remote First, Caos Sempre",
    description: "Manuale affettuosamente spietato sul lavoro distribuito, tra Slack, fusi orari e il mistero di chi modifica il file finale.",
    price: 18.0,
  },
  {
    id: "cripto-caffe-e-crisi-esistenziali",
    name: "Cripto, Caffè e Crisi Esistenziali",
    description: "Un viaggio tra wallet, hype ciclico e risvegli improvvisi in cui il futuro della finanza sembra sempre domani mattina.",
    price: 23.9,
  },
  {
    id: "strategie-di-pricing-per-gente-emotiva",
    name: "Strategie di Pricing per Gente Emotiva",
    description: "Prezzi, margini e percezione del valore spiegati a chi abbassa il listino appena qualcuno risponde solo con un emoji dubbioso.",
    price: 17.5,
  },
  {
    id: "data-room-con-vista",
    name: "Data Room con Vista",
    description: "Checklist elegante per fundraising, due diligence e documenti che improvvisamente diventano importanti proprio ieri sera.",
    price: 30.5,
  },
  {
    id: "robot-rendite-e-riunioni",
    name: "Robot, Rendite e Riunioni",
    description: "Tra automazione industriale, software agentico e board pieni di opinioni, questo libro separa trend veri da teatrini costosi.",
    price: 27.9,
  },
  {
    id: "side-hustle-allamatriciana",
    name: "Side Hustle all'Amatriciana",
    description: "Storie e tattiche per costruire progetti secondari con ambizione realistica, evitando di chiamare ecosistema qualsiasi hobby monetizzato.",
    price: 18.4,
  },
  {
    id: "il-piccolo-manuale-del-mega-round",
    name: "Il Piccolo Manuale del Mega Round",
    description: "Term sheet, governance e celebrata euforia pre-scaling spiegati con il tono di chi sa quanto costa davvero crescere in fretta.",
    price: 32.9,
  },
  {
    id: "work-life-balance-per-chi-ha-un-board",
    name: "Work-Life Balance per Chi Ha un Board",
    description: "Consigli sorprendentemente pratici per proteggere tempo, attenzione e salute mentale quando il calendario sembra gestito da investitori molto attivi.",
    price: 21.0,
  },
];

export const libritechCatalog: LibritechBook[] = seeds.map((book, i) => ({
  ...book,
  imageUrl: images[i % images.length],
}));
