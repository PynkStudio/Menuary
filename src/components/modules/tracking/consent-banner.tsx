"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { onOpenConsentPreferences, writeConsent } from "@/lib/tracking/client";
import type { TrackingConfig } from "@/lib/tracking/types";
import { getConsentCopy } from "./consent-copy";

/**
 * Banner di consenso del modulo tracking. L'aspetto viene dai token
 * `--consent-*` che ogni brand/tenant può ridefinire nel proprio foglio di
 * stile; senza override eredita i colori tema del tenant (`--tenant-*`).
 *
 * Portale sul body: il PageTransitionShell applica un transform che romperebbe
 * `position: fixed`.
 */
export function ConsentBanner({ config, hasChoice }: { config: TrackingConfig; hasChoice: boolean }) {
  const [open, setOpen] = useState(!hasChoice);
  const [lang, setLang] = useState("it");

  useEffect(() => {
    setLang(document.documentElement.lang || "it");
    return onOpenConsentPreferences(() => setOpen(true));
  }, []);

  if (!open) return null;
  const copy = getConsentCopy(lang);
  const providers = [
    config.ga4Id ? "Google Analytics" : null,
    config.googleAdsId ? "Google Ads" : null,
    config.metaPixelId ? "Meta Pixel" : null,
    config.openaiPixelId ? "OpenAI Ads" : null,
  ].filter(Boolean);

  function choose(granted: boolean) {
    writeConsent(config.siteKey, { analytics: granted, ads: granted });
    setOpen(false);
  }

  return createPortal(
    <div className="mn-consent" role="dialog" aria-modal="false" aria-labelledby="mn-consent-title">
      <div className="mn-consent-card">
        <p id="mn-consent-title" className="mn-consent-title">{copy.title}</p>
        <p className="mn-consent-body">
          {copy.body}{" "}
          {providers.length ? <span className="mn-consent-providers">{providers.join(" · ")}. </span> : null}
          {config.cookiePolicyHref ? (
            <a href={config.cookiePolicyHref} className="mn-consent-link">
              {copy.policy}
            </a>
          ) : null}
        </p>
        <div className="mn-consent-actions">
          <button type="button" className="mn-consent-button" onClick={() => choose(false)}>
            {copy.reject}
          </button>
          <button type="button" className="mn-consent-button" data-primary onClick={() => choose(true)}>
            {copy.accept}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
