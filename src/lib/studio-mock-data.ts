import type { StudioBillingProfile, StudioSubscriptionSummary } from "@/lib/studio-types";

export const MOCK_STUDIO_BILLING: StudioBillingProfile = {
  tradeName: "Be Pork",
  legalName: "Be Pork S.r.l.",
  vatNumber: "IT01234567890",
  fiscalCode: "01234567890",
  sdiRecipientCode: "XXXXXXX",
  pecEmail: "bepork@pec.example.it",
  legalAddress: "Via Esempio 1\n70100 Bari (BA)\nItalia",
  billingEmail: "amministrazione@bepork.it",
};

export const MOCK_STUDIO_SUBSCRIPTION: StudioSubscriptionSummary = {
  planLabel: "Menuary Pro · sito + menu + ordini",
  billingCycle: "mensile",
  nextRenewalIso: "2026-06-01",
  currency: "EUR",
  amountEur: 189,
};
