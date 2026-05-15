import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { BizeryShell } from "@/components/bizery/bizery-shell";

export function BizeryContattiPage() {
  return (
    <BizeryShell>
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-20 lg:pt-28 lg:pb-24">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24 lg:items-start">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Contatti</p>
              <h1
                className="mt-7 text-[clamp(3rem,6.5vw,5.8rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Parliamo della
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  tua azienda.
                </span>
              </h1>
              <p className="mt-8 max-w-md text-[17px] leading-[1.75] text-[var(--menuary-muted)]">
                Prima chiamata gratuita. Nessun impegno, nessun preventivo generico:
                capiamo insieme di cosa hai bisogno e ti proponiamo il piano giusto.
              </p>

              <div className="mt-12 space-y-6">
                <ContactRow
                  icon={Mail}
                  label="Email"
                  value="hello@bizery.it"
                  href="mailto:hello@bizery.it"
                />
                <ContactRow
                  icon={Phone}
                  label="Telefono"
                  value="+39 351 376 8607"
                  href="tel:+393513768607"
                />
                <ContactRow
                  icon={MapPin}
                  label="Studio"
                  value="Milano, Italia"
                  href="https://pynkstudio.it"
                  external
                />
              </div>

              <div className="mt-12 border-t border-[var(--menuary-line)] pt-10">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                  Anche su Menuary · Food
                </p>
                <p className="mt-3 text-[14px] leading-6 text-[var(--menuary-muted)]">
                  Se hai un ristorante, pizzeria o bar, dai un&apos;occhiata a{" "}
                  <a
                    href="https://menuary.it"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[var(--menuary-ink)] underline decoration-[var(--menuary-copper)] underline-offset-4"
                  >
                    menuary.it
                  </a>
                  , la piattaforma sorella per il settore food e HORECA.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="menuary-fade-up menuary-fade-up-d1">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </BizeryShell>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-4">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--menuary-porcelain)]">
        <Icon size={18} strokeWidth={1.6} className="text-[var(--menuary-copper)]" />
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--menuary-muted)]">{label}</p>
        <p className="mt-0.5 font-semibold text-[var(--menuary-ink)]">{value}</p>
      </div>
      <ArrowUpRight size={15} strokeWidth={1.6} className="ml-auto text-[var(--menuary-muted)]" />
    </div>
  );

  const cls = "block border border-[var(--menuary-line)] px-5 py-4 transition-colors hover:border-[var(--menuary-copper)]/50";

  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
  return <a href={href} className={cls}>{inner}</a>;
}

function ContactForm() {
  return (
    <form
      action="https://formspree.io/f/hello@bizery.it"
      method="POST"
      className="space-y-5 border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-8 lg:p-10"
    >
      <h2
        className="text-2xl font-medium tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
      >
        Richiedi una proposta
      </h2>
      <p className="text-[14px] leading-6 text-[var(--menuary-muted)]">
        Compila il modulo e ti ricontattiamo entro 24 ore lavorative.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Nome</span>
          <input
            name="nome"
            type="text"
            required
            placeholder="Mario Rossi"
            className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)]"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Azienda</span>
          <input
            name="azienda"
            type="text"
            placeholder="Nome azienda"
            className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)]"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Email</span>
        <input
          name="email"
          type="email"
          required
          placeholder="mario@azienda.it"
          className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)]"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Settore</span>
        <select
          name="settore"
          className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)]"
        >
          <option value="">Seleziona il tuo settore</option>
          <option>Studio professionale (legale, fiscale, medico)</option>
          <option>Centro benessere / salone</option>
          <option>Officina / centro assistenza</option>
          <option>Scuola / formazione</option>
          <option>Fitness / palestra</option>
          <option>Altro settore di servizi</option>
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Messaggio</span>
        <textarea
          name="messaggio"
          rows={4}
          placeholder="Raccontaci la tua azienda e cosa stai cercando…"
          className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)] resize-none"
        />
      </label>

      <button
        type="submit"
        className="menuary-button menuary-button-accent w-full justify-center"
      >
        Invia richiesta
      </button>

      <p className="text-center text-xs text-[var(--menuary-muted)]">
        Rispondiamo entro 24 ore lavorative. Prima chiamata sempre gratuita.
      </p>
    </form>
  );
}
