"use client";

import { Scale } from "lucide-react";

export const PYNK_LEGAL_PARTNER = {
  name: "Studio Legale Aranzulla",
  url: "https://www.studiolegalearanzulla.it",
} as const;

export function PynkLegalPartnerNote() {
  return (
    <section className="pynk-section">
      <div className="pynk-container">
        <div className="pynk-panel pynk-panel-sm">
          <div className="pynk-panel-icon pynk-panel-icon-soft">
            <Scale className="pynk-icon-sm" />
          </div>
          <h3 className="pynk-panel-title-sm">Partnership legale</h3>
          <p className="pynk-panel-desc-sm">
            Gli aspetti legali e normativi di questo servizio — privacy, contratti, adempimenti e obblighi
            dell&apos;AI Act — sono curati in collaborazione con lo{" "}
            <a href={PYNK_LEGAL_PARTNER.url} target="_blank" rel="noopener noreferrer">
              {PYNK_LEGAL_PARTNER.name}
            </a>
            , studio specializzato in diritto IT e delle nuove tecnologie.
          </p>
        </div>
      </div>
    </section>
  );
}
