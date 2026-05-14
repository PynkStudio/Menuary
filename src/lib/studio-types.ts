/** Anagrafica e dati fatturazione del locale verso Menuary (B2B). */
export type StudioBillingProfile = {
  /** Nome commerciale locale (es. insegna) */
  tradeName: string;
  /** Ragione sociale legale */
  legalName: string;
  vatNumber: string;
  fiscalCode: string;
  sdiRecipientCode: string;
  pecEmail: string;
  /** Indirizzo sede legale / amministrativa, multilinea */
  legalAddress: string;
  /** Email operativa fatturazione */
  billingEmail: string;
};

export type StudioSubscriptionSummary = {
  planLabel: string;
  billingCycle: "mensile" | "annuale";
  nextRenewalIso: string;
  currency: "EUR";
  amountEur: number;
};
