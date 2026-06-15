"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Phone, ArrowRight } from "lucide-react";
import {
  PRICING_PLANS,
  AI_ADDON,
  annualSaving,
  type PricingAddon,
  type PricingPlan,
} from "@/lib/platform-pricing";
import type { AppLocale } from "@/i18n";
import { localizedPath } from "@/lib/marketing-seo";
import { getPlanLabels, localizePricingPlanName } from "@/lib/localized-commercial-copy";

type CompareRow = { label: string; presence: string; booking: string; ops: string };
type FaqItem = { q: string; a: string };
type Conditions = { title: string; body: string }[];

export type PricingCopy = {
  hero: { label: string; h1a: string; h1b: string; sub: string };
  billing: {
    annual: string;
    monthly: string;
    savings: string;
    vatNoteAnnual: string;
    vatNoteMonthly: string;
  };
  card: {
    mostChosen: string;
    perMonth: string;
    annualBilling: string;
    annualSaving: string;
    monthlyWithAnnual: string;
    monthlyWithAnnualSaving: string;
    ctaDefault: string;
  };
  ai: {
    label: string;
    h2: string;
    perMonth: string;
    quotaTitle: string;
    quotaBody: string;
    cta: string;
  };
  conditions: { label: string; items: Conditions };
  compare: {
    label: string;
    h2: string;
    sub: string;
    headerFunction: string;
    rows: CompareRow[];
  };
  faq: { title: string; items: FaqItem[] };
};

export function MarketingPricingPage({
  plans = PRICING_PLANS,
  aiAddon = AI_ADDON,
  locale = "it",
  priceLocale = "it-IT",
  copy,
}: {
  plans?: PricingPlan[];
  aiAddon?: PricingAddon;
  locale?: AppLocale;
  priceLocale?: string;
  copy: PricingCopy;
}) {
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");
  const maxSaving = Math.max(...plans.map(annualSaving));
  const displayCurrency = plans[0]?.currency ?? "EUR";
  const [, bookingName] = getPlanLabels(locale, "food");

  return (
    <>
      {/* HERO */}
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-20 lg:pt-28 lg:pb-24">
          <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">{copy.hero.label}</p>
              <h1 className="menuary-display mt-7 text-[clamp(3rem,6.8vw,6rem)] text-balance">
                {copy.hero.h1a}
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  {copy.hero.h1b}
                </span>
              </h1>
            </div>
            <p className="menuary-fade-up menuary-fade-up-d1 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:text-right">
              {copy.hero.sub}
            </p>
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section>
        <div className="menuary-container py-20 lg:py-24">
          {/* Toggle fatturazione */}
          <div className="mb-14 flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex items-center gap-1 rounded-full border border-[var(--menuary-line)] p-1">
              <button
                onClick={() => setBilling("annual")}
                className={
                  "rounded-full px-5 py-2 text-sm font-semibold transition " +
                  (billing === "annual"
                    ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                    : "text-[var(--menuary-muted)] hover:text-[var(--menuary-ink)]")
                }
              >
                {copy.billing.annual}
              </button>
              <button
                onClick={() => setBilling("monthly")}
                className={
                  "rounded-full px-5 py-2 text-sm font-semibold transition " +
                  (billing === "monthly"
                    ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                    : "text-[var(--menuary-muted)] hover:text-[var(--menuary-ink)]")
                }
              >
                {copy.billing.monthly}
              </button>
            </div>
            {billing === "annual" && maxSaving > 0 && (
              <p className="text-xs font-semibold text-[var(--menuary-sage)]">
                {copy.billing.savings.replace(
                  "{amount}",
                  formatPlanPrice(maxSaving, displayCurrency, priceLocale),
                )}
              </p>
            )}
          </div>

          <div className="grid gap-px sm:gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.slug}
                plan={plan}
                billing={billing}
                locale={locale}
                priceLocale={priceLocale}
                copy={copy.card}
              />
            ))}
          </div>

          <p className="mt-10 text-center text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
            {billing === "annual" ? copy.billing.vatNoteAnnual : copy.billing.vatNoteMonthly}
          </p>
        </div>
      </section>

      {/* AI ADD-ON */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-20 lg:py-24">
          <div className="grid items-start gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">
                {copy.ai.label.replace("{plan}", bookingName)}
              </p>
              <h2 className="menuary-display mt-6 text-[clamp(2rem,4.2vw,3.4rem)] text-balance">
                {copy.ai.h2}
              </h2>
              <p className="mt-6 text-[17px] leading-[1.75] text-[var(--menuary-muted)]">
                {aiAddon.description}
              </p>
              <div className="mt-8 inline-flex items-baseline gap-2">
                <span className="menuary-display text-[3rem] leading-none">
                  +{formatPlanPrice(aiAddon.monthly, aiAddon.currency ?? displayCurrency, priceLocale)}
                </span>
                <span className="text-sm text-[var(--menuary-muted)]">{copy.ai.perMonth}</span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-[1.65] text-[var(--menuary-muted)]">
                {aiAddon.minutesNote}
              </p>
              <Link href={localizedPath("/contatti", locale)} className="menuary-link mt-7 inline-flex">
                {copy.ai.cta}
                <ArrowRight size={14} strokeWidth={1.8} className="ml-1" />
              </Link>
            </div>

            <div className="rounded-3xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
                  <Phone size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    {aiAddon.tagline}
                  </p>
                  <p className="menuary-display text-base">{aiAddon.marketing_name}</p>
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {aiAddon.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-[1.5]">
                    <Check
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-[var(--menuary-sage)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-xl bg-[var(--menuary-ink)]/5 p-4 text-sm leading-[1.6] text-[var(--menuary-ink)]">
                <span className="font-semibold">{copy.ai.quotaTitle}</span>{" "}
                {copy.ai.quotaBody}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NOTE COMMERCIALI */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-16 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="menuary-section-label mb-6">{copy.conditions.label}</p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-[14px] leading-7 text-[var(--menuary-muted)]">
              {copy.conditions.items.map((c) => (
                <div key={c.title}>
                  <p className="mb-2 font-semibold text-[var(--menuary-ink)]">{c.title}</p>
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">{copy.compare.label}</p>
              <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.4vw,3.6rem)]">
                {copy.compare.h2}
              </h2>
              <p className="mt-6 max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
                {copy.compare.sub}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left text-[15px]">
                <thead>
                  <tr className="border-b border-[var(--menuary-ink)]">
                    <th className="py-4 pr-4 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-semibold">
                      {copy.compare.headerFunction}
                    </th>
                    <th className="py-4 px-4 text-center font-semibold">
                      {getPlanLabels(locale, "food")[0]}
                    </th>
                    <th className="py-4 px-4 text-center font-semibold text-[var(--menuary-copper)]">
                      {bookingName}
                    </th>
                    <th className="py-4 pl-4 text-center font-semibold">
                      {getPlanLabels(locale, "food")[2]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {copy.compare.rows.map((row) => (
                    <tr key={row.label} className="border-b border-[var(--menuary-line)]">
                      <td className="py-4 pr-4">{row.label}</td>
                      <td className="py-4 px-4 text-center"><CellMark value={row.presence} /></td>
                      <td className="py-4 px-4 text-center"><CellMark value={row.booking} /></td>
                      <td className="py-4 pl-4 text-center"><CellMark value={row.ops} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  billing,
  locale,
  priceLocale,
  copy,
}: {
  plan: PricingPlan;
  billing: "annual" | "monthly";
  locale: AppLocale;
  priceLocale: string;
  copy: PricingCopy["card"];
}) {
  const price = billing === "annual" ? plan.price_annual : plan.price_monthly;
  const saving = annualSaving(plan);
  const currency = plan.currency ?? "EUR";
  const planName = localizePricingPlanName(plan, locale, "food");

  return (
    <article
      className={
        "relative flex flex-col gap-6 border bg-[var(--menuary-porcelain)] p-8 sm:p-10 transition-colors " +
        (plan.is_featured
          ? "border-[var(--menuary-copper)] bg-[var(--menuary-paper)] lg:-translate-y-2"
          : "border-[var(--menuary-line)] hover:border-[var(--menuary-ink)]/40")
      }
    >
      {plan.is_featured && (
        <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-[var(--menuary-copper)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
          {copy.mostChosen}
        </span>
      )}

      <div>
        <h2 className="menuary-display text-3xl">{planName}</h2>
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)]">
          {plan.tagline}
        </p>
      </div>

      {/* Prezzo */}
      <div>
        <span className="menuary-price-tag">
          <span className="amount">{formatPlanPrice(price, currency, priceLocale)}</span>
          <span className="unit">{copy.perMonth}</span>
        </span>
        {billing === "annual" ? (
          <p className="mt-2 text-xs text-[var(--menuary-muted)]">
            {copy.annualBilling}
            {saving > 0 && (
              <span className="ml-1 font-semibold text-[var(--menuary-sage)]">
                {" "}
                {copy.annualSaving.replace("{amount}", formatPlanPrice(saving, currency, priceLocale))}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-2 text-xs text-[var(--menuary-muted)]">
            {copy.monthlyWithAnnual}{" "}
            <span className="font-semibold text-[var(--menuary-sage)]">
              {copy.monthlyWithAnnualSaving
                .replace("{price}", formatPlanPrice(plan.price_annual, currency, priceLocale))
                .replace("{amount}", formatPlanPrice(saving, currency, priceLocale))}
            </span>
          </p>
        )}
      </div>

      <p className="text-[15px] leading-7 text-[var(--menuary-muted)]">
        {plan.description}
      </p>

      <ul className="space-y-3 text-[15px]">
        {plan.marketing_items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <Check
              size={16}
              strokeWidth={2}
              className="mt-1 shrink-0 text-[var(--menuary-copper)]"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        href={localizedPath("/contatti", locale)}
        className={
          "mt-2 inline-flex items-center justify-center gap-2 " +
          (plan.is_featured
            ? "menuary-button menuary-button-accent"
            : "menuary-button menuary-button-light")
        }
      >
        {plan.cta_label ?? copy.ctaDefault}
        <ArrowRight size={15} strokeWidth={2} />
      </Link>
    </article>
  );
}

function formatPlanPrice(amount: number, currency = "EUR", locale = "it-IT"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── CellMark ─────────────────────────────────────────────────────────────────

function CellMark({ value }: { value: string }) {
  if (value === "true") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--menuary-sage)]/15 text-[var(--menuary-sage)]">
        <Check size={14} strokeWidth={2} />
      </span>
    );
  }
  if (value === "false") {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--menuary-line)] text-[var(--menuary-muted)]">
        <Minus size={14} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="text-[13px] font-semibold text-[var(--menuary-copper)]">
      {value}
    </span>
  );
}
