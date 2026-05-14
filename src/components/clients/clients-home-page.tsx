import Link from "next/link";
import { clientsSite } from "@/lib/clients-config";

const CARDS = [
  {
    title: "Profilo",
    body: "Nome, contatti, data di nascita, allergie e preferenze alimentari.",
    href: clientsSite.paths.profile,
  },
  {
    title: "Privacy e consensi",
    body: "Marketing Menuary e marketing dei singoli ristoranti.",
    href: clientsSite.paths.consents,
  },
  {
    title: "Dati con i ristoranti",
    body: "Elenco locali con cui hai condiviso dati e richiesta rimozione.",
    href: clientsSite.paths.restaurants,
  },
  {
    title: "Ordini",
    body: "Storico ordini e canale (asporto, tavolo, …).",
    href: clientsSite.paths.orders,
  },
] as const;

export function ClientsHomePage() {
  return (
    <div>
      <p className="menuary-section-label">Portale clienti</p>
      <h1 className="menuary-display mt-4 text-[clamp(2rem,5vw,3.2rem)]">
        Il tuo account Menuary
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--menuary-muted)]">
        Un unico posto per profilo, consensi privacy, relazione con i locali e storico ordini. Le
        azioni di scrittura saranno collegate a Supabase e RLS.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="menuary-card block rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
          >
            <h2 className="menuary-display text-xl">{c.title}</h2>
            <p className="mt-3 text-sm text-[var(--menuary-muted)]">{c.body}</p>
            <span className="menuary-link mt-5 inline-flex text-sm">Apri →</span>
          </Link>
        ))}
      </div>
      <div className="mt-12">
        <Link href={clientsSite.paths.login} className="menuary-button menuary-button-dark">
          Vai al login
        </Link>
      </div>
    </div>
  );
}
