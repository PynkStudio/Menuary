import { Mail, MessageCircle } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingLeadForm } from "@/components/marketing/lead-form";

export function MarketingContactsPage() {
  return (
    <MarketingShell>
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-16 lg:pt-28 lg:pb-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Contatti</p>
              <h1 className="menuary-display mt-7 text-[clamp(2.8rem,6vw,5.6rem)]">
                Raccontaci il tuo ristorante.
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  Ti rispondiamo con un&apos;idea concreta.
                </span>
              </h1>
            </div>
            <p className="menuary-fade-up menuary-fade-up-d1 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)]">
              Partiamo da cucina, atmosfera, clientela e modo di lavorare. Da lì costruiamo
              una proposta concreta: sito, menu, prenotazioni, ordini e strumenti utili al
              tuo locale.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="menuary-container py-20 lg:py-24">
          <div className="grid gap-16 lg:grid-cols-[0.42fr_0.58fr] lg:gap-24">
            <aside className="space-y-12">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--menuary-muted)]">
                  Scrivici
                </p>
                <a
                  href="mailto:hello@menuary.it"
                  className="menuary-display mt-3 inline-flex items-center gap-3 text-3xl"
                >
                  <Mail size={22} strokeWidth={1.6} className="text-[var(--menuary-copper)]" />
                  hello@menuary.it
                </a>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--menuary-muted)]">
                  Chiamaci
                </p>
                <a
                  href="tel:+390000000000"
                  className="menuary-display mt-3 inline-flex items-center gap-3 text-3xl"
                >
                  <MessageCircle size={22} strokeWidth={1.6} className="text-[var(--menuary-copper)]" />
                  +39 000 000 0000
                </a>
              </div>

              <div className="border-t border-[var(--menuary-line)] pt-8">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--menuary-muted)]">
                  Studio
                </p>
                <p className="mt-3 max-w-xs text-[15px] leading-7">
                  Bari · Italia
                  <br />
                  Lavoriamo con ristoranti in tutta Italia.
                </p>
              </div>

              <div className="space-y-4 text-[15px]">
                {[
                  "Un sito personalizzato sul carattere del ristorante",
                  "Menu digitale, prenotazioni e ordini se ti servono",
                  "Gestione semplice per aggiornare contenuti e servizi",
                ].map((item, i) => (
                  <div key={item} className="flex gap-4">
                    <span className="menuary-index pt-1">— {String(i + 1).padStart(2, "0")}</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </aside>

            <MarketingLeadForm />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
