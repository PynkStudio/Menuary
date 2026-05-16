import type { StudioBillingProfile, StudioSubscriptionSummary } from "@/lib/studio-types";

export const MOCK_BIZERY_STUDIO_BILLING: StudioBillingProfile = {
  tradeName: "Officina Rossi",
  legalName: "Officina Rossi S.r.l.",
  vatNumber: "IT09876543210",
  fiscalCode: "09876543210",
  sdiRecipientCode: "XXXXXXX",
  pecEmail: "officinaRossi@pec.example.it",
  legalAddress: "Via Artigiani 42\n20100 Milano (MI)\nItalia",
  billingEmail: "amministrazione@officinaRossi.it",
};

export const MOCK_BIZERY_STUDIO_SUBSCRIPTION: StudioSubscriptionSummary = {
  planLabel: "Bizery Pro · sito + appuntamenti + CRM",
  billingCycle: "mensile",
  nextRenewalIso: "2026-06-01",
  currency: "EUR",
  amountEur: 129,
};
