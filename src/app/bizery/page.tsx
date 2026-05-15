/**
 * Marketing page per bizery.it — verticale services (aziende non-HORECA).
 * Accessibile via: bizery.it → middleware rewrite su /bizery
 */
export default function BizeryMarketingPage() {
  return (
    <main className="min-h-screen bg-[var(--tenant-cream,#F0F5FF)] text-[var(--tenant-ink,#0F172A)]">
      {/* Hero */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] opacity-40">
          Bizery
        </p>
        <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
          La piattaforma digitale per la tua azienda
        </h1>
        <p className="mt-6 max-w-xl text-lg opacity-60">
          Sito, prenotazioni, listino servizi, CRM e gestione team — tutto in un
          unico strumento pensato per le aziende di servizi.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://gestione.bizery.it"
            className="rounded-xl px-8 py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--tenant-red, #2563EB)" }}
          >
            Accedi al pannello
          </a>
          <a
            href="#scopri"
            className="rounded-xl border border-current/20 px-8 py-3.5 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
          >
            Scopri di più
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="scopri" className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Tutto quello che ti serve, subito
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-white p-6 shadow-sm shadow-black/5"
            >
              <div
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: "var(--tenant-peach, #DBEAFE)" }}
              >
                {f.icon}
              </div>
              <h3 className="mb-1 font-bold">{f.title}</h3>
              <p className="text-sm opacity-60">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-[var(--tenant-red,#2563EB)] px-6 py-20 text-center text-white">
        <h2 className="text-3xl font-bold">Pronto a digitalizzare la tua azienda?</h2>
        <p className="mt-4 opacity-80">
          Contattaci per attivare il tuo spazio Bizery.
        </p>
        <a
          href="mailto:hello@bizery.it"
          className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[var(--tenant-red,#2563EB)] transition-opacity hover:opacity-90"
        >
          Scrivici
        </a>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-xs opacity-30">
        Bizery · Powered by Menuary Platform
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    icon: "🌐",
    title: "Sito aziendale",
    description: "Pagine, contatti, orari e brand — pubblicati in pochi minuti.",
  },
  {
    icon: "📅",
    title: "Appuntamenti online",
    description: "Agenda integrata con conferma automatica e promemoria ai clienti.",
  },
  {
    icon: "📋",
    title: "Listino servizi",
    description: "Catalogo digitale consultabile da sito, QR code e link diretto.",
  },
  {
    icon: "👥",
    title: "CRM e fidelity",
    description: "Storico clienti, coupon, compleanno e preferenze in un click.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description: "Report su prenotazioni, servizi più richiesti e andamento mensile.",
  },
  {
    icon: "🏢",
    title: "Multi-sede",
    description: "Gestisci più sedi con un unico account e report comparativi.",
  },
];
