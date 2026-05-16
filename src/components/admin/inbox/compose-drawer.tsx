"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { X, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboundEmailBrand } from "@/lib/email/inbound-types";

type Props = {
  open: boolean;
  canCompose: boolean;
  onClose: () => void;
  onSent: () => void;
  defaultBrand?: InboundEmailBrand;
};

const BRAND_FROM: Record<InboundEmailBrand, string> = {
  menuary: "hello@menuary.it",
  bizery:  "hello@bizery.it",
};

const BRAND_LABELS: Record<InboundEmailBrand, string> = {
  menuary: "Menuary",
  bizery:  "Bizery",
};

export function ComposeDrawer({ open, canCompose, onClose, onSent, defaultBrand = "menuary" }: Props) {
  const [brand, setBrand]       = useState<InboundEmailBrand>(defaultBrand);
  const [to, setTo]             = useState("");
  const [subject, setSubject]   = useState("");
  const [body, setBody]         = useState("");
  const [signature, setSignature] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [isPending, start]      = useTransition();
  const toRef = useRef<HTMLInputElement>(null);

  // Carica firma quando cambia brand
  useEffect(() => {
    if (!open || !canCompose) return;
    fetch(`/api/email/signature?brand=${brand}`)
      .then((r) => r.json())
      .then((d: { signature?: { html?: string } }) => {
        setSignature(d.signature?.html ?? "");
      })
      .catch(() => setSignature(""));
  }, [brand, open, canCompose]);

  // Focus su "A:" all'apertura
  useEffect(() => {
    if (open) setTimeout(() => toRef.current?.focus(), 100);
  }, [open]);

  function reset() {
    setTo(""); setSubject(""); setBody(""); setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function buildHtml(): string {
    const bodyHtml = body.replace(/\n/g, "<br>");
    const sigBlock = signature
      ? `<br><br><hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"><p style="font-size:13px;color:#374151;line-height:1.6">${signature}</p>`
      : "";
    return `<p style="font-size:15px;color:#111;line-height:1.7">${bodyHtml}</p>${sigBlock}`;
  }

  function handleSend() {
    setError(null);
    const toList = to.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (!toList.length) { setError("Inserisci almeno un destinatario."); return; }
    if (!subject.trim()) { setError("L'oggetto è obbligatorio."); return; }

    const fromName = signature ? signature.split("<br>")[0].replace(/<[^>]+>/g, "") : BRAND_LABELS[brand];
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
          <div className="flex items-center gap-2">
            {/* Selettore brand */}
            <div className="relative">
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as InboundEmailBrand)}
                className="appearance-none rounded-lg border border-[var(--ma-line)] bg-[var(--ma-surface)] py-1.5 pl-3 pr-8 text-sm font-medium text-[var(--ma-ink)] focus:outline-none"
              >
                <option value="menuary">menuary.it</option>
                <option value="bizery">bizery.it</option>
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ma-muted)]" />
            </div>
            <button onClick={handleClose} className="menuary-admin-nav-link !w-auto !px-2 !py-1.5">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Campi */}
        <div className="divide-y divide-[var(--ma-line)]">
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

        {/* Anteprima firma */}
        {signature && (
          <div className="border-t border-[var(--ma-line)] px-5 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ma-muted)]">Firma</p>
            <div
              className="text-xs text-[var(--ma-muted)]"
              dangerouslySetInnerHTML={{ __html: signature }}
            />
          </div>
        )}

        {/* Footer */}
        <div className={cn("flex items-center justify-between border-t border-[var(--ma-line)] px-5 py-3", error && "flex-col gap-2 items-start")}>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-[var(--ma-muted)]">
              Da: {BRAND_FROM[brand]}
            </span>
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
