export const valentinaBasePath = "/valentina-orciuoli";

export const amazonHref = "https://www.amazon.it/Anxiety-Valentina-Orciuoli-ebook/dp/B0F1KVZKFC";
export const amazonStoreHref = "https://www.amazon.it/stores/Valentina-Orciuoli/author/B0F1TXYZ27?ref=ap_rdr&shoppingPortalEnabled=true";
export const trilogyHref = "https://www.amazon.it/stores/author/B0F1TXYZ27/allbooks";
export const furyHref = "https://www.amazon.it/Fury-Emotion-Dragons-Trilogy-Vol-ebook/dp/B0GKWCS774";
export const externalLinktreeHref = "https://linktr.ee/valentina.orciuoli";
export const linktreeHref = `${valentinaBasePath}/link`;
export const instagramHref = "https://www.instagram.com/di.vale_in.peggio/";
export const tiktokHref = "https://www.tiktok.com/@valentina.orciuoli";
export const valentinaEmail = "valentina.orciuoli@weuseorpheo.com";
export const anxietyCoverSrc = "/valentina-orciuoli/anxiety-mockup-standup.png";
export const furyCoverSrc = "https://m.media-amazon.com/images/I/71z2LZ6a8XL.jpg";
export const darkNoirCoverSrc = "/valentina-orciuoli/tra-fumo-e-ombre.webp";
export const authorPortraitSrc = "https://www.selfcreation.it/wp-content/uploads/2024/11/Valentina-Orciuoli.jpg";

export const valentinaLinks = [
  {
    label: "Sito",
    desc: "Home ufficiale di Valentina Orciuoli.",
    href: valentinaBasePath,
    kind: "site",
  },
  {
    label: "Instagram",
    desc: "Aggiornamenti, cover reveal e vita da autrice.",
    href: instagramHref,
    kind: "social",
  },
  {
    label: "TikTok",
    desc: "Video, trend e contenuti per lettrici e lettori.",
    href: tiktokHref,
    kind: "social",
  },
  {
    label: "Contatti",
    desc: "Form, email e canali ufficiali.",
    href: `${valentinaBasePath}/contatti`,
    kind: "contact",
  },
  {
    label: "Libri",
    desc: "Catalogo libri e pagine d'acquisto.",
    href: `${valentinaBasePath}/libri`,
    kind: "books",
  },
  {
    label: "Eventi",
    desc: "Presentazioni, firmacopie e nuove date.",
    href: `${valentinaBasePath}/eventi`,
    kind: "events",
  },
];

export const trilogy = [
  {
    n: "II",
    title: "Fury",
    desc: "Un secolo prima del Dragone Nero dell'ansia, il Primo Long incarna la rabbia.",
    state: "Disponibile su Kindle",
    href: furyHref,
    coverSrc: furyCoverSrc,
    coverAlt: "Copertina di Fury di Valentina Orciuoli",
  },
  {
    n: "III",
    title: "Volume III",
    desc: "La chiusura della saga portera ogni emozione davanti alla sua forma piu antica.",
    state: "Cover reveal in arrivo",
    href: null,
    coverSrc: null,
    coverAlt: "",
  },
  {
    n: "I",
    slug: "tra-fumo-e-ombre",
    volumeLabel: "Novel Dark-Noir",
    title: "Tra fumo e ombre",
    desc: "Thriller psicologico dove la protagonista è il vero drago.",
    state: "prenota ora",
    href: "https://demo.weuseorpheo.com/valentina-orciuoli/libri#tra-fumo-e-ombre",
    coverSrc: darkNoirCoverSrc,
    coverAlt: "Copertina di Tra fumo e ombre di Valentina Orciuoli",
  },
];
