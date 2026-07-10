import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Star } from "lucide-react";
import { TenantProvider } from "@/components/core/tenant-provider";
import { ReviewCard } from "@/components/modules/reviews/review-card";
import { getGoogleRatingForTenant, getReviewsForTenant } from "@/lib/reviews-data";
import { formatNumberIT } from "@/lib/format";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";

export default async function PreviewTenantReviews({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  const isLocalPreviewDev =
    host?.includes("localhost") || host?.includes("127.0.0.1");
  if (mode !== "preview" && !isLocalPreviewDev) notFound();

  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug, host);
  if (!tenant || tenant.previewSlug !== previewSlug) notFound();

  const themeVars = tenantThemeCssVars(tenant.theme);
  const reviews = getReviewsForTenant(tenant.id);
  const rating = getGoogleRatingForTenant(tenant.id);
  const isDoca = tenant.id === "doca";
  const isNomSushi = tenant.id === "nom-sushi";

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="tenant-preview-surface min-h-screen"
        data-tenant-surface={tenant.id}
        style={themeVars as CSSProperties}
      >
        <section className="tenant-reviews-page-hero bg-pork-ink pt-28 pb-14 text-pork-cream md:pt-36 md:pb-20">
          <div className="container-wide grid gap-10 lg:grid-cols-[1.3fr_0.8fr] lg:items-end">
            <div>
              <span className="chip-mustard">
                {isDoca ? "Rassegna e Google" : isNomSushi ? "Recensioni Nøm" : "Recensioni"}
              </span>
              <h1 className="headline mt-4 text-5xl text-balance sm:text-7xl lg:text-8xl">
                {isDoca ? (
                  <>
                    Doca,
                    <br />
                    <span className="text-pork-mustard">detta da fuori.</span>
                  </>
                ) : isNomSushi ? (
                  <>
                    Genova assaggia,
                    <br />
                    <span className="text-pork-mustard">Nøm risponde.</span>
                  </>
                ) : (
                  <>
                    Lo dicono loro,
                    <br />
                    <span className="text-pork-mustard">non noi.</span>
                  </>
                )}
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-pork-cream/75">
                {isDoca
                  ? "Citazioni da fonti pubbliche e link diretto alla scheda Google Maps del locale."
                  : isNomSushi
                    ? "Voci su formula AYCE, aperisushi, servizio e carta fusion nel centro storico di Genova."
                  : "Niente filtri, nessuna recensione scelta a tavolino. Il voto pubblico è quello visibile su Google."}
              </p>
            </div>

            <a
              href={rating.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-3xl bg-pork-brick p-7 text-pork-cream ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-pork-mustard/50"
            >
              <p className="text-xs font-black uppercase tracking-widest text-pork-mustard">
                Google Maps
              </p>
              <div className="mt-3 flex items-end gap-3">
                <span className="impact-title text-7xl leading-none">
                  {rating.average.toFixed(1).replace(".", ",")}
                </span>
                <span className="pb-2 text-lg text-pork-cream/70">/ 5</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={20}
                    className={
                      n <= Math.round(rating.average)
                        ? "fill-pork-mustard text-pork-mustard"
                        : "text-pork-cream/25"
                    }
                  />
                ))}
                <span className="text-sm text-pork-cream/70">
                  {isDoca
                    ? "apri la scheda"
                    : `${formatNumberIT(rating.count)} recensioni`}
                </span>
              </div>
            </a>
          </div>
        </section>

        <section className="tenant-reviews-page-list bg-pork-cream py-16 md:py-24">
          <div className="container-wide grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} variant="light" />
            ))}
          </div>
        </section>
      </div>
    </TenantProvider>
  );
}
