"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getGoogleRatingForTenant, getReviewsForTenant, type Review } from "@/lib/reviews-data";
import { formatNumberIT } from "@/lib/format";
import { ReviewCard } from "@/components/modules/reviews/review-card";
import { useTenant } from "@/components/core/tenant-provider";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import { useDocaCopy } from "@/lib/doca-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { tenantLocaleFromPath } from "@/lib/tenant-localized-path";
import { prioritizeReviewsByLanguage } from "@/lib/google/review-language";
import { GoogleLogo } from "./google-logo";

export function ReviewsSection({ dark = false, limit = 3 }: { dark?: boolean; limit?: number }) {
  const tenant = useTenant();
  const mode = usePlatformMode();
  const pathname = usePathname();
  const reviewLanguage =
    tenantLocaleFromPath(pathname ?? "/", tenant.id, tenant.previewSlug) ??
    getTenantLocaleConfig(tenant.id)?.defaultLocale ??
    null;
  const fallbackReviews = useMemo(
    () => prioritizeReviewsByLanguage(getReviewsForTenant(tenant.id), reviewLanguage),
    [reviewLanguage, tenant.id],
  );
  const fallbackGoogleRating = getGoogleRatingForTenant(tenant.id);
  const [tenantReviews, setTenantReviews] = useState(fallbackReviews);
  const [tenantGoogleRating, setTenantGoogleRating] = useState(fallbackGoogleRating);
  const [hasGoogleReviewFeed, setHasGoogleReviewFeed] = useState(false);
  const shown = tenantReviews.slice(0, limit);
  const isPathPreview = !!tenant.previewSlug && pathname?.startsWith(`/${tenant.previewSlug}`);
  const baseReviewHref =
    (mode === "preview" || isPathPreview) && tenant.previewSlug
      ? `/${tenant.previewSlug}/recensioni`
      : "/recensioni";
  const isDoca = tenant.id === "doca";
  const docaCopy = useDocaCopy();
  const tenantHref = useTenantLocalizedHref();
  const reviewHref = tenantHref(baseReviewHref);
  const isNomSushi = tenant.id === "nom-sushi";

  useEffect(() => {
    let cancelled = false;
    setTenantReviews(fallbackReviews);
    setTenantGoogleRating(fallbackGoogleRating);
    setHasGoogleReviewFeed(false);
    const languageParam = reviewLanguage ? `?language=${encodeURIComponent(reviewLanguage)}` : "";
    void fetch(`/api/tenant/${encodeURIComponent(tenant.id)}/reviews${languageParam}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { reviews?: Review[]; rating?: { average: number; count: number } } | null) => {
        if (cancelled || !payload?.reviews?.length) return;
        setTenantReviews(payload.reviews);
        if (payload.rating) {
          setTenantGoogleRating((current) => ({ ...current, ...payload.rating }));
        }
        setHasGoogleReviewFeed(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [fallbackGoogleRating, fallbackReviews, reviewLanguage, tenant.id]);

  return (
    <section
      className={
        dark
          ? "tenant-reviews bg-pork-ink py-20 text-pork-cream md:py-28"
          : "tenant-reviews bg-pork-peach/40 py-20 md:py-28"
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
              {isDoca ? docaCopy.reviewsEyebrow : isNomSushi ? "Dicono di Nøm" : "Lo dicono loro"}
            </span>
            <h2 className={`headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance ${dark ? "text-pork-cream" : "text-pork-ink"}`}>
              {isDoca ? (
                <>
                  {docaCopy.reviewsTitleLead}
                  <br />
                  <span className={dark ? "text-pork-mustard" : "text-pork-red"}>{docaCopy.reviewsTitleAccent}</span>
                </>
              ) : isNomSushi ? (
                <>
                  Roll ordinati,
                  <br />
                  <span className={dark ? "text-pork-mustard" : "text-pork-red"}>tavoli pieni.</span>
                </>
              ) : (
                <>
                  Chi ci prova,
                  <br />
                  <span className={dark ? "text-pork-mustard" : "text-pork-red"}>torna.</span>
                </>
              )}
            </h2>
          </div>

          <div
            className={
              dark
                ? "flex items-center gap-4 rounded-3xl bg-pork-brick p-6 ring-1 ring-white/10"
                : "flex items-center gap-4 rounded-3xl bg-white p-6 shadow-lg"
            }
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${dark ? "bg-white/10" : "bg-white ring-1 ring-pork-ink/8"}`}>
              <GoogleLogo className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="impact-title text-4xl">
                  {tenantGoogleRating.average.toFixed(1).replace(".", ",")}
                </span>
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={18}
                      className={
                        n <= Math.round(tenantGoogleRating.average)
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
                {isDoca && !hasGoogleReviewFeed
                  ? docaCopy.reviewsSource
                  : `${formatNumberIT(tenantGoogleRating.count)} recensioni su Google`}
              </p>
            </div>
          </div>
        </div>

        <div className={`mt-12 grid gap-5 md:grid-cols-3 ${isDoca ? "doca-mobile-carousel" : ""}`}>
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
          {!isDoca && (
            <Link href={reviewHref} className={dark ? "btn-mustard" : "btn-primary"}>
              Tutte le recensioni <ArrowRight size={18} />
            </Link>
          )}
          <a
            href={tenantGoogleRating.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={dark ? "btn-ghost-light" : "btn-ghost"}
          >
            {isDoca ? docaCopy.google : "Apri su Google"}
          </a>
        </div>
      </div>
    </section>
  );
}
