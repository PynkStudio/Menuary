"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboundEmailBrand } from "@/lib/email/inbound-types";

type Props = {
  open: boolean;
  canCompose: boolean;
  onClose: () => void;
  onSent: () => void;
  defaultBrand?: InboundEmailBrand;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
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
}: Props) {
  const [brand, setBrand]       = useState<InboundEmailBrand>(defaultBrand);
  const [to, setTo]             = useState(initialTo ?? "");
  const [subject, setSubject]   = useState(initialSubject ?? "");
  const [body, setBody]         = useState(initialBody ?? "");
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
    setTo(""); setSubject(""); setBody(""); setError(null);
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
          <div className="flex w-full items-center justify-end">
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
