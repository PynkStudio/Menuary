import { Star } from "lucide-react";
import type { Review } from "@/lib/reviews-data";
import { cn } from "@/lib/utils";

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#FBBC05" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.094 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export function ReviewCard({ review, variant = "light" }: { review: Review; variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <article
      className={cn(
        "tenant-review-card relative flex h-full flex-col gap-4 rounded-3xl p-6 shadow-lg",
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
        {review.sourceLabel ? (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-xs font-black",
              isDark ? "bg-pork-cream text-pork-ink" : "bg-pork-ink text-pork-cream"
            )}
            aria-label={review.sourceLabel}
            title={`Fonte: ${review.author}`}
          >
            {review.sourceLabel}
          </div>
        ) : (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full bg-white",
              isDark ? "ring-1 ring-white/10" : "ring-1 ring-pork-ink/10"
            )}
            aria-label="Google"
            title="Recensione da Google"
          >
            <GoogleLogo className="h-5 w-5" />
          </div>
        )}
      </div>
    </article>
  );
}
