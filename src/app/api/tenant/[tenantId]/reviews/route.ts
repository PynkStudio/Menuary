import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { findTenantById } from "@/lib/tenant-registry";
import { getTenantLocaleConfig, matchTenantLocale } from "@/lib/tenant-locales";
import { prioritizeReviewsByLanguage } from "@/lib/google/review-language";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  if (!findTenantById(tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }
  const config = getTenantLocaleConfig(tenantId);
  const requestedLanguage = new URL(request.url).searchParams.get("language");
  const preferredLanguage = config
    ? matchTenantLocale(requestedLanguage, config.locales)
    : requestedLanguage?.trim().toLowerCase().split("-")[0] ?? null;

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ reviews: [] });

  try {
    const [{ data: reviews }, { data: sync }] = await Promise.all([
      db
        .from("reviews")
        .select("id,author,rating,text,date_label,is_local_guide,reviews_count,photos_count,language_code")
        .eq("tenant_id", tenantId)
        .eq("source", "google_places")
        .eq("published", true)
        .order("position")
        .limit(30),
      db
        .from("google_sync_log")
        .select("rating,rating_count")
        .eq("tenant_id", tenantId)
        .eq("status", "success")
        .order("synced_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      reviews: prioritizeReviewsByLanguage(
        (reviews ?? []).map((review) => ({ ...review, languageCode: review.language_code })),
        preferredLanguage,
      )
        .slice(0, 6)
        .map((review) => ({
        id: review.id,
        author: review.author,
        rating: review.rating,
        text: review.text,
        date: review.date_label,
        isLocalGuide: review.is_local_guide,
        reviewsCount: review.reviews_count,
        photosCount: review.photos_count,
        languageCode: review.languageCode,
      })),
      rating: sync
        ? { average: Number(sync.rating), count: Number(sync.rating_count) }
        : undefined,
    });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}
