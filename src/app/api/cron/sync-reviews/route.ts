import { NextResponse } from "next/server";
import { TENANTS } from "@/lib/tenant-registry";
import { fetchPlaceReviews } from "@/lib/google/places";
import { isSyncEligible, insertSyncLog, getPrimaryLocation } from "@/lib/data/google-sync";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";

export const maxDuration = 60; // secondi — Vercel Fluid Compute

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Vercel chiama i cron con l'header Authorization: Bearer {CRON_SECRET}.
// In locale puoi testare manualmente passando lo stesso header.
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

// ─── Review upsert ────────────────────────────────────────────────────────────
// Strategia: cancella le recensioni precedenti di fonte "google_places" per il
// tenant e reinserisce quelle fresche. Le recensioni manuali non vengono toccate.
// Le recensioni Google partono da position=100 per non scalzare quelle manuali.
async function upsertGoogleReviews(
  tenantId: string,
  reviews: Awaited<ReturnType<typeof fetchPlaceReviews>>["reviews"],
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase service client non disponibile");

  await supabase
    .from("reviews")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("source", "google_places");

  if (reviews.length === 0) return;

  await supabase.from("reviews").insert(
    reviews.map((r, i) => ({
      tenant_id: tenantId,
      author: r.author,
      rating: r.rating,
      text: r.text,
      date_label: r.relativeTime,
      google_review_id: r.googleReviewId,
      language_code: r.languageCode,
      original_language_code: r.originalLanguageCode,
      translated: r.translated,
      is_local_guide: r.isLocalGuide,
      reviews_count: r.reviewsCount,
      photos_count: r.photosCount,
      position: 100 + i,
      published: true,
      source: "google_places",
    })),
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Array<{ tenantId: string; outcome: string; detail?: string }> = [];

  for (const tenant of TENANTS) {
    const tenantId = tenant.id;

    // Tenant offline, sospeso o in trattativa: nessun job (non in produzione attiva).
    if (tenant.status === "offline" || tenant.status === "trattativa" || tenant.status === "suspended") {
      results.push({ tenantId, outcome: `skipped:${tenant.status}` });
      continue;
    }

    // Controlla eligibilità (trial → una volta sola, active → ogni 30 giorni).
    const eligible = await isSyncEligible(tenantId, tenant.status);
    if (!eligible) {
      results.push({ tenantId, outcome: "skipped:not_due" });
      continue;
    }

    // Recupera la sede Google primaria collegata dal DB.
    // Il Place ID viene acquisito quando il gestore collega il suo account
    // Google Business dal pannello di gestione — non è hardcodato nel registry.
    const location = await getPrimaryLocation(tenantId);
    if (!location?.placeId) {
      results.push({ tenantId, outcome: "skipped:not_linked" });
      continue;
    }

    const placeId = location.placeId;

    // Esegui sync.
    try {
      const languages = getTenantLocaleConfig(tenantId)?.locales ?? ["it"];
      const localizedResults = await Promise.all(
        languages.map((language) => fetchPlaceReviews(placeId, { language })),
      );
      const data = localizedResults[0];
      if (!data) throw new Error("google_places_empty_locale_set");
      const reviews = Array.from(
        new Map(
          localizedResults
            .flatMap((result) => result.reviews)
            .map((review) => [review.googleReviewId, review]),
        ).values(),
      );
      await upsertGoogleReviews(tenantId, reviews);
      await insertSyncLog({
        tenant_id: tenantId,
        reviews_fetched: reviews.length,
        rating: data.rating,
        rating_count: data.ratingCount,
        status: "success",
      });
      results.push({ tenantId, outcome: "synced", detail: `${reviews.length} recensioni` });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await insertSyncLog({
        tenant_id: tenantId,
        status: "error",
        error_message: message,
      });
      results.push({ tenantId, outcome: "error", detail: message });
    }
  }

  return NextResponse.json({ ok: true, results });
}
