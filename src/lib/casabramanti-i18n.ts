/**
 * casabramanti-i18n.ts
 *
 * Copy del sito CASA BRAMANTI in italiano e inglese. Il registro è quello del
 * cartellino di museo: si dichiara un fatto, non si persuade. Nessuna riga
 * qui dentro deve poter finire in una brochure.
 */

import { createTenantI18n } from "@/lib/tenant-i18n";

export type CasaBramantiLanguage = "it" | "en";

export const CASABRAMANTI_TENANT_ID = "casabramanti";
export const CASABRAMANTI_PREVIEW_SLUG = "casabramanti";

export type CasaBramantiCopy = {
  langName: string;
  langShort: string;
  langSwitchLabel: string;

  nav: {
    index: string;
    indexAria: string;
    indexOpen: string;
    indexClose: string;
    cart: string;
    cartAria: string;
    skipToCollection: string;
    close: string;
  };

  label: {
    number: string;
    object: string;
    line: string;
    fabric: string;
    details: string;
    origin: string;
    care: string;
    measures: string;
    variants: string;
    sizes: string;
  };

  metro: {
    title: string;
    unit: string;
    oneSize: string;
    reducedNote: string;
    ariaLabel: string;
  };

  home: {
    plate: {
      city: string;
      opening: string;
    };
    /* Frontespizio: la prima schermata è tipografica, senza foto e senza claim. */
    opening: {
      house: string;
      /** Le condizioni che servono prima di comprare: spedizione, reso, prova. */
      terms: string;
    };
    indexHeading: string;
    indexHint: string;
    inquiryHeading: string;
    inquiryLines: Array<{ key: string; value: string }>;
    inquiryCta: string;
    viewObject: string;
  };

  piece: {
    back: string;
    chooseVariant: string;
    chooseSize: string;
    add: string;
    added: string;
    save: string;
    saved: string;
    nextObject: string;
    prevObject: string;
    shipping: string;
    shippingBody: string;
    returns: string;
    returnsBody: string;
  };

  cart: {
    title: string;
    empty: string;
    emptyHint: string;
    subtotal: string;
    shippingFree: string;
    checkout: string;
    remove: string;
    quantity: string;
    itemsOne: string;
    itemsMany: string;
  };

  checkout: {
    title: string;
    intro: string;
    contact: string;
    delivery: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    zip: string;
    city: string;
    country: string;
    notes: string;
    notesHint: string;
    summary: string;
    place: string;
    demoNotice: string;
    doneTitle: string;
    doneBody: string;
    backHome: string;
    required: string;
  };

  footer: {
    house: string;
    demoNote: string;
  };
};

const it: CasaBramantiCopy = {
  langName: "Italiano",
  langShort: "IT",
  langSwitchLabel: "Lingua",

  nav: {
    index: "Indice",
    indexAria: "Indice degli oggetti della collezione",
    indexOpen: "Apri l'indice della collezione",
    indexClose: "Chiudi l'indice",
    cart: "Borsa",
    cartAria: "Apri la borsa",
    skipToCollection: "Vai alla collezione",
    close: "Chiudi",
  },

  label: {
    number: "N°",
    object: "Oggetto",
    line: "Linea",
    fabric: "Tessuto",
    details: "Dettagli",
    origin: "Origine",
    care: "Cura",
    measures: "Misure del capo",
    variants: "Varianti",
    sizes: "Taglie",
  },

  metro: {
    title: "Metro da sarto",
    unit: "cm",
    oneSize: "Taglia unica",
    reducedNote: "Misure del capo",
    ariaLabel: "Misure del capo in centimetri",
  },

  home: {
    plate: {
      city: "Milano",
      opening: "Showroom su appuntamento, via Solferino 18",
    },
    opening: {
      /* "Milanese" no: Milano è già scritto nella riga sopra il marchio. */
      house: "Maison fondata da Elia Bramanti",
      terms:
        "Spedizione inclusa: due giorni in Italia, cinque in Europa. Reso entro trenta giorni, o prova in showroom prima di ordinare.",
    },
    indexHeading: "Indice",
    indexHint: "Otto capi, prezzo e spedizione inclusi. Variante e taglia si scelgono nella scheda del capo.",
    inquiryHeading: "Su appuntamento",
    inquiryLines: [
      { key: "Luogo", value: "Via Solferino 18, Milano" },
      { key: "Orari", value: "Da martedì a sabato, 10 alle 19" },
      { key: "Prova", value: "Ogni capo si prova prima di ordinarlo" },
      { key: "Su misura", value: "Presa misure il primo mercoledì del mese" },
    ],
    inquiryCta: "Scrivi allo showroom",
    viewObject: "Vedi l'oggetto",
  },

  piece: {
    back: "Torna alla collezione",
    chooseVariant: "Variante",
    chooseSize: "Taglia",
    add: "Aggiungi alla borsa",
    added: "Aggiunto",
    save: "Salvalo su Slabbby",
    saved: "Salvato su Slabbby",
    nextObject: "Oggetto seguente",
    prevObject: "Oggetto precedente",
    shipping: "Spedizione",
    shippingBody: "Consegna in Italia in due giorni lavorativi. In Europa in cinque.",
    returns: "Reso",
    returnsBody: "Trenta giorni, capo integro con il cartellino attaccato.",
  },

  cart: {
    title: "Borsa",
    empty: "La borsa è vuota.",
    emptyHint: "Scegli un capo dalla collezione: variante e taglia si indicano nella sua scheda.",
    subtotal: "Totale",
    shippingFree: "Spedizione inclusa",
    checkout: "Vai all'ordine",
    remove: "Togli",
    quantity: "Quantità",
    itemsOne: "oggetto",
    itemsMany: "oggetti",
  },

  checkout: {
    title: "Ordine",
    intro: "Compila i campi, l'ordine viene confermato dallo showroom entro il giorno lavorativo seguente.",
    contact: "Contatto",
    delivery: "Consegna",
    name: "Nome e cognome",
    email: "Email",
    phone: "Telefono",
    address: "Indirizzo",
    zip: "CAP",
    city: "Città",
    country: "Paese",
    notes: "Note",
    notesHint: "Ritiro in showroom, orari di consegna, incisioni.",
    summary: "Riepilogo",
    place: "Invia l'ordine",
    demoNotice: "Questo è un negozio dimostrativo. Nessun pagamento viene incassato e nessun capo viene spedito.",
    doneTitle: "Ordine registrato",
    doneBody: "Lo showroom conferma l'ordine entro il giorno lavorativo seguente e scrive all'indirizzo lasciato qui sopra. In questo negozio dimostrativo non parte nessuna spedizione.",
    backHome: "Torna alla collezione",
    required: "Campo obbligatorio",
  },

  footer: {
    house: "Casa Bramanti, Milano",
    demoNote: "Sito dimostrativo su piattaforma Bizery",
  },
};

const en: CasaBramantiCopy = {
  langName: "English",
  langShort: "EN",
  langSwitchLabel: "Language",

  nav: {
    index: "Index",
    indexAria: "Index of the objects in the collection",
    indexOpen: "Open the index of the collection",
    indexClose: "Close the index",
    cart: "Bag",
    cartAria: "Open the bag",
    skipToCollection: "Skip to the collection",
    close: "Close",
  },

  label: {
    number: "No.",
    object: "Object",
    line: "Line",
    fabric: "Cloth",
    details: "Details",
    origin: "Origin",
    care: "Care",
    measures: "Garment measurements",
    variants: "Variants",
    sizes: "Sizes",
  },

  metro: {
    title: "Tailor's tape",
    unit: "cm",
    oneSize: "One size",
    reducedNote: "Garment measurements",
    ariaLabel: "Garment measurements in centimetres",
  },

  home: {
    plate: {
      city: "Milan",
      opening: "Showroom by appointment, via Solferino 18",
    },
    opening: {
      /* No "Milanese": Milan is already set in the line above the wordmark. */
      house: "Maison founded by Elia Bramanti",
      terms:
        "Shipping included: two days in Italy, five across Europe. Thirty days to return, or try the piece on in the showroom before ordering.",
    },
    indexHeading: "Index",
    indexHint: "Eight pieces, price and shipping included. Variant and size are chosen on the object page.",
    inquiryHeading: "By appointment",
    inquiryLines: [
      { key: "Place", value: "Via Solferino 18, Milan" },
      { key: "Hours", value: "Tuesday to Saturday, 10 to 19" },
      { key: "Fitting", value: "Every piece is tried on before it is ordered" },
      { key: "Made to measure", value: "Measuring on the first Wednesday of the month" },
    ],
    inquiryCta: "Write to the showroom",
    viewObject: "See the object",
  },

  piece: {
    back: "Back to the collection",
    chooseVariant: "Variant",
    chooseSize: "Size",
    add: "Add to the bag",
    added: "Added",
    save: "Save it on Slabbby",
    saved: "Saved on Slabbby",
    nextObject: "Next object",
    prevObject: "Previous object",
    shipping: "Shipping",
    shippingBody: "Two working days in Italy. Five across Europe.",
    returns: "Returns",
    returnsBody: "Thirty days, unworn, with the tag still attached.",
  },

  cart: {
    title: "Bag",
    empty: "The bag is empty.",
    emptyHint: "Choose a piece from the collection: variant and size are picked on its own page.",
    subtotal: "Total",
    shippingFree: "Shipping included",
    checkout: "Go to the order",
    remove: "Remove",
    quantity: "Quantity",
    itemsOne: "object",
    itemsMany: "objects",
  },

  checkout: {
    title: "Order",
    intro: "Fill in the fields. The showroom confirms the order within the next working day.",
    contact: "Contact",
    delivery: "Delivery",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    zip: "Postcode",
    city: "City",
    country: "Country",
    notes: "Notes",
    notesHint: "Showroom collection, delivery windows, engraving.",
    summary: "Summary",
    place: "Send the order",
    demoNotice: "This is a demonstration shop. No payment is taken and nothing is shipped.",
    doneTitle: "Order recorded",
    doneBody: "The showroom confirms the order within the next working day and writes to the address left above. Nothing ships from this demonstration shop.",
    backHome: "Back to the collection",
    required: "Required field",
  },

  footer: {
    house: "Casa Bramanti, Milan",
    demoNote: "Demonstration site on the Bizery platform",
  },
};

export const casabramantiI18n = createTenantI18n<CasaBramantiLanguage, CasaBramantiCopy>({
  tenantId: CASABRAMANTI_TENANT_ID,
  previewSlug: CASABRAMANTI_PREVIEW_SLUG,
  defaultLanguage: "it",
  translations: { it, en },
});

export const { useCopy: useCasabramantiCopy, useLanguage: useCasabramantiLanguage } = casabramantiI18n;
