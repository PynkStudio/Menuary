import type { ComponentType, ReactNode } from "react";
import type { LegalSection } from "@/lib/legal/marketing-legal-content";

/**
 * Layout condiviso per le pagine privacy/cookie dei siti di piattaforma
 * (Menuary, Bizery, Orpheo): stessa struttura, brandizzata dallo Shell del
 * chiamante e dai token CSS --menuary-* che quello Shell imposta.
 */
export function MarketingLegalPage({
  Shell,
  label,
  title,
  intro,
  sections,
}: {
  Shell: ComponentType<{ children: ReactNode }>;
  label: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <Shell>
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-16 lg:pt-28 lg:pb-20">
          <p className="menuary-section-label">{label}</p>
          <h1
            className="mt-7 max-w-3xl text-[clamp(2.6rem,5.5vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-balance"
            style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
          >
            {title}
          </h1>
          <p className="mt-7 max-w-2xl text-[15px] leading-7 text-[var(--menuary-muted)]">
            {intro}
          </p>
        </div>
      </section>

      <section>
        <div className="menuary-container max-w-3xl py-16 lg:py-24">
          {sections.map((section, i) => (
            <article
              key={section.title}
              className="grid gap-4 border-b border-[var(--menuary-line)] py-10 first:pt-0 last:border-0 sm:grid-cols-[auto_1fr] sm:gap-10"
            >
              <span className="menuary-index">— {String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2
                  className="text-2xl font-medium"
                  style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                >
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-[15px] leading-7 text-[var(--menuary-muted)]">
                    {paragraph}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3 text-[15px] leading-7 text-[var(--menuary-muted)]">
                        <span className="mt-[11px] h-1 w-4 shrink-0 rounded-full bg-[var(--menuary-copper)]" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}
