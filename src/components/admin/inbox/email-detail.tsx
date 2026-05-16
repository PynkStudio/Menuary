"use client";

import { useState, useTransition } from "react";
import { Archive, ArrowLeft, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { markEmailRead, starEmail, archiveEmail, deleteEmail } from "@/lib/email/inbound-queries";
import type { InboundEmail } from "@/lib/email/inbound-types";

type Props = {
  email: InboundEmail;
  onClose: () => void;
  onMutated: () => void;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const BRAND_BADGE: Record<string, string> = {
  menuary: "bg-red-100 text-red-700",
  bizery:  "bg-blue-100 text-blue-700",
};

export function EmailDetail({ email, onClose, onMutated }: Props) {
  const [isPending, startTransition] = useTransition();
  const [starred, setStarred] = useState(email.starred);

  function handleStar() {
    const next = !starred;
    setStarred(next);
    startTransition(async () => {
      await starEmail(email.id, next);
      onMutated();
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveEmail(email.id);
      onClose();
      onMutated();
    });
  }

  function handleDelete() {
    if (!confirm("Eliminare definitivamente questa email?")) return;
    startTransition(async () => {
      await deleteEmail(email.id);
      onClose();
      onMutated();
    });
  }

  function handleMarkUnread() {
    startTransition(async () => {
      await markEmailRead(email.id, false);
      onMutated();
    });
  }

  const displayFrom = email.from_name
    ? `${email.from_name} <${email.from_address}>`
    : email.from_address;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-[var(--ma-line)] px-5 py-3">
        <button
          onClick={onClose}
          className="menuary-admin-nav-link mr-2 !w-auto gap-1.5 !px-2 !py-1.5 text-sm"
          aria-label="Torna alla lista"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Indietro</span>
        </button>

        <button
          onClick={handleStar}
          disabled={isPending}
          className={cn(
            "menuary-admin-nav-link !w-auto !px-2 !py-1.5",
            starred && "text-yellow-500",
          )}
          title={starred ? "Rimuovi stella" : "Aggiungi stella"}
        >
          <Star size={16} fill={starred ? "currentColor" : "none"} />
        </button>

        <button
          onClick={handleMarkUnread}
          disabled={isPending}
          className="menuary-admin-nav-link !w-auto !px-2 !py-1.5 text-xs"
          title="Segna come non letta"
        >
          Non letta
        </button>

        <div className="flex-1" />

        <button
          onClick={handleArchive}
          disabled={isPending}
          className="menuary-admin-nav-link !w-auto !px-2 !py-1.5"
          title="Archivia"
        >
          <Archive size={16} />
        </button>

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="menuary-admin-nav-link !w-auto !px-2 !py-1.5 text-red-500"
          title="Elimina"
        >
          <Trash2 size={16} />
        </button>

        <button
          onClick={onClose}
          className="menuary-admin-nav-link !w-auto !px-2 !py-1.5 lg:hidden"
          aria-label="Chiudi"
        >
          <X size={16} />
        </button>
      </div>

      {/* Header email */}
      <div className="border-b border-[var(--ma-line)] px-5 py-4">
        <div className="mb-2 flex flex-wrap items-start gap-2">
          <h2 className="flex-1 text-lg font-semibold text-[var(--ma-ink)] leading-snug">
            {email.subject || "(nessun oggetto)"}
          </h2>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              BRAND_BADGE[email.brand] ?? "bg-gray-100 text-gray-600",
            )}
          >
            {email.brand}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--ma-muted)]">
          <span>
            <span className="font-medium text-[var(--ma-ink)]">Da:</span> {displayFrom}
          </span>
          <span>
            <span className="font-medium text-[var(--ma-ink)]">A:</span>{" "}
            {email.to_addresses.join(", ")}
          </span>
          <span>{fmtDate(email.created_at)}</span>
        </div>

        {email.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {email.attachments.map((att, i) => (
              <span
                key={i}
                className="rounded-md border border-[var(--ma-line)] bg-[var(--ma-paper)] px-2 py-1 text-xs text-[var(--ma-muted)]"
              >
                📎 {att.filename ?? `allegato-${i + 1}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Corpo email */}
      <div className="flex-1 overflow-y-auto p-5">
        {email.html_body ? (
          <iframe
            srcDoc={email.html_body}
            className="h-full min-h-96 w-full rounded-lg border border-[var(--ma-line)]"
            sandbox="allow-same-origin"
            title="Corpo email"
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--ma-ink)] leading-relaxed">
            {email.text_body ?? "(Nessun contenuto)"}
          </pre>
        )}
      </div>
    </div>
  );
}
