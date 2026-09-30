"use client";

import { useEffect } from "react";
import { track as vercelTrack } from "@vercel/analytics";

/**
 * Eventi del funnel delle landing verticali. Stessi nomi su tutte le pagine,
 * con `landing` = slug del pain, così i report si confrontano per problema:
 * - landing_view        → pagina vista
 * - landing_cta_click   → clic su una CTA (`cta`: primary | secondary | final | related | ecosystem)
 * - demo_form_open      → form contatti aperto arrivando da una landing
 * - demo_request_sent   → richiesta inviata (la conversione `lead` parte dal form)
 *
 * Vercel Analytics è senza cookie; GA4 riceve l'evento solo con consenso analytics.
 */
export function trackLandingEvent(name: string, props: Record<string, string>) {
  // Gli eventi al mount possono precedere l'init di <Analytics />: senza coda
  // `track()` li scarta in silenzio. Stessa coda che crea la libreria.
  const w = window as unknown as { va?: (...args: unknown[]) => void; vaq?: unknown[][] };
  w.va ??= (...args: unknown[]) => {
    (w.vaq ??= []).push(args);
  };
  try {
    vercelTrack(name, props);
  } catch {
    // Analytics non caricato (sviluppo locale).
  }
  const state = window.__mnTracking;
  if (state?.consent?.analytics && state.config.ga4Id && window.gtag) {
    window.gtag("event", name, { send_to: state.config.ga4Id, ...props });
  }
}

/**
 * Montato una volta per landing: registra la vista e i clic su `[data-landing-cta]`.
 * UTM e click ID restano nell'attribuzione di sessione catturata all'atterraggio
 * (`captureAttribution`): non vanno ricopiati sui link, altrimenti /contatti li
 * ricattura come nuova campagna e `landing_path` perde la landing d'ingresso.
 */
export function LandingTracker({ landing }: { landing: string }) {
  useEffect(() => {
    trackLandingEvent("landing_view", { landing });

    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-landing-cta]");
      if (!target) return;
      trackLandingEvent("landing_cta_click", {
        landing,
        cta: target.dataset.landingCta ?? "unknown",
        target: target.getAttribute("href") ?? "",
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [landing]);

  return null;
}
