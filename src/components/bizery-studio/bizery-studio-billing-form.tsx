"use client";

import { useState } from "react";
import type { StudioBillingProfile } from "@/lib/studio-types";

export function BizeryStudioBillingForm({ initial }: { initial: StudioBillingProfile }) {
  const [hint, setHint] = useState(false);

  const inputClass =
    "mt-2 w-full rounded-xl border border-[var(--bs-line)] bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--bs-accent)]/30";

  return (
    <form
      className="mx-auto max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setHint(true);
      }}
    >
      <label className="block text-sm font-bold">
        Nome commerciale (insegna / attività)
        <input name="tradeName" defaultValue={initial.tradeName} className={inputClass} />
      </label>
      <label className="block text-sm font-bold">
        Ragione sociale
        <input name="legalName" defaultValue={initial.legalName} className={inputClass} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Partita IVA
          <input name="vatNumber" defaultValue={initial.vatNumber} className={inputClass} />
        </label>
        <label className="block text-sm font-bold">
          Codice fiscale
          <input name="fiscalCode" defaultValue={initial.fiscalCode} className={inputClass} />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Codice destinatario (SDI)
          <input name="sdiRecipientCode" defaultValue={initial.sdiRecipientCode} className={inputClass} />
        </label>
        <label className="block text-sm font-bold">
          PEC
          <input type="email" name="pecEmail" defaultValue={initial.pecEmail} className={inputClass} />
        </label>
      </div>
      <label className="block text-sm font-bold">
        Indirizzo sede legale / amministrativa
        <textarea name="legalAddress" rows={4} defaultValue={initial.legalAddress} className={inputClass} />
      </label>
      <label className="block text-sm font-bold">
        Email per fatturazione e solleciti
        <input type="email" name="billingEmail" defaultValue={initial.billingEmail} className={inputClass} />
      </label>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl bg-[var(--bs-accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
      >
        Salva dati di fatturazione
      </button>
      {hint && (
        <p className="text-sm text-[var(--bs-success)]" role="status">
          (Demo) Salvataggio collegato a backend / Supabase in seguito.
        </p>
      )}
    </form>
  );
}
