"use client";

import { useState } from "react";

type FormStatus =
  | { type: "idle" }
  | { type: "sending" }
  | { type: "success" }
  | { type: "error"; message: string };

export function BizeryContactForm() {
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });

  async function submit(formData: FormData) {
    setStatus({ type: "sending" });
    const raw = Object.fromEntries(formData.entries());
    const payload = {
      name: raw.nome,
      businessName: raw.azienda,
      email: raw.email,
      phone: raw.telefono,
      interest: raw.settore,
      message: raw.messaggio,
      website: raw.website,
      vertical: "services",
    };

    const response = await fetch("/api/marketing-leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response) {
      setStatus({ type: "error", message: "Connessione non disponibile." });
      return;
    }

    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    if (!response.ok || !data?.ok) {
      setStatus({ type: "error", message: data?.error ?? "Invio non riuscito." });
      return;
    }

    setStatus({ type: "success" });
  }

  const disabled = status.type === "sending" || status.type === "success";

  return (
    <form
      action={submit}
      className="space-y-5 border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-8 lg:p-10"
    >
      <h2
        className="text-2xl font-medium tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
      >
        Richiedi una proposta
      </h2>
      <p className="text-[14px] leading-6 text-[var(--menuary-muted)]">
        Compila il modulo: prendiamo in carico la richiesta e ti ricontattiamo entro 24 ore lavorative.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Nome</span>
          <input
            name="nome"
            type="text"
            required
            autoComplete="name"
            placeholder="Mario Rossi"
            className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)]"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Azienda</span>
          <input
            name="azienda"
            type="text"
            required
            placeholder="Nome azienda"
            className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)]"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="mario@azienda.it"
            className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)]"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Telefono</span>
          <input
            name="telefono"
            type="tel"
            autoComplete="tel"
            placeholder="+39 …"
            className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)]"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Settore</span>
        <select
          name="settore"
          defaultValue=""
          className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)]"
        >
          <option value="">Seleziona il tuo settore</option>
          <option>Studio professionale (legale, fiscale, medico)</option>
          <option>Centro benessere / salone</option>
          <option>Officina / centro assistenza</option>
          <option>Scuola / formazione</option>
          <option>Fitness / palestra</option>
          <option>Altro settore di servizi</option>
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--menuary-muted)]">Messaggio</span>
        <textarea
          name="messaggio"
          rows={4}
          placeholder="Raccontaci la tua azienda e cosa stai cercando…"
          className="mt-2 w-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-4 py-3 text-sm outline-none transition focus:border-[var(--menuary-copper)] resize-none"
        />
      </label>

      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <button
        type="submit"
        disabled={disabled}
        className="menuary-button menuary-button-accent w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status.type === "success" ? "Richiesta inviata" : status.type === "sending" ? "Invio in corso…" : "Invia richiesta"}
      </button>

      {status.type === "error" && (
        <p className="rounded-md bg-[#c86b4f]/10 px-4 py-3 text-sm font-semibold text-[#9a3b22] ring-1 ring-[#c86b4f]/30">
          {status.message}
        </p>
      )}
      {status.type === "success" && (
        <p className="rounded-md bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-500/30">
          Richiesta ricevuta. Ti abbiamo mandato una conferma via email — ti rispondiamo entro 24 ore lavorative.
        </p>
      )}

      <p className="text-center text-xs text-[var(--menuary-muted)]">
        Prima chiamata sempre gratuita.
      </p>
    </form>
  );
}
