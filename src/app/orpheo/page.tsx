import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OrpheoShell } from "@/components/orpheo/orpheo-shell";
import {
  ORPHEO_MARKETING_DESCRIPTION,
  ORPHEO_ORIGIN,
  ORPHEO_KEYWORDS,
  marketingLanguageAlternates,
} from "@/lib/marketing-seo";

export const metadata: Metadata = {
  title: "Orpheo - piattaforma per artisti e professionisti creativi",
  description: ORPHEO_MARKETING_DESCRIPTION,
  keywords: ORPHEO_KEYWORDS,
  alternates: {
    canonical: ORPHEO_ORIGIN,
    languages: {
      ...marketingLanguageAlternates(ORPHEO_ORIGIN),
      "x-default": ORPHEO_ORIGIN,
    },
  },
};

export default function OrpheoHome() {
  return (
    <OrpheoShell>
      <section className="border-b border-[var(--menuary-line)]">
        <div className="menuary-container grid min-h-[72vh] items-center gap-14 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="menuary-section-label">Orpheo</p>
            <h1 className="mt-7 text-[clamp(3.2rem,7vw,6.4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-balance" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
              Il gestionale per chi vive di opere, pubblico e opportunità.
            </h1>
            <p className="mt-7 max-w-2xl text-[17px] leading-8 text-[var(--menuary-muted)]">
              Orpheo estende il backend Menuary/Bizery ad artisti, autori, musicisti, attori, registi e team creativi: press kit, catalogo opere, booking, diritti, recensioni e fanbase.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/pricing" className="menuary-button menuary-button-dark">
                Vedi prezzi e moduli
                <ArrowRight size={15} strokeWidth={1.8} className="ml-1" />
              </Link>
              <Link href="/contatti" className="menuary-button menuary-button-light">
                Richiedi una demo
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-8">
            <div className="grid gap-4">
              {[
                "Press kit e profilo pubblico",
                "Catalogo opere, crediti e asset",
                "Booking eventi e opportunità",
                "Diritti, royalty e contratti",
                "Amazon, Goodreads, IMDb e altri provider",
                "Fanbase, newsletter e analytics",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-5 py-4 text-sm font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </OrpheoShell>
  );
}
