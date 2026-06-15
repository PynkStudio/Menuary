import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { FAQSection, FinalCTASection } from "@/components/marketing/marketing-sections";
import { getLocale, getTranslations } from "@/i18n";
import { localizedPath } from "@/lib/marketing-seo";

export async function MarketingAboutPage() {
  const t = (await getTranslations("marketing")).about;
  const locale = await getLocale();

  return (
    <MarketingShell>
      {/* HERO */}
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-20 lg:pt-28 lg:pb-24">
          <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">{t.hero.label}</p>
              <h1 className="menuary-display mt-7 text-[clamp(3rem,6.8vw,6rem)] text-balance">
                {t.hero.h1a}
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  {t.hero.h1b}
                </span>
              </h1>
            </div>
            <p className="menuary-fade-up menuary-fade-up-d1 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:text-right">
              {t.hero.sub}
            </p>
          </div>
        </div>
      </section>

      {/* MANIFESTO + PRINCIPI */}
      <section>
        <div className="menuary-container py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
            <div>
              <p className="menuary-section-label">{t.manifesto.label}</p>
              <p className="menuary-quote mt-8">{t.manifesto.quote}</p>
              <p className="mt-8 text-[15px] leading-7 text-[var(--menuary-muted)]">
                {t.manifesto.body}
              </p>
            </div>

            <div className="border-t border-[var(--menuary-line)]">
              {t.principles.map((p, i) => (
                <div
                  key={p.title}
                  className="grid gap-4 border-b border-[var(--menuary-line)] py-8 sm:grid-cols-[auto_1fr] sm:gap-10"
                >
                  <span className="menuary-index">— {String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="menuary-display text-2xl">{p.title}</h3>
                    <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--menuary-muted)]">
                      {p.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PERCHÉ NEL 2026 */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div>
              <p className="menuary-section-label">{t.why.label}</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)] text-balance">
                {t.why.h2a}
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  {t.why.h2b}
                </span>
              </h2>
              <p className="mt-7 max-w-md text-[15px] leading-[1.75] text-[var(--menuary-muted)]">
                {t.why.sub}
              </p>
              <Link href={localizedPath("/contatti", locale)} className="menuary-link mt-8 inline-flex">
                {t.why.cta}
                <ArrowUpRight size={14} strokeWidth={1.6} />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {t.why.items.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-6"
                >
                  <h3 className="menuary-display text-[1.25rem] leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-[var(--menuary-muted)]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COME NASCE UN SITO */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:gap-24">
            <div>
              <p className="menuary-section-label">{t.process.label}</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.4vw,3.8rem)] text-balance">
                {t.process.h2a}
                <br />
                {t.process.h2b}
              </h2>
              <p className="mt-6 text-[15px] leading-[1.75] text-[var(--menuary-muted)]">
                {t.process.sub}
              </p>
            </div>

            <ol className="border-t border-[var(--menuary-line)]">
              {t.process.steps.map((step) => (
                <li
                  key={step.n}
                  className="grid gap-6 border-b border-[var(--menuary-line)] py-8 sm:grid-cols-[auto_1fr] sm:gap-10"
                >
                  <span className="menuary-display text-[var(--menuary-copper)] text-base font-medium">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="menuary-display text-2xl">{step.title}</h3>
                    <p className="mt-3 text-[15px] leading-7 text-[var(--menuary-muted)]">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* COSA OFFRIAMO */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">{t.offer.label}</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">
                {t.offer.h2a}
                <br />
                {t.offer.h2b}
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)]">
                {t.offer.sub}
              </p>
            </div>

            <ul className="grid gap-px border-t border-[var(--menuary-line)] sm:grid-cols-2">
              {t.offer.items.map((item) => (
                <li
                  key={item.title}
                  className="border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-8 sm:border-l sm:first:border-l-0 sm:[&:nth-child(2)]:border-l"
                >
                  <h3 className="menuary-display text-2xl">{item.title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-[var(--menuary-muted)]">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TEMPLATE VS CUSTOM */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-28">
          <p className="menuary-section-label text-center mb-14">{t.compare.label}</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:gap-10 max-w-4xl mx-auto">
            <div className="rounded-3xl border border-[var(--menuary-line)] p-8 bg-[var(--menuary-porcelain)]">
              <h3 className="menuary-display text-2xl text-[var(--menuary-muted)]">
                {t.compare.templateTitle}
              </h3>
              <ul className="mt-7 space-y-4 text-[15px] text-[var(--menuary-muted)]">
                {t.compare.templateItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 shrink-0 text-[var(--menuary-line)] select-none">×</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[var(--menuary-ink)] bg-[var(--menuary-paper)] p-8">
              <h3 className="menuary-display text-2xl">{t.compare.customTitle}</h3>
              <ul className="mt-7 space-y-4 text-[15px]">
                {t.compare.customItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-[var(--menuary-sage)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection items={t.faq.items} kicker={t.faq.kicker} title={t.faq.title} />

      {/* CTA */}
      <FinalCTASection />
    </MarketingShell>
  );
}
