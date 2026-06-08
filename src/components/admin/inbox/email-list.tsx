"use client";

import { Inbox, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboundEmail } from "@/lib/email/inbound-types";

type Props = {
  emails: InboundEmail[];
  selectedId: string | null;
  onSelect: (email: InboundEmail) => void;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

const BRAND_STYLE: Record<string, { bg: string; ring: string }> = {
  menuary: { bg: "bg-[#a95f45]",  ring: "ring-[#a95f45]/30" },
  bizery:  { bg: "bg-[#3b6cb5]",  ring: "ring-[#3b6cb5]/30" },
  orpheo:  { bg: "bg-[#7c3aed]",  ring: "ring-[#7c3aed]/30" },
};

function initialFor(email: InboundEmail): string {
  const src = (email.from_name || email.from_address || "?").trim();
  return src.charAt(0).toUpperCase();
}

export function EmailList({ emails, selectedId, onSelect }: Props) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--ma-muted)]">
        <Inbox size={28} className="mb-2 opacity-40" />
        <p className="text-sm">Nessuna email</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--ma-line)]">
      {emails.map((email) => {
        const isSelected = email.id === selectedId;
        const isUnread = !email.read;
        const brand = BRAND_STYLE[email.brand] ?? { bg: "bg-gray-400", ring: "ring-gray-300" };

        return (
          <li key={email.id} className="relative">
            {isUnread && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-[var(--ma-accent)]"
              />
            )}
            <button
              onClick={() => onSelect(email)}
              className={cn(
                "w-full px-4 py-3 text-left transition-colors",
                "hover:bg-[var(--ma-surface)]",
                isSelected && "bg-[var(--ma-surface)]",
                isUnread && "pl-[calc(1rem+3px)]",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-offset-1 ring-offset-transparent",
                    brand.bg,
                    brand.ring,
                  )}
                  title={email.brand}
                >
                  {initialFor(email)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        isUnread
                          ? "font-semibold text-[var(--ma-ink)]"
                          : "text-[var(--ma-ink)]/80",
                      )}
                    >
                      {email.from_name ?? email.from_address}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[11px] tabular-nums",
                        isUnread ? "font-semibold text-[var(--ma-accent)]" : "text-[var(--ma-muted)]",
                      )}
                    >
                      {fmtDate(email.created_at)}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "mt-0.5 truncate text-sm",
                      isUnread
                        ? "font-medium text-[var(--ma-ink)]"
                        : "text-[var(--ma-ink)]/75",
                    )}
                  >
                    {email.subject || "(nessun oggetto)"}
                  </p>

                  <div className="mt-0.5 flex items-center gap-1.5">
                    <p className="min-w-0 flex-1 truncate text-xs text-[var(--ma-muted)]">
                      {email.text_body?.slice(0, 120) ?? ""}
                    </p>
                    {email.starred && (
                      <Star size={12} className="shrink-0 fill-amber-400 text-amber-400" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
