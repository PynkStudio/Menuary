"use client";

import { useState } from "react";
import type { StudioBillingProfile } from "@/lib/studio-types";

export function StudioBillingForm({ initial }: { initial: StudioBillingProfile }) {
  const [hint, setHint] = useState(false);

  return (
    <form
      className="mx-auto max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setHint(true);
      }}
    >
      <label className="block text-sm font-bold">
        Nome commerciale (insegna)
        <input
          name="tradeName"
          defaultValue={initial.tradeName}
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
        />
      </label>
      <label className="block text-sm font-bold">
        Ragione sociale
        <input
          name="legalName"
          defaultValue={initial.legalName}
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Partita IVA
          <input
            name="vatNumber"
            defaultValue={initial.vatNumber}
            className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
          />
        </label>
        <label className="block text-sm font-bold">
          Codice fiscale
          <input
            name="fiscalCode"
            defaultValue={initial.fiscalCode}
            className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
          />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Codice destinatario (SDI)
          <input
            name="sdiRecipientCode"
            defaultValue={initial.sdiRecipientCode}
            className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
          />
        </label>
        <label className="block text-sm font-bold">
          PEC
          <input
            type="email"
            name="pecEmail"
            defaultValue={initial.pecEmail}
            className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
          />
        </label>
      </div>
      <label className="block text-sm font-bold">
        Indirizzo sede legale / amministrativa
        <textarea
          name="legalAddress"
          rows={4}
          defaultValue={initial.legalAddress}
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
        />
      </label>
      <label className="block text-sm font-bold">
        Email per fatturazione e solleciti
        <input
          type="email"
          name="billingEmail"
          defaultValue={initial.billingEmail}
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
        />
      </label>
      <button type="submit" className="menuary-button menuary-button-accent">
        Salva dati di fatturazione
      </button>
      {hint && (
        <p className="text-sm text-[var(--menuary-sage)]" role="status">
          (Demo) Salvataggio collegato a backend / Supabase in seguito.
        </p>
      )}
    </form>
  );
}
