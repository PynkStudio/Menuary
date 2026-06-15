import type { Metadata } from "next";
import { OrpheoShell } from "@/components/orpheo/orpheo-shell";
import { ORPHEO_ORIGIN, marketingAlternates } from "@/lib/marketing-seo";
import { getLocale } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contatti Orpheo",
    description: "Richiedi una demo Orpheo per artisti, autori, musicisti, attori, registi e professionisti creativi.",
    alternates: marketingAlternates(ORPHEO_ORIGIN, "/contatti", await getLocale()),
  };
}

export default function OrpheoContacts() {
  return (
    <OrpheoShell>
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container grid gap-14 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
          <div>
            <p className="menuary-section-label">Contatti</p>
            <h1 className="mt-7 text-[clamp(3rem,6.2vw,5.8rem)] font-medium leading-[1.04] tracking-[-0.02em] text-balance" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
              Parliamo del tuo vertical creativo.
            </h1>
            <p className="mt-7 max-w-xl text-[17px] leading-8 text-[var(--menuary-muted)]">
              Raccontaci se stai lavorando su artisti, autori, musicisti, attori, registi o team creativi. Prepariamo una demo con moduli e pricing Orpheo.
            </p>
          </div>
          <div className="rounded-3xl border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--menuary-muted)]">Email</p>
            <a href="mailto:hello@weuseorpheo.com" className="mt-3 block text-3xl font-medium tracking-[-0.02em] text-[var(--menuary-ink)] hover:text-[var(--menuary-copper)]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
              hello@weuseorpheo.com
            </a>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[var(--menuary-muted)]">Telefono</p>
            <a href="tel:+393513768607" className="mt-3 block text-2xl font-semibold hover:text-[var(--menuary-copper)]">
              +39 351 3768607
            </a>
          </div>
        </div>
      </section>
    </OrpheoShell>
  );
}
