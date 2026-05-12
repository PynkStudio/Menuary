"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type FormStatus =
  | { type: "idle" }
  | { type: "sending" }
  | { type: "success" }
  | { type: "error"; message: string };

export function MarketingLeadForm() {
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });

  async function submit(formData: FormData) {
    setStatus({ type: "sending" });
    const payload = Object.fromEntries(formData.entries());
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
      setStatus({
        type: "error",
        message: data?.error ?? "Invio non riuscito.",
      });
      return;
    }

    setStatus({ type: "success" });
  }

  return (
    <form
      action={submit}
      className="rounded-[2rem] bg-white p-2 shadow-[0_30px_90px_rgba(20,16,16,0.08)] ring-1 ring-black/5"
    >
      <div className="rounded-[1.7rem] bg-[#17120f] p-5 text-white sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <input name="name" required autoComplete="name" />
          </Field>
          <Field label="Ristorante">
            <input name="restaurantName" required />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Telefono">
            <input name="phone" autoComplete="tel" />
          </Field>
          <Field label="Citta">
            <input name="city" />
          </Field>
          <Field label="Interesse">
            <select name="interest" defaultValue="demo">
              <option value="demo">Demo commerciale</option>
              <option value="tenant">Nuovo sito tenant</option>
              <option value="migration">Rifacimento sito esistente</option>
              <option value="modules">Ordini / QR / cucina</option>
            </select>
          </Field>
        </div>

        <Field label="Obiettivo" full>
          <textarea
            name="message"
            rows={5}
            placeholder="Esigenze, tempistiche, dominio esistente, funzioni desiderate."
          />
        </Field>

        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/58">
            Rispondiamo con proposta e prossimi passi.
          </p>
          <button
            type="submit"
            disabled={status.type === "sending" || status.type === "success"}
            className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#f5c518] px-5 py-3 font-bold text-[#17120f] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status.type === "success" ? "Richiesta inviata" : "Invia richiesta"}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
              {status.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <ArrowRight size={16} />
              )}
            </span>
          </button>
        </div>

        {status.type === "error" && (
          <p className="mt-4 rounded-2xl bg-[#b8332e]/20 px-4 py-3 text-sm font-semibold text-[#ffd7d2] ring-1 ring-[#b8332e]/30">
            {status.message}
          </p>
        )}
        {status.type === "success" && (
          <p className="mt-4 rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-300/20">
            Richiesta registrata. Ti ricontatteremo con una proposta mirata.
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactElement<{
    className?: string;
  }>;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "mt-4" : ""}`}>
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/52">
        {label}
      </span>
      <span className="block [&_input]:w-full [&_input]:rounded-2xl [&_input]:border-0 [&_input]:bg-white/10 [&_input]:px-4 [&_input]:py-3 [&_input]:text-white [&_input]:outline-none [&_input]:ring-1 [&_input]:ring-white/10 [&_input]:placeholder:text-white/35 [&_input]:focus:ring-[#f5c518]/60 [&_select]:w-full [&_select]:rounded-2xl [&_select]:border-0 [&_select]:bg-white/10 [&_select]:px-4 [&_select]:py-3 [&_select]:text-white [&_select]:outline-none [&_select]:ring-1 [&_select]:ring-white/10 [&_select]:focus:ring-[#f5c518]/60 [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:rounded-2xl [&_textarea]:border-0 [&_textarea]:bg-white/10 [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-white [&_textarea]:outline-none [&_textarea]:ring-1 [&_textarea]:ring-white/10 [&_textarea]:placeholder:text-white/35 [&_textarea]:focus:ring-[#f5c518]/60">
        {children}
      </span>
    </label>
  );
}
