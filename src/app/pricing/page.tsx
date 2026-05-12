import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getPlatformModeFromHost } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pacchetti Menuary per sito ristorante, preview commerciali e moduli operativi.",
};

const plans = [
  {
    name: "Launch",
    price: "da definire",
    body: "Per portare online il primo tenant con identita, menu e pagine essenziali.",
    items: [
      "Dominio custom tenant",
      "Sito pubblico completo",
      "Area admin locale",
      "Preview demo iniziale",
    ],
  },
  {
    name: "Operate",
    price: "modulare",
    body: "Per locali che vogliono attivare processi digitali operativi.",
    featured: true,
    items: [
      "Ordini asporto",
      "Ordini al tavolo",
      "Tavoli e QR",
      "Schermo cucina",
    ],
  },
  {
    name: "Scale",
    price: "su misura",
    body: "Per gruppi, rollout multi-sede e pipeline demo/outreach strutturata.",
    items: [
      "Più tenant gestiti insieme",
      "Feature flag per cliente",
      "Processo demo > go-live",
      "Supporto evolutivo",
    ],
  },
];

export default async function PricingPage() {
  if (getPlatformModeFromHost((await headers()).get("host")) !== "marketing") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f7f2eb] px-5 py-10 text-[#17120f] sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <section className="max-w-4xl">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7f6258] ring-1 ring-black/5">
            pricing
          </p>
          <h1 className="headline mt-5 text-6xl sm:text-7xl">
            Un impianto unico, con intensita diverse in base al ristorante.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-black/68">
            La struttura commerciale può essere rifinita dopo la validazione del mercato.
            Intanto il sito distingue chiaramente setup, moduli operativi e scala multi-tenant.
          </p>
        </section>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={
                "rounded-[2rem] p-2 shadow-[0_28px_80px_rgba(20,16,16,0.08)] ring-1 ring-black/5 " +
                (plan.featured ? "bg-[#b8332e]" : "bg-white")
              }
            >
              <div
                className={
                  "flex h-full flex-col rounded-[1.7rem] p-6 " +
                  (plan.featured
                    ? "bg-[#8e2420] text-white"
                    : "bg-white text-[#17120f]")
                }
              >
                <p
                  className={
                    "impact-title text-sm " +
                    (plan.featured ? "text-[#f5c518]" : "text-[#b8332e]")
                  }
                >
                  {plan.name}
                </p>
                <p className="headline mt-3 text-4xl">{plan.price}</p>
                <p
                  className={
                    "mt-4 text-sm leading-7 " +
                    (plan.featured ? "text-white/72" : "text-black/66")
                  }
                >
                  {plan.body}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <CheckCircle2
                        size={17}
                        className={plan.featured ? "mt-0.5 text-[#f5c518]" : "mt-0.5 text-[#b8332e]"}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contatti"
                  className={
                    "group mt-8 inline-flex items-center justify-center gap-3 rounded-full px-5 py-3 font-bold transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 " +
                    (plan.featured
                      ? "bg-white text-[#8e2420]"
                      : "bg-[#17120f] text-white")
                  }
                >
                  Parliamo di questo
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                    <ArrowRight size={16} />
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
