import type { Metadata } from "next";
import Link from "next/link";
import { Star, MessageCircle } from "lucide-react";
import { ReviewCard } from "@/components/modules/reviews/review-card";
import { reviews, googleRating } from "@/lib/reviews-data";
import { formatNumberIT } from "@/lib/format";
import { whatsappUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Recensioni",
  description:
    "Le recensioni Google di Be Pork a Bari. Un rating pubblico, senza filtri, e le voci di chi ci ha già provato.",
};

export default function RecensioniPage() {
  return (
    <>
      <section className="bg-pork-ink pt-32 pb-16 text-pork-cream md:pt-40 md:pb-24">
        <div className="container-wide grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <span className="chip-mustard">Recensioni</span>
            <h1 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl text-balance">
              Lo dicono loro,
              <br />
              <span className="text-pork-mustard">non noi.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-pork-cream/75">
              Niente filtri, nessuna recensione scelta a tavolino. Il voto pubblico è uno solo,
              lo trovi qui sotto e lo trovi su Google.
            </p>
          </div>

          <div className="rounded-3xl bg-pork-brick p-8 text-pork-cream ring-1 ring-white/10">
            <p className="text-xs font-black uppercase tracking-widest text-pork-mustard">
              Rating Google
            </p>
            <div className="mt-3 flex items-end gap-3">
              <span className="impact-title text-7xl leading-none">
                {googleRating.average.toFixed(1).replace(".", ",")}
              </span>
              <span className="pb-2 text-lg text-pork-cream/70">/ 5</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={22}
                  className={
                    n <= Math.round(googleRating.average)
                      ? "fill-pork-mustard text-pork-mustard"
                      : "text-pork-cream/25"
                  }
                />
              ))}
              <span className="text-sm text-pork-cream/70">
                su {formatNumberIT(googleRating.count)} recensioni
              </span>
            </div>
            <a
              href={googleRating.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-pork-mustard px-5 py-3 font-bold text-pork-ink transition-colors hover:bg-pork-mustard-soft"
            >
              Lascia la tua recensione
            </a>
          </div>
        </div>
      </section>

      <section className="bg-pork-cream py-20 md:py-28">
        <div className="container-wide">
          <div className="grid gap-6 md:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} variant="light" />
            ))}
          </div>

          <div className="mt-16 rounded-3xl bg-pork-peach/40 p-8 text-center md:p-12">
            <h2 className="headline text-4xl sm:text-5xl text-balance">
              Non ti fidi solo dei cinque stelle?
              <br />
              <span className="text-pork-red">Nemmeno noi.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pork-ink/70">
              Il rating è quello che è, lo leggiamo e lavoriamo. Se sei stato da noi, raccontaci
              come è andata: serviamo panini, non verità assolute.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={googleRating.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Apri su Google Maps
              </a>
              <Link href="/menu" className="btn-ghost">
                Guarda il menu
              </Link>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                <MessageCircle size={18} />
                Prenota
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
