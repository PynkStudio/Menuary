/** Origine pubblica portale clienti (login, profilo, consensi, ordini). */
export const CLIENTS_PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_CLIENTS_ORIGIN ?? "https://clienti.menuary.it";

export const clientsSite = {
  name: "Menuary · Area personale",
  description:
    "Accedi al tuo account Menuary: profilo, allergeni, consensi privacy, ordini e gestione dei dati condivisi con i ristoranti.",
  /** Path assoluti su questo host */
  paths: {
    home: "/",
    login: "/login",
    profile: "/profilo",
    consents: "/consensi",
    restaurants: "/ristoranti",
    orders: "/ordini",
  },
} as const;
