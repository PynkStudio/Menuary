"use client";

import { Star } from "lucide-react";
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

const BRAND_DOT: Record<string, string> = {
  menuary: "bg-red-500",
  bizery:  "bg-blue-500",
};

export function EmailList({ emails, selectedId, onSelect }: Props) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--ma-muted)]">
        <span className="mb-2 text-3xl">📭</span>
        <p className="text-sm">Nessuna email</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--ma-line)]">
      {emails.map((email) => {
        const isSelected = email.id === selectedId;
        const isUnread = !email.read;

        return (
          <li key={email.id}>
            <button
              onClick={() => onSelect(email)}
              className={cn(
                "w-full px-4 py-3 text-left transition-colors hover:bg-[var(--ma-surface)]",
                isSelected && "bg-[var(--ma-surface)]",
              )}
            >
              <div className="flex items-start gap-2.5">
                {/* Dot non letta / brand */}
                <div className="mt-1.5 flex shrink-0 flex-col items-center gap-1">
                  {isUnread && (
                    <span className="block h-2 w-2 rounded-full bg-[var(--ma-accent)]" />
                  )}
                  {!isUnread && (
                    <span className="block h-2 w-2 rounded-full bg-transparent" />
                  )}
                  <span
                    className={cn(
                      "block h-1.5 w-1.5 rounded-full",
                      BRAND_DOT[email.brand] ?? "bg-gray-400",
                    )}
                    title={email.brand}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {/* Mittente + ora */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        isUnread
                          ? "font-semibold text-[var(--ma-ink)]"
                          : "text-[var(--ma-muted)]",
                      )}
                    >
                      {email.from_name ?? email.from_address}
                    </span>
                    <span className="shrink-0 text-[11px] text-[var(--ma-muted)]">
                      {fmtDate(email.created_at)}
                    </span>
                  </div>

                  {/* Oggetto */}
                  <p
                    className={cn(
                      "truncate text-sm",
                      isUnread
                        ? "font-medium text-[var(--ma-ink)]"
                        : "text-[var(--ma-muted)]",
                    )}
                  >
                    {email.subject || "(nessun oggetto)"}
                  </p>

                  {/* Anteprima testo */}
                  <p className="truncate text-xs text-[var(--ma-muted)]">
                    {email.text_body?.slice(0, 100) ?? ""}
                  </p>
                </div>

                {email.starred && (
                  <Star size={13} className="mt-1 shrink-0 fill-yellow-400 text-yellow-400" />
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
