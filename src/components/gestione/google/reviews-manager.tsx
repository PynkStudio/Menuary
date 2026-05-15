"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { GmbReview } from "@/lib/google/my-business";
import { starRatingToNumber } from "@/lib/google/my-business";

interface Props {
  tenantId: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < rating ? "fill-pork-mustard text-pork-mustard" : "text-pork-ink/20"}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review, tenantId, onReplied }: {
  review: GmbReview;
  tenantId: string;
  onReplied: (reviewName: string, comment: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.reviewReply?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rating = starRatingToNumber(review.starRating);
  const hasReply = !!review.reviewReply;

  async function handleReply() {
    if (!replyText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/gestione/google/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, reviewName: review.name, comment: replyText }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (json.ok) {
        onReplied(review.name, replyText);
        setOpen(false);
      } else {
        setError(json.error ?? "Errore");
      }
    } catch {
      setError("Errore di rete");
    } finally {
      setSaving(false);
    }
  }

  const date = new Date(review.createTime).toLocaleDateString("it-IT", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className={`rounded-2xl border-2 p-4 ${hasReply ? "border-pork-ink/10 bg-white" : "border-pork-red/20 bg-pork-red/5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{review.reviewer.displayName}</span>
            <StarRow rating={rating} />
            <span className="text-xs text-pork-ink/40">{date}</span>
            {!hasReply && (
              <span className="rounded-full bg-pork-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Da rispondere
              </span>
            )}
          </div>
          {review.comment && (
            <p className="mt-2 text-sm leading-relaxed text-pork-ink/80">{review.comment}</p>
          )}
          {hasReply && (
            <div className="mt-3 rounded-xl bg-pork-ink/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-pork-ink/50 mb-1">
                La tua risposta
              </p>
              <p className="text-sm text-pork-ink/70">{review.reviewReply!.comment}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-xl border-2 border-pork-ink/10 p-2 text-pork-ink/50 transition-colors hover:border-pork-ink/30 hover:text-pork-ink"
        >
          {open ? <ChevronUp size={16} /> : <MessageSquare size={16} />}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            placeholder="Scrivi la tua risposta…"
            className="w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2 text-sm outline-none focus:border-pork-red resize-none"
          />
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-pork-ink/50 hover:text-pork-ink"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleReply}
              disabled={saving || !replyText.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-pork-ink px-4 py-1.5 text-xs font-bold text-pork-cream disabled:opacity-40"
            >
              <Send size={12} />
              {saving ? "Invio…" : hasReply ? "Aggiorna risposta" : "Rispondi su Google"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewsManager({ tenantId }: Props) {
  const [reviews, setReviews] = useState<GmbReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending">("pending");

  useEffect(() => {
    fetch(`/api/gestione/google/reviews?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then((data: { reviews?: GmbReview[]; error?: string }) => {
        if (data.error) setError(data.error);
        else setReviews(data.reviews ?? []);
      })
      .catch(() => setError("Errore caricamento recensioni"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  function handleReplied(reviewName: string, comment: string) {
    setReviews((prev) =>
      prev.map((r) =>
        r.name === reviewName
          ? { ...r, reviewReply: { comment, updateTime: new Date().toISOString() } }
          : r,
      ),
    );
  }

  const pending = reviews.filter((r) => !r.reviewReply);
  const shown = filter === "pending" ? pending : reviews;

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-pork-ink/40 text-sm">
      Caricamento recensioni…
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-sm text-red-700">
      <strong>Errore:</strong> {error}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filtri */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-full border-2 border-pork-ink/10 p-1 text-sm">
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="rounded-full px-4 py-1.5 font-semibold transition-colors"
              style={filter === f
                ? { backgroundColor: "var(--pork-ink)", color: "var(--pork-cream)" }
                : { color: "color-mix(in srgb, var(--pork-ink) 50%, transparent)" }
              }
            >
              {f === "pending" ? `Da rispondere (${pending.length})` : `Tutte (${reviews.length})`}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border-2 border-pork-ink/10 bg-white p-8 text-center text-sm text-pork-ink/40">
          {filter === "pending" ? "Nessuna recensione in attesa di risposta 🎉" : "Nessuna recensione"}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <ReviewCard key={r.reviewId} review={r} tenantId={tenantId} onReplied={handleReplied} />
          ))}
        </div>
      )}
    </div>
  );
}
