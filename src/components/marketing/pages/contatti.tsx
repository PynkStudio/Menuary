import { Mail, Phone } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingLeadForm } from "@/components/marketing/lead-form";
import { getTranslations } from "@/i18n";

const PHONE_DISPLAY = "+39 351 3768607";
const PHONE_E164 = "+393513768607";
const WHATSAPP_NUMBER = "393513768607";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 22a9.93 9.93 0 01-5.058-1.378L6.7 20.484 3.27 21.4l.92-3.357-.135-.214A9.95 9.95 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
    </svg>
  );
}

export async function MarketingContactsPage() {
  const t = (await getTranslations("marketing")).contact;
  const lt = (await getTranslations("marketing")).leadForm;
  const waMessage = encodeURIComponent("[menuary] Ciao Menuary, vorrei avere informazioni per il mio locale.");
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  return (
    <MarketingShell>
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container pt-20 pb-16 lg:pt-28 lg:pb-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">{t.label}</p>
              <h1 className="menuary-display mt-7 text-[clamp(2.8rem,6vw,5.6rem)]">
                {t.h1a}
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  {t.h1b}
                </span>
              </h1>
            </div>
            <p className="menuary-fade-up menuary-fade-up-d1 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)]">
              {t.sub}
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
                  {t.emailLabel}
                </p>
                <a
                  href="mailto:hello@menuary.it"
                  className="menuary-display mt-3 inline-flex items-center gap-3 text-3xl transition-colors hover:text-[var(--menuary-copper)]"
                >
                  <Mail size={22} strokeWidth={1.6} className="text-[var(--menuary-copper)]" />
                  hello@menuary.it
                </a>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--menuary-muted)]">
                  {t.phoneLabel}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <a
                    href={`tel:${PHONE_E164}`}
                    aria-label={`${t.phoneLabel} ${PHONE_DISPLAY}`}
                    className="menuary-display inline-flex items-center gap-3 text-3xl transition-colors hover:text-[var(--menuary-copper)]"
                  >
                    <Phone size={22} strokeWidth={1.6} className="text-[var(--menuary-copper)]" />
                    {PHONE_DISPLAY}
                  </a>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.waOpen}
                    className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(37,211,102,0.32)] transition-transform hover:-translate-y-0.5 hover:bg-[#1ebe5d] active:translate-y-0"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    WhatsApp
                  </a>
                </div>
                <p className="mt-3 text-xs text-[var(--menuary-muted)]">
                  {t.responseTime}
                </p>
              </div>

              <div className="border-t border-[var(--menuary-line)] pt-8">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--menuary-muted)]">
                  {t.locationLabel}
                </p>
                <p className="mt-3 max-w-xs text-[15px] leading-7">
                  {t.locationValue}
                  <br />
                  {t.locationNote}
                </p>
                <p className="mt-3 text-[13px] text-[var(--menuary-muted)]">
                  {t.serviceBy}{" "}
                  <a
                    href="https://pynkstudio.it"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[var(--menuary-ink)] underline decoration-[var(--menuary-copper)] underline-offset-4 hover:text-[var(--menuary-copper)]"
                  >
                    PynkStudio
                  </a>
                  .
                </p>
              </div>

              <div className="space-y-4 text-[15px]">
                {t.bullets.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="menuary-index pt-1">— {String(i + 1).padStart(2, "0")}</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </aside>

            <MarketingLeadForm t={lt} />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
