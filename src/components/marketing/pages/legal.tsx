import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingLegalPage } from "@/components/marketing/legal-page-layout";
import {
  buildMarketingCookieSections,
  buildMarketingPrivacySections,
  type MarketingBrandLegalInfo,
} from "@/lib/legal/marketing-legal-content";

const MENUARY_BRAND: MarketingBrandLegalInfo = {
  brandName: "Menuary",
  domain: "menuary.it",
  contactEmail: "hello@menuary.it",
};

export function MenuaryPrivacyPage() {
  return (
    <MarketingLegalPage
      Shell={MarketingShell}
      label="Privacy"
      title="Informativa sulla privacy"
      intro="Come trattiamo i dati personali raccolti attraverso il sito menuary.it: quali dati, per quali finalità, per quanto tempo e quali sono i tuoi diritti."
      sections={buildMarketingPrivacySections(MENUARY_BRAND)}
    />
  );
}

export function MenuaryCookiePage() {
  return (
    <MarketingLegalPage
      Shell={MarketingShell}
      label="Cookie"
      title="Cookie policy"
      intro="Quali cookie usa il sito menuary.it, a cosa servono e come puoi gestirli dal tuo browser."
      sections={buildMarketingCookieSections(MENUARY_BRAND)}
    />
  );
}
