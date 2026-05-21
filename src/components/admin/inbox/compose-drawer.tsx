"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { X, Send, Paperclip, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboundEmailBrand } from "@/lib/email/inbound-types";

export type ComposeAttachment = {
  filename: string;
  /** Base64 senza prefisso `data:` */
  content: string;
  contentType?: string;
  /** Dimensione in byte, calcolata dal base64. */
  size: number;
};

const MAX_ATTACHMENT_MB = 8;
const MAX_TOTAL_MB = 20;

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function fileToAttachment(file: File): Promise<ComposeAttachment> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const content = btoa(binary);
  return {
    filename: file.name,
    content,
    contentType: file.type || undefined,
    size: file.size,
  };
}

type Props = {
  open: boolean;
  canCompose: boolean;
  onClose: () => void;
  onSent: () => void;
  defaultBrand?: InboundEmailBrand;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  initialAttachments?: ComposeAttachment[];
};

const BRAND_FROM: Record<InboundEmailBrand, string> = {
  menuary: "hello@menuary.it",
  bizery:  "hello@bizery.it",
};

const BRAND_LABELS: Record<InboundEmailBrand, string> = {
  menuary: "Menuary",
  bizery:  "Bizery",
};

const BRAND_ORDER: InboundEmailBrand[] = ["menuary", "bizery"];

const BRAND_PILL_ACTIVE: Record<InboundEmailBrand, string> = {
  menuary: "bg-[#a95f45] text-white shadow-sm",
  bizery:  "bg-[#3b6cb5] text-white shadow-sm",
};

export function ComposeDrawer({
  open,
  canCompose,
  onClose,
  onSent,
  defaultBrand = "menuary",
  initialTo,
  initialSubject,
  initialBody,
  initialAttachments,
}: Props) {
  const [brand, setBrand]       = useState<InboundEmailBrand>(defaultBrand);
  const [to, setTo]             = useState(initialTo ?? "");
  const [subject, setSubject]   = useState(initialSubject ?? "");
  const [body, setBody]         = useState(initialBody ?? "");
  const [attachments, setAttachments] = useState<ComposeAttachment[]>(initialAttachments ?? []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [signature, setSignature] = useState("");
  const [signatureFromName, setSignatureFromName] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [isPending, start]      = useTransition();
  const toRef = useRef<HTMLInputElement>(null);

  // Carica firma quando cambia brand
  useEffect(() => {
    if (!open || !canCompose) return;
    fetch(`/api/email/signature?brand=${brand}`)
      .then((r) => r.json())
      .then((d: { signature?: { html?: string; fromName?: string } }) => {
        setSignature(d.signature?.html ?? "");
        setSignatureFromName(d.signature?.fromName ?? "");
      })
      .catch(() => {
        setSignature("");
        setSignatureFromName("");
      });
  }, [brand, open, canCompose]);

  // All'apertura applica i prefill (To / Oggetto / Brand) e gestisce il focus
  useEffect(() => {
    if (!open) return;
    if (initialTo !== undefined) setTo(initialTo);
    if (initialSubject !== undefined) setSubject(initialSubject);
    if (initialBody !== undefined) setBody(initialBody);
    if (initialAttachments !== undefined) setAttachments(initialAttachments);
    setBrand(defaultBrand);
    setError(null);
    setTimeout(() => {
      if (initialTo) {
        // Se "A:" è già compilato porta il focus all'oggetto
        const el = document.activeElement as HTMLElement | null;
        el?.blur();
      } else {
        toRef.current?.focus();
      }
    }, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() {
    setTo(""); setSubject(""); setBody(""); setError(null); setAttachments([]);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setError(null);
    const next: ComposeAttachment[] = [...attachments];
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
        setError(`L'allegato "${file.name}" supera ${MAX_ATTACHMENT_MB} MB.`);
        continue;
      }
      const att = await fileToAttachment(file);
      next.push(att);
    }
    const total = next.reduce((s, a) => s + a.size, 0);
    if (total > MAX_TOTAL_MB * 1024 * 1024) {
      setError(`Dimensione totale degli allegati superiore a ${MAX_TOTAL_MB} MB.`);
      return;
    }
    setAttachments(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(i: number) {
    setAttachments((list) => list.filter((_, idx) => idx !== i));
  }

  function handleClose() {
    reset();
    onClose();
  }

  function buildHtml(): string {
    const bodyHtml = body.replace(/\n/g, "<br>");
    const sigBlock = signature ? `<br><br>${signature}` : "";
    return `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#111;line-height:1.7">${bodyHtml}</div>${sigBlock}`;
  }

  function handleSend() {
    setError(null);
    const toList = to.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (!toList.length) { setError("Inserisci almeno un destinatario."); return; }
    if (!subject.trim()) { setError("L'oggetto è obbligatorio."); return; }

    const fromName = signatureFromName || BRAND_LABELS[brand];
    const fromOverride = `${fromName} <${BRAND_FROM[brand]}>`;
    const replyTo = BRAND_FROM[brand];

    start(async () => {
      try {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: toList,
            subject: subject.trim(),
            html: buildHtml(),
            fromOverride,
            replyTo,
            ...(attachments.length
              ? {
                  attachments: attachments.map((a) => ({
                    filename: a.filename,
                    content: a.content,
                    contentType: a.contentType,
                  })),
                }
              : {}),
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Errore invio.");
          return;
        }
        reset();
        onSent();
        onClose();
      } catch {
        setError("Errore di rete.");
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />

      {/* Pannello */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--ma-line)] px-5 py-4">
          <h2 className="font-semibold text-[var(--ma-ink)]">Nuovo messaggio</h2>
          <button onClick={handleClose} className="menuary-admin-nav-link !w-auto !px-2 !py-1.5" aria-label="Chiudi">
            <X size={16} />
          </button>
        </div>

        {/* Campi */}
        <div className="divide-y divide-[var(--ma-line)]">
          {/* Da: picker brand sempre visibile, preselezionato in base al contesto. */}
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="w-14 shrink-0 text-sm text-[var(--ma-muted)]">Da</span>
            <div
              role="radiogroup"
              aria-label="Casella di invio"
              className="inline-flex rounded-full bg-[var(--ma-surface)] p-1"
            >
              {BRAND_ORDER.map((b) => {
                const active = brand === b;
                return (
                  <button
                    key={b}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setBrand(b)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      active
                        ? BRAND_PILL_ACTIVE[b]
                        : "text-[var(--ma-muted)] hover:text-[var(--ma-ink)]",
                    )}
                  >
                    {BRAND_LABELS[b]}{" "}
                    <span className={cn("font-normal", active ? "opacity-80" : "opacity-60")}>
                      · {BRAND_FROM[b]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center px-5 py-2.5">
            <span className="w-14 shrink-0 text-sm text-[var(--ma-muted)]">A</span>
            <input
              ref={toRef}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="destinatario@email.it, altro@email.it"
              className="flex-1 bg-transparent text-sm text-[var(--ma-ink)] placeholder:text-[var(--ma-muted)] focus:outline-none"
            />
          </div>
          <div className="flex items-center px-5 py-2.5">
            <span className="w-14 shrink-0 text-sm text-[var(--ma-muted)]">Oggetto</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Oggetto del messaggio"
              className="flex-1 bg-transparent text-sm text-[var(--ma-ink)] placeholder:text-[var(--ma-muted)] focus:outline-none"
            />
          </div>
        </div>

        {/* Corpo */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Scrivi il tuo messaggio..."
          rows={10}
          className="flex-1 resize-none px-5 py-4 text-sm text-[var(--ma-ink)] placeholder:text-[var(--ma-muted)] focus:outline-none"
        />

        {/* Allegati */}
        {attachments.length > 0 && (
          <div className="border-t border-[var(--ma-line)] px-5 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ma-muted)]">
              Allegati ({attachments.length})
            </p>
            <ul className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <li
                  key={`${a.filename}-${i}`}
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--ma-line)] bg-[var(--ma-surface)] px-2 py-1 text-xs text-[var(--ma-ink)]"
                >
                  <Paperclip size={12} />
                  <span className="max-w-[200px] truncate" title={a.filename}>{a.filename}</span>
                  <span className="text-[var(--ma-muted)]">{fmtSize(a.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-[var(--ma-muted)] hover:text-red-600"
                    aria-label={`Rimuovi ${a.filename}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Anteprima firma automatica (sola lettura) */}
        {signature && (
          <div className="border-t border-[var(--ma-line)] px-5 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ma-muted)]">
              Firma automatica
            </p>
            <div
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: signature }}
            />
          </div>
        )}

        {/* Footer */}
        <div className={cn("flex items-center justify-between border-t border-[var(--ma-line)] px-5 py-3", error && "flex-col gap-2 items-start")}>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex w-full items-center justify-between gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ma-line)] px-3 py-1.5 text-xs font-medium text-[var(--ma-ink)] hover:bg-[var(--ma-surface)]"
            >
              <Paperclip size={13} /> Allega file
            </button>
            <button
              onClick={handleSend}
              disabled={isPending || !canCompose}
              className="menuary-admin-action-btn flex items-center gap-2 disabled:opacity-50"
            >
              <Send size={15} />
              {isPending ? "Invio…" : "Invia"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
