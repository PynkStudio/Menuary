import type { MailBrandProfile } from "@pynkstudio/mailapp/core";

/**
 * Le identità di posta della piattaforma.
 *
 * Fino alla 0.4.x questi valori vivevano dentro `@pynkstudio/mailapp`, che li
 * conosceva a nome nostro. Dalla 0.5.0 il pacchetto non conosce nessun brand:
 * l'elenco sta qui, ed è l'unico posto da toccare per aggiungerne uno — senza
 * più una migrazione di database per allargare il vincolo su `brand`.
 *
 * L'ordine conta: è l'ordine dei filtri nella UI ed è la priorità con cui un
 * indirizzo viene attribuito a un brand.
 */
export const MAIL_BRANDS: MailBrandProfile[] = [
  {
    id: "pynkstudio",
    label: "PynkStudio",
    // Resend ha verificato solo pynkstudio.eu: .it e .com restano per attribuire
    // la posta in arrivo, ma ogni invio esce da .eu.
    domains: ["pynkstudio.eu", "pynkstudio.it", "pynkstudio.com"],
    fromAddress: "hello@pynkstudio.eu",
    website: "pynkstudio.eu",
    tagline: "Gruppo creativo e tecnologico",
    theme: {
      accent: "#D946A8",
      accentInk: "#9B2D7A",
      paper: "#FDF5FA",
      rule: "#F0DDE9",
      subtle: "#a8909e",
    },
  },
  {
    id: "menuary",
    label: "Menuary",
    domains: ["menuary.it"],
    fromAddress: "hello@menuary.it",
    supportAddress: "support@menuary.it",
    website: "menuary.it",
    tagline: "La piattaforma dei ristoranti italiani",
    theme: {
      accent: "#A95F45",
      accentInk: "#743D2F",
      paper: "#FFFAF2",
      rule: "#E6DFD2",
      subtle: "#9aa39e",
    },
  },
  {
    id: "bizery",
    label: "Bizery",
    domains: ["bizery.it"],
    fromAddress: "hello@bizery.it",
    supportAddress: "support@bizery.it",
    website: "bizery.it",
    tagline: "La piattaforma delle attività di servizio",
    theme: {
      accent: "#3B6CB5",
      accentInk: "#234A85",
      paper: "#F5F7FB",
      rule: "#DFE5F0",
      subtle: "#8993a4",
    },
  },
  {
    id: "orpheo",
    label: "Orpheo",
    domains: ["weuseorpheo.com"],
    fromAddress: "hello@weuseorpheo.com",
    supportAddress: "support@weuseorpheo.com",
    website: "weuseorpheo.com",
    tagline: "La piattaforma per artisti e professionisti creativi",
    theme: {
      accent: "#7C3AED",
      accentInk: "#4C1D95",
      paper: "#FBFAF7",
      rule: "#E7E0F0",
      subtle: "#9590a8",
    },
  },
];

/** Brand attribuito a un indirizzo che non appartiene a nessun dominio noto. */
export const FALLBACK_MAIL_BRAND_ID = "menuary";

/** Casella condivisa: non identifica una persona, la raccoglie chi è operativo. */
export const SHARED_MAIL_INBOX = "hello@menuary.it";

/** Ruoli che possono scrivere dal pannello. */
export const MAIL_COMPOSE_ROLES = ["superadmin", "admin", "amministrazione", "venditore"];

/** Ruoli a cui viene assegnata la posta arrivata sulla casella condivisa. */
export const MAIL_OPERATIVE_ROLES = ["admin", "amministrazione"];

/** Etichette di ruolo stampate nella firma automatica. */
export const MAIL_ROLE_LABELS: Record<string, string> = {
  superadmin: "Amministratore di sistema",
  admin: "Amministratore",
  amministrazione: "Amministrazione",
  venditore: "Consulente commerciale",
  lead_inserter: "Sviluppo commerciale",
};
