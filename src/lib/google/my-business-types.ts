// Tipi e utility pure di Google My Business — importabili anche da client component.
// Nessuna logica server-only qui: solo tipi e funzioni pure senza dipendenze Node/server.

export type BusinessHours = {
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  openTime: string;
  closeTime: string;
};

export type BusinessInfo = {
  name: string;
  title: string;
  phoneNumbers?: { primaryPhone?: string };
  websiteUri?: string;
  regularHours?: { periods: BusinessHours[] };
  description?: string;
};

export type GmbReview = {
  name: string;
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string } | null;
};

const STAR_MAP: Record<GmbReview["starRating"], number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
};

export function starRatingToNumber(r: GmbReview["starRating"]): number {
  return STAR_MAP[r];
}

export const PERFORMANCE_METRICS = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "WEBSITE_CLICKS",
  "CALL_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
] as const;

export type PerformanceMetricName = typeof PERFORMANCE_METRICS[number];

export type DatedValue = { date: { year: number; month: number; day: number }; value: string };

export type MetricTimeSeries = {
  dailyMetric: PerformanceMetricName;
  timeSeries: { datedValues: DatedValue[] };
};

export type PerformanceData = {
  multiDailyMetricTimeSeries: MetricTimeSeries[];
};

export type LocationWithMeta = {
  name: string;
  title: string;
  placeId: string | null;
  address?: string;
};
