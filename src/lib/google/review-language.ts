export function normalizeReviewLanguage(language: string | null | undefined) {
  return language?.trim().toLowerCase().replace("_", "-").split("-")[0] || null;
}

/**
 * Keep the source order inside each group while placing reviews written in the
 * active site language first. Reviews in other languages remain available as
 * fallback when there are not enough matching reviews.
 */
export function prioritizeReviewsByLanguage<T extends { languageCode?: string | null }>(
  reviews: readonly T[],
  preferredLanguage: string | null | undefined,
) {
  const normalizedPreference = normalizeReviewLanguage(preferredLanguage);
  if (!normalizedPreference) return [...reviews];
  return reviews
    .map((review, index) => ({ review, index }))
    .sort((a, b) => {
      const aPreferred = normalizeReviewLanguage(a.review.languageCode) === normalizedPreference ? 1 : 0;
      const bPreferred = normalizeReviewLanguage(b.review.languageCode) === normalizedPreference ? 1 : 0;
      return bPreferred - aPreferred || a.index - b.index;
    })
    .map(({ review }) => review);
}
