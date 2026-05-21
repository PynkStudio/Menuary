"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Archive, ArrowLeft, Download, ExternalLink, Link2, Paperclip, Reply, Search, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { markEmailRead, starEmail, archiveEmail, deleteEmail } from "@/lib/email/inbound-queries";
import { findLeadsByEmails, searchLeads, linkInboundEmailToLead } from "@/lib/email/lead-link-queries";
import { buildEmailSrcDoc } from "@/lib/email/render-html";
import type { InboundEmail } from "@/lib/email/inbound-types";
import type { ResendInboundAttachment } from "@/lib/email/inbound-types";
import type { LeadMatch } from "@/lib/email/lead-link-queries";

type Props = {
  email: InboundEmail;
  onClose: () => void;
  onMutated: () => void;
  onReply?: (email: InboundEmail) => void;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const BRAND_BADGE: Record<string, string> = {
  menuary: "bg-[#a95f45]/12 text-[#743d2f]",
  bizery:  "bg-[#3b6cb5]/12 text-[#234a85]",
};

const VERTICAL_LABELS: Record<string, string> = {
  food: "Menuary",
  services: "Bizery",
};

/** Converte URL in testo plain in link cliccabili. */
function linkifyText(text: string): React.ReactNode[] {
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRe);
  return parts.map((part, i) =>
    urlRe.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--ma-accent)] underline underline-offset-2 break-all"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

function PlainTextEmail({ text }: { text: string }) {
  return (
    <div className="space-y-1 text-sm leading-relaxed text-[var(--ma-ink)]">
      {text.split(/\r?\n/).map((line, i) => {
        const match = line.match(/^(>+)\s?(.*)$/);
        const depth = Math.min(match?.[1].length ?? 0, 4);
        return (
          <div
            key={i}
            className={cn(
              "min-h-[1em] whitespace-pre-wrap",
              depth > 0 && "border-l-2 border-[var(--ma-line)] pl-3 text-[var(--ma-muted)]",
            )}
            style={depth > 0 ? { marginLeft: `${(depth - 1) * 14}px` } : undefined}
          >
            {linkifyText(match?.[2] ?? line)}
          </div>
        );
      })}
    </div>
  );
}

function base64ToBlob(content: string, contentType: string): Blob {
  const binary = window.atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: contentType });
}

function openAttachment(att: ResendInboundAttachment) {
  if (!att.content) return;
  const blob = base64ToBlob(att.content, att.content_type ?? "application/octet-stream");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadAttachment(att: ResendInboundAttachment, fallbackName: string) {
  if (!att.content) return;
  const blob = base64ToBlob(att.content, att.content_type ?? "application/octet-stream");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = att.filename ?? fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── LeadPanel ────────────────────────────────────────────────────────────────

type LeadPanelProps = {
  emailId: string;
  linkedLeadId: string | null;
  autoMatches: LeadMatch[];
  onLinked: (leadId: string | null) => void;
};

function LeadPanel({ emailId, linkedLeadId, autoMatches, onLinked }: LeadPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<LeadMatch[]>([]);
  const [searching, setSearching]       = useState(false);
  const [open, setOpen]                 = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchRef.current = setTimeout(async () => {
      try {
        const r = await searchLeads(q);
        setSearchResults(r);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function handleLink(leadId: string | null) {
    startTransition(async () => {
      await linkInboundEmailToLead(emailId, leadId);
      onLinked(leadId);
      setOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    });
  }

  const displayResults = searchQuery.trim() ? searchResults : autoMatches;

  return (
    <div className="border-b border-[var(--ma-line)] px-5 py-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ma-muted)]">
          Lead collegato
        </p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="menuary-admin-nav-link !w-auto !px-2 !py-1 text-xs gap-1"
          title="Collega lead"
        >
          <Link2 size={12} />
          {linkedLeadId ? "Cambia" : "Collega"}
        </button>
      </div>

      {linkedLeadId ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="flex-1 rounded-lg bg-[var(--ma-surface)] px-3 py-1.5 text-sm font-medium text-[var(--ma-ink)]">
            Lead #{linkedLeadId.slice(0, 8)}…
          </span>
          <button
            onClick={() => handleLink(null)}
            disabled={isPending}
            className="menuary-admin-nav-link !w-auto !px-2 !py-1 text-xs text-red-500"
            title="Scollega"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <p className="mt-1 text-xs text-[var(--ma-muted)]">Nessun lead collegato</p>
      )}

      {open && (
        <div className="mt-2 space-y-1.5">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ma-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cerca per nome o email…"
              className="menuary-admin-input w-full !pl-8 !py-1.5 text-sm"
            />
          </div>

          {searching && (
            <p className="text-xs text-[var(--ma-muted)]">Ricerca…</p>
          )}

          {displayResults.length > 0 && (
            <ul className="rounded-lg border border-[var(--ma-line)] bg-[var(--ma-paper)] divide-y divide-[var(--ma-line)] overflow-hidden">
              {displayResults.map((lead) => (
                <li key={lead.id}>
                  <button
                    onClick={() => handleLink(lead.id)}
                    disabled={isPending}
                    className="w-full px-3 py-2 text-left hover:bg-[var(--ma-surface)] transition-colors"
                  >
                    <span className="block text-sm font-medium text-[var(--ma-ink)]">
                      {lead.business_name}
                    </span>
                    <span className="block text-xs text-[var(--ma-muted)]">
                      {lead.contact_name} · {lead.contact_email} ·{" "}
                      {VERTICAL_LABELS[lead.business_vertical] ?? lead.business_vertical}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!searching && searchQuery.trim() && searchResults.length === 0 && (
            <p className="text-xs text-[var(--ma-muted)]">Nessun lead trovato</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── EmailDetail ──────────────────────────────────────────────────────────────

export function EmailDetail({ email, onClose, onMutated, onReply }: Props) {
  const [isPending, startTransition] = useTransition();
  const [starred, setStarred]       = useState(email.starred);
  const [linkedLeadId, setLinkedLeadId] = useState(email.lead_id);
  const [autoMatches, setAutoMatches]   = useState<LeadMatch[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-match lead dal mittente
  useEffect(() => {
    findLeadsByEmails([email.from_address])
      .then(setAutoMatches)
      .catch(() => {});
  }, [email.from_address]);

  // Adatta l'altezza dell'iframe al suo contenuto
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    function resize() {
      try {
        const h = iframe!.contentDocument?.documentElement?.scrollHeight;
        if (h && h > 0) iframe!.style.height = `${h + 16}px`;
      } catch {}
    }
    iframe.addEventListener("load", resize);
    return () => iframe.removeEventListener("load", resize);
  }, [email.html_body]);

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
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Indietro</span>
        </button>

        <button
          onClick={handleStar}
          disabled={isPending}
          className={cn("menuary-admin-nav-link !w-auto !px-2 !py-1.5", starred && "text-yellow-500")}
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

        {onReply && (
          <button
            onClick={() => onReply(email)}
            className="menuary-admin-nav-link !w-auto !px-2 !py-1.5"
            title="Rispondi"
          >
            <Reply size={16} />
          </button>
        )}

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

        {/* Allegati */}
        {email.attachments.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {email.attachments.map((att, i) => {
              const name = att.filename ?? `allegato-${i + 1}`;
              const hasContent = !!att.content;
              return hasContent ? (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--ma-line)] bg-[var(--ma-surface)] px-2 py-1 text-xs text-[var(--ma-ink)]"
                >
                  <Paperclip size={12} className="text-[var(--ma-muted)]" />
                  <span className="max-w-[220px] truncate">{name}</span>
                  {att.size ? <span className="text-[var(--ma-muted)]">({(att.size / 1024).toFixed(0)} KB)</span> : null}
                  <button
                    type="button"
                    onClick={() => openAttachment(att)}
                    className="ml-1 rounded p-0.5 text-[var(--ma-muted)] hover:bg-[var(--ma-paper)] hover:text-[var(--ma-ink)]"
                    title="Apri allegato"
                  >
                    <ExternalLink size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(att, name)}
                    className="rounded p-0.5 text-[var(--ma-muted)] hover:bg-[var(--ma-paper)] hover:text-[var(--ma-ink)]"
                    title="Scarica allegato"
                  >
                    <Download size={12} />
                  </button>
                </div>
              ) : (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--ma-line)] bg-[var(--ma-surface)] px-2.5 py-1 text-xs text-[var(--ma-muted)]"
                >
                  <Paperclip size={12} />
                  {name}
                  {att.size ? (
                    <span>({(att.size / 1024).toFixed(0)} KB)</span>
                  ) : null}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Lead panel */}
      <LeadPanel
        emailId={email.id}
        linkedLeadId={linkedLeadId}
        autoMatches={autoMatches}
        onLinked={setLinkedLeadId}
      />

      {/* Corpo email */}
      <div className="flex-1 overflow-y-auto p-5">
        {email.html_body ? (
          <iframe
            ref={iframeRef}
            srcDoc={buildEmailSrcDoc(email.html_body)}
            className="w-full rounded-lg border border-[var(--ma-line)]"
            style={{ minHeight: "400px", height: "400px" }}
            sandbox="allow-same-origin"
            title="Corpo email"
          />
        ) : email.text_body ? (
          <PlainTextEmail text={email.text_body} />
        ) : (
          <p className="text-sm text-[var(--ma-muted)]">(Nessun contenuto)</p>
        )}
      </div>
    </div>
  );
}
