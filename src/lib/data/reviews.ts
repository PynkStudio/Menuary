import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/reviews-data";

export async function getReviewsForTenant(tenantId: string): Promise<Review[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("reviews")
    .select("id,author,rating,text,date_label,is_local_guide,reviews_count,photos_count")
    .eq("tenant_id", tenantId)
    .eq("published", true)
    .order("position");
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    author: r.author,
    rating: r.rating as 1 | 2 | 3 | 4 | 5,
    text: r.text,
    date: r.date_label ?? "",
    isLocalGuide: r.is_local_guide,
    reviewsCount: r.reviews_count ?? undefined,
    photosCount: r.photos_count ?? undefined,
  }));
}
