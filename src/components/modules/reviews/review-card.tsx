import { Star } from "lucide-react";
import type { Review } from "@/lib/reviews-data";
import { cn } from "@/lib/utils";

export function ReviewCard({ review, variant = "light" }: { review: Review; variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <article
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-3xl p-6 shadow-lg",
        isDark
          ? "bg-pork-brick text-pork-cream ring-1 ring-white/5"
          : "bg-white text-pork-ink ring-1 ring-pork-ink/5"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={16}
              className={cn(
                "transition-colors",
                n <= review.rating
                  ? "fill-pork-mustard text-pork-mustard"
                  : isDark
                  ? "text-pork-cream/20"
                  : "text-pork-ink/15"
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            isDark ? "text-pork-cream/50" : "text-pork-ink/50"
          )}
        >
          {review.date}
        </span>
      </div>

      <blockquote className={cn("text-pretty leading-relaxed", isDark ? "text-pork-cream/90" : "text-pork-ink/80")}>
        &ldquo;{review.text}&rdquo;
      </blockquote>

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <div>
          <p className="font-bold">{review.author}</p>
          {review.isLocalGuide && (
            <p className={cn("text-xs", isDark ? "text-pork-mustard" : "text-pork-red")}>
              Local Guide
              {review.reviewsCount ? ` · ${review.reviewsCount} recensioni` : ""}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-xs font-black",
            isDark ? "bg-pork-cream text-pork-ink" : "bg-pork-ink text-pork-cream"
          )}
          aria-label="Google"
          title="Recensione da Google"
        >
          G
        </div>
      </div>
    </article>
  );
}
