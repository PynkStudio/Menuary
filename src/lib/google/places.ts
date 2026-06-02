import "server-only";

import { createHash } from "node:crypto";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place/details/json";

// Subset dei campi che ci interessano dalla Places API (legacy v1).
// Ridurre i fields abbassa il costo per chiamata (billing per field mask).
const FIELDS = "name,rating,user_ratings_total,reviews";

export type PlacesReview = {
  googleReviewId: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  relativeTime: string;    // es. "3 mesi fa"
  languageCode: string | null;
  originalLanguageCode: string | null;
  translated: boolean;
  isLocalGuide: boolean;
  reviewsCount: number | null;
  photosCount: number | null;
};

export type PlacesResult = {
  name: string;
  rating: number;
  ratingCount: number;
  reviews: PlacesReview[];
};

type RawReview = {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  time: number;
  language?: string;
  original_language?: string;
  translated?: boolean;
  author_url?: string;
  profile_photo_url?: string;
};

function reviewId(review: RawReview) {
  return createHash("sha256")
    .update(`${review.author_url ?? review.author_name}:${review.time}:${review.rating}`)
    .digest("hex");
}

export async function fetchPlaceReviews(
  placeId: string,
  options: { language?: string } = {},
): Promise<PlacesResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY non configurata");

  const url = new URL(PLACES_API_BASE);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("key", apiKey);
  if (options.language) url.searchParams.set("language", options.language);
  url.searchParams.set("reviews_no_translations", "true");
  url.searchParams.set("reviews_sort", "most_relevant");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Places API HTTP ${res.status}`);

  const json = (await res.json()) as {
    status: string;
    error_message?: string;
    result?: {
      name: string;
      rating: number;
      user_ratings_total: number;
      reviews?: RawReview[];
    };
  };

  if (json.status !== "OK") {
    throw new Error(`Places API status: ${json.status}${json.error_message ? ` — ${json.error_message}` : ""}`);
  }

  const result = json.result!;

  return {
    name: result.name,
    rating: result.rating ?? 0,
    ratingCount: result.user_ratings_total ?? 0,
    reviews: (result.reviews ?? []).map((r) => ({
      googleReviewId: reviewId(r),
      author: r.author_name,
      rating: Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5,
      text: r.text ?? "",
      relativeTime: r.relative_time_description ?? "",
      languageCode: r.language ?? null,
      originalLanguageCode: r.original_language ?? r.language ?? null,
      translated: r.translated === true,
      // Le Places API legacy non espongono il badge Local Guide né i conteggi
      // in modo strutturato — sono embedded nell'author_url. Non mappabili
      // in modo affidabile, si valorizzano a null.
      isLocalGuide: false,
      reviewsCount: null,
      photosCount: null,
    })),
  };
}
