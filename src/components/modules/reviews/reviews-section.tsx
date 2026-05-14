"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import { reviews, googleRating } from "@/lib/reviews-data";
import { formatNumberIT } from "@/lib/format";
import { ReviewCard } from "@/components/modules/reviews/review-card";

export function ReviewsSection({ dark = false, limit = 3 }: { dark?: boolean; limit?: number }) {
  const shown = reviews.slice(0, limit);

  return (
    <section
      className={
        dark
          ? "bg-pork-ink py-20 text-pork-cream md:py-28"
          : "bg-pork-peach/40 py-20 md:py-28"
      }
    >
      <div className="container-wide">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-end">
          <div>
            <span
              className={
                dark
                  ? "chip-mustard"
                  : "inline-flex items-center gap-2 rounded-full bg-pork-ink px-3 py-1 text-xs font-black uppercase tracking-widest text-pork-mustard"
              }
            >
              Lo dicono loro
            </span>
            <h2 className={`headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance ${dark ? "text-pork-cream" : "text-pork-ink"}`}>
              Chi ci prova,
              <br />
              <span className={dark ? "text-pork-mustard" : "text-pork-red"}>torna.</span>
            </h2>
          </div>

          <div
            className={
              dark
                ? "flex items-center gap-4 rounded-3xl bg-pork-brick p-6 ring-1 ring-white/10"
                : "flex items-center gap-4 rounded-3xl bg-white p-6 shadow-lg"
            }
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pork-ink text-lg font-black text-pork-cream">
              G
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="impact-title text-4xl">
                  {googleRating.average.toFixed(1).replace(".", ",")}
                </span>
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={18}
                      className={
                        n <= Math.round(googleRating.average)
                          ? "fill-pork-mustard text-pork-mustard"
                          : dark
                          ? "text-pork-cream/25"
                          : "text-pork-ink/20"
                      }
                    />
                  ))}
                </span>
              </div>
              <p className={`text-sm ${dark ? "text-pork-cream/70" : "text-pork-ink/70"}`}>
                {formatNumberIT(googleRating.count)} recensioni su Google
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {shown.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <ReviewCard review={r} variant={dark ? "dark" : "light"} />
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/recensioni" className={dark ? "btn-mustard" : "btn-primary"}>
            Tutte le recensioni <ArrowRight size={18} />
          </Link>
          <a
            href={googleRating.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={dark ? "btn-ghost-light" : "btn-ghost"}
          >
            Apri su Google
          </a>
        </div>
      </div>
    </section>
  );
}
