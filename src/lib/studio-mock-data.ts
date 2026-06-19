import type { StudioBillingProfile, StudioSubscriptionSummary } from "@/lib/studio-types";

export const MOCK_STUDIO_BILLING: StudioBillingProfile = {
  tradeName: "ThePork",
  legalName: "ThePork Demo S.r.l.",
  vatNumber: "IT01234567890",
  fiscalCode: "01234567890",
  sdiRecipientCode: "XXXXXXX",
  pecEmail: "thepork@pec.example.it",
  legalAddress: "Via Demo 1\n00000 Citta Demo (DM)\nItalia",
  billingEmail: "amministrazione@thepork.example",
};

export const MOCK_STUDIO_SUBSCRIPTION: StudioSubscriptionSummary = {
  planLabel: "Menuary Pro · sito + menu + ordini",
  billingCycle: "mensile",
  nextRenewalIso: "2026-06-01",
  currency: "EUR",
  amountEur: 189,
};
