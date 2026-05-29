"use client";

import type { DiningFormula } from "@/lib/tenant-dining-formulas";
import { formatEuro } from "@/lib/price-utils";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

function describeSchedule(f: DiningFormula): string {
  const days = f.days
    ? f.days.length === 5 && f.days.every((d) => d >= 1 && d <= 5)
      ? "Lun–Ven"
      : f.days.length === 2 && f.days.includes(0) && f.days.includes(6)
        ? "Sab–Dom"
        : f.days.map((d) => DAY_LABELS[d]).join(", ")
    : "Tutti i giorni";
  const window = f.from && f.to ? `${f.from}–${f.to}` : "";
  return [days, window].filter(Boolean).join(" · ");
}

export function DiningFormulasShowcase({
  formulas,
  eyebrow = "Le formule",
  title = "All You Can Eat",
}: {
  formulas: DiningFormula[];
  eyebrow?: string;
  title?: string;
}) {
  if (formulas.length === 0) return null;

  return (
    <section className="dining-formulas mb-16 space-y-6" aria-label={title}>
      <header className="space-y-2 border-b-2 border-pork-ink/10 pb-4">
        <span className="impact-title text-sm text-pork-red">{eyebrow}</span>
        <h2 className="headline text-4xl sm:text-5xl lg:text-6xl text-balance">
          {title}
        </h2>
        <p className="max-w-2xl text-sm text-pork-ink/65">
          Scegli la formula al tavolo: tutti i piatti del menu sotto sono inclusi nel prezzo
          della formula attiva. Non si ordinano singolarmente.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {formulas.map((f) => (
          <article
            key={f.id}
            className="dining-formula-card flex flex-col gap-3 rounded-2xl bg-pork-cream/60 p-5 ring-1 ring-pork-ink/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="headline text-2xl leading-tight">{f.name}</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-pork-ink/55">
                  {describeSchedule(f)}
                </p>
              </div>
              <div className="dining-formula-price shrink-0 rounded-lg bg-white px-2.5 py-1 text-sm font-black text-pork-red ring-1 ring-pork-ink/10">
                {formatEuro(f.price)}
              </div>
            </div>

            <p className="text-sm text-pork-ink/75">{f.description}</p>

            <div className="mt-auto flex items-center gap-2 pt-2 text-[11px] font-bold uppercase tracking-wider text-pork-ink/45">
              {f.signature && (
                <span className="dining-formula-badge rounded-full bg-pork-red/10 px-2 py-0.5 text-pork-red">
                  ★ Firma
                </span>
              )}
              {f.footnote && <span>{f.footnote}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
