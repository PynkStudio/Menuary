/** Origine pubblica portale fatturazione / abbonamenti per i locali (B2B). */
export const STUDIO_PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_STUDIO_ORIGIN ?? "https://studio.menuary.it";

export const studioSite = {
  name: "Menuary · Fatturazione locale",
  description:
    "Dati di fatturazione del servizio Menuary, metodi di pagamento (SEPA, Stripe in arrivo) e gestione del recesso per il tuo ristorante.",
  paths: {
    home: "/",
    billing: "/fatturazione",
    payments: "/pagamenti",
    recesso: "/recesso",
  },
} as const;
