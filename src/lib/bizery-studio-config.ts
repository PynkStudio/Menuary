/** Origine pubblica portale fatturazione / abbonamenti per le aziende (B2B Bizery). */
export const BIZERY_STUDIO_PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_BIZERY_STUDIO_ORIGIN ?? "https://studio.bizery.it";

export const bizeryStudioSite = {
  name: "Bizery · Fatturazione azienda",
  description:
    "Dati di fatturazione del servizio Bizery, metodi di pagamento (SEPA, Stripe in arrivo) e gestione del recesso per la tua azienda.",
  paths: {
    home: "/",
    billing: "/fatturazione",
    payments: "/pagamenti",
    recesso: "/recesso",
  },
} as const;
