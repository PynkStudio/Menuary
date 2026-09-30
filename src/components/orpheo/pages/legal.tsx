import { OrpheoShell } from "@/components/orpheo/orpheo-shell";
import { MarketingLegalPage } from "@/components/marketing/legal-page-layout";
import {
  buildMarketingCookieSections,
  buildMarketingPrivacySections,
  type MarketingBrandLegalInfo,
} from "@/lib/legal/marketing-legal-content";
import { resolveTrackingConfig } from "@/lib/tracking/config";

const SITE_TRACKING = resolveTrackingConfig("marketing-orpheo", undefined);

const ORPHEO_BRAND: MarketingBrandLegalInfo = {
  brandName: "Orpheo",
  domain: "weuseorpheo.com",
  contactEmail: "hello@weuseorpheo.com",
};

export function OrpheoPrivacyPage() {
  return (
    <MarketingLegalPage
      Shell={OrpheoShell}
      label="Privacy"
      title="Informativa sulla privacy"
      intro="Come trattiamo i dati personali raccolti attraverso il sito weuseorpheo.com: quali dati, per quali finalità, per quanto tempo e quali sono i tuoi diritti."
      sections={buildMarketingPrivacySections(ORPHEO_BRAND, SITE_TRACKING)}
    />
  );
}

export function OrpheoCookiePage() {
  return (
    <MarketingLegalPage
      Shell={OrpheoShell}
      label="Cookie"
      title="Cookie policy"
      intro="Quali cookie usa il sito weuseorpheo.com, a cosa servono e come puoi gestirli dal tuo browser."
      sections={buildMarketingCookieSections(ORPHEO_BRAND, SITE_TRACKING)}
    />
  );
}
