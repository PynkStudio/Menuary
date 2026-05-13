import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Offerta",
  description:
    "Soluzioni Menuary per creare un sito personalizzato per ristoranti, con menu digitale, prenotazioni e ordini.",
};

const plans = [
  {
    name: "Presenza",
    price: "sito su misura",
    body: "Per ristoranti che vogliono essere scelti meglio online, con una presenza curata e coerente con il locale.",
    items: [
      "Dominio personalizzato",
      "Design costruito sulla tua identita",
      "Menu digitale aggiornabile",
      "Contatti, orari, foto e recensioni",
    ],
  },
  {
    name: "Operativita",
    price: "servizi collegati",
    body: "Per locali che vogliono trasformare il sito in uno strumento pratico per ricevere richieste e lavorare meglio.",
    featured: true,
    items: [
      "Prenotazioni e richieste dal sito",
      "Ordini da asporto o dal tavolo",
      "QR menu per sala e tavoli",
      "Flussi chiari per staff e cucina",
    ],
  },
  {
    name: "Crescita",
    price: "evoluzione continua",
    body: "Per ristoranti che vogliono partire bene e aggiungere funzioni quando il locale ne ha bisogno.",
    items: [
      "Nuove sezioni e campagne stagionali",
      "Funzioni attivabili nel tempo",
      "Miglioramenti tecnici centralizzati",
      "Supporto su contenuti e aggiornamenti",
    ],
  },
];

export default async function PricingPage() {
  if (getPlatformModeFromHost((await headers()).get("host")) !== "marketing") {
    notFound();
  }

  return (
    <div className="menuary-shell min-h-screen bg-[var(--menuary-paper)] px-5 py-10 text-[var(--menuary-ink)] sm:px-8 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <section className="max-w-4xl">
          <p className="menuary-eyebrow">
            offerta
          </p>
          <h1 className="menuary-display mt-5 text-[clamp(3.2rem,7vw,7rem)]">
            Parti dal sito giusto, aggiungi solo cio che serve davvero.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-9 text-[var(--menuary-muted)]">
            Ogni ristorante ha esigenze diverse. Menuary parte dalla tua identita e
            costruisce una presenza online coerente, poi collega menu, prenotazioni,
            ordini e gestione in base al modo in cui lavori.
          </p>
        </section>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={
                "flex rounded-[2rem] p-px shadow-[0_28px_80px_rgba(48,43,35,0.08)] " +
                (plan.featured ? "bg-[var(--menuary-copper)]" : "bg-[var(--menuary-line)]")
              }
            >
              <div
                className={
                  "flex min-h-[31rem] flex-1 flex-col rounded-[calc(2rem-1px)] p-7 " +
                  (plan.featured
                    ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                    : "bg-[var(--menuary-porcelain)] text-[var(--menuary-ink)]")
                }
              >
                <p
                  className={
                    "menuary-eyebrow " +
                    (plan.featured ? "text-[var(--menuary-gold)]" : "")
                  }
                >
                  {plan.name}
                </p>
                <p className="menuary-display mt-5 text-4xl">{plan.price}</p>
                <p
                  className={
                    "mt-4 text-sm leading-7 " +
                    (plan.featured ? "text-white/72" : "text-[var(--menuary-muted)]")
                  }
                >
                  {plan.body}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <span className={plan.featured ? "mt-1 text-[var(--menuary-gold)]" : "mt-1 text-[var(--menuary-copper)]"}>+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contatti"
                  className={
                    "menuary-button mt-auto " +
                    (plan.featured
                      ? "menuary-button-accent"
                      : "menuary-button-dark")
                  }
                >
                  Richiedi una proposta
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
