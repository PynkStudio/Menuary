import { BizeryShell } from "@/components/bizery/bizery-shell";
import { MarketingLegalPage } from "@/components/marketing/legal-page-layout";
import {
  buildMarketingCookieSections,
  buildMarketingPrivacySections,
  type MarketingBrandLegalInfo,
} from "@/lib/legal/marketing-legal-content";

const BIZERY_BRAND: MarketingBrandLegalInfo = {
  brandName: "Bizery",
  domain: "bizery.it",
  contactEmail: "hello@bizery.it",
};

export function BizeryPrivacyPage() {
  return (
    <MarketingLegalPage
      Shell={BizeryShell}
      label="Privacy"
      title="Informativa sulla privacy"
      intro="Come trattiamo i dati personali raccolti attraverso il sito bizery.it: quali dati, per quali finalità, per quanto tempo e quali sono i tuoi diritti."
      sections={buildMarketingPrivacySections(BIZERY_BRAND)}
    />
  );
}

export function BizeryCookiePage() {
  return (
    <MarketingLegalPage
      Shell={BizeryShell}
      label="Cookie"
      title="Cookie policy"
      intro="Quali cookie usa il sito bizery.it, a cosa servono e come puoi gestirli dal tuo browser."
      sections={buildMarketingCookieSections(BIZERY_BRAND)}
    />
  );
}
