"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  captureAttribution,
  onConsentChange,
  readConsent,
  type ConsentState,
} from "@/lib/tracking/client";
import { hasThirdPartyTracking, type TrackingConfig } from "@/lib/tracking/types";
import { ConsentBanner } from "./consent-banner";

/**
 * Montato una volta nel root layout per ogni sito pubblico. Raccoglie la fonte
 * della visita (UTM, gclid, fbclid) e, solo dopo il consenso, carica GA4,
 * Google Ads e Meta Pixel con gli ID del sito corrente.
 */
export function TrackingProvider({ config }: { config: TrackingConfig }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [ready, setReady] = useState(false);
  const lastMetaPath = useRef<string | null>(null);
  const thirdParty = hasThirdPartyTracking(config);

  useEffect(() => {
    captureAttribution();
  }, [pathname]);

  useEffect(() => {
    setConsent(readConsent(config.siteKey));
    setReady(true);
    return onConsentChange(setConsent);
  }, [config.siteKey]);

  useEffect(() => {
    window.__mnTracking = { config, consent };
  }, [config, consent]);

  // Script già caricati restano in pagina: una scelta cambiata dopo il
  // caricamento passa dalle API di consenso di Google e Meta.
  useEffect(() => {
    if (!consent) return;
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: consent.analytics ? "granted" : "denied",
        ad_storage: consent.ads ? "granted" : "denied",
        ad_user_data: consent.ads ? "granted" : "denied",
        ad_personalization: consent.ads ? "granted" : "denied",
      });
    }
    if (window.fbq) window.fbq("consent", consent.ads ? "grant" : "revoke");
  }, [consent]);

  // Il pixel Meta non segue la navigazione client-side da solo; GA4 sì
  // (enhanced measurement sugli eventi di history).
  useEffect(() => {
    if (!consent?.ads || !config.metaPixelId || !window.fbq) return;
    if (lastMetaPath.current === null) {
      lastMetaPath.current = pathname;
      return;
    }
    if (lastMetaPath.current === pathname) return;
    lastMetaPath.current = pathname;
    window.fbq("track", "PageView");
  }, [pathname, consent?.ads, config.metaPixelId]);

  if (!thirdParty) return null;

  const googleTagId = config.ga4Id ?? config.googleAdsId;
  const loadGoogle = Boolean(googleTagId) && Boolean(
    (consent?.analytics && config.ga4Id) || (consent?.ads && config.googleAdsId),
  );
  const loadMeta = Boolean(consent?.ads && config.metaPixelId);

  return (
    <>
      {ready ? <ConsentBanner config={config} hasChoice={consent !== null} /> : null}
      {loadGoogle ? (
        <>
          <Script
            id="mn-gtag-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
            strategy="afterInteractive"
          />
          <Script id="mn-gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {
                analytics_storage: ${consent?.analytics ? "'granted'" : "'denied'"},
                ad_storage: ${consent?.ads ? "'granted'" : "'denied'"},
                ad_user_data: ${consent?.ads ? "'granted'" : "'denied'"},
                ad_personalization: ${consent?.ads ? "'granted'" : "'denied'"}
              });
              gtag('js', new Date());
              ${consent?.analytics && config.ga4Id ? `gtag('config', ${JSON.stringify(config.ga4Id)});` : ""}
              ${consent?.ads && config.googleAdsId ? `gtag('config', ${JSON.stringify(config.googleAdsId)});` : ""}
            `}
          </Script>
        </>
      ) : null}
      {loadMeta ? (
        <Script id="mn-meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', ${JSON.stringify(config.metaPixelId)});
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
    </>
  );
}
