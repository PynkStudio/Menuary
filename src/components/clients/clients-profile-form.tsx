"use client";

import { useState } from "react";
import type { ClientProfile } from "@/lib/clients-types";

const DIETARY = [
  "vegetariano",
  "vegano",
  "senza glutine",
  "senza lattosio",
  "halal",
  "kosher",
] as const;

export function ClientsProfileForm({ initial }: { initial: ClientProfile }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  return (
    <form
      className="mx-auto max-w-2xl space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("saving");
        const data = new FormData(e.currentTarget);
        const response = await fetch("/api/client/profile", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            firstName: data.get("firstName"),
            lastName: data.get("lastName"),
            birthDate: data.get("birthDate"),
            allergiesNote: data.get("allergiesNote"),
            dietaryPreferences: data.getAll("diet"),
          }),
        });
        setStatus(response.ok ? "saved" : "error");
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Nome
          <input
            name="firstName"
            defaultValue={initial.firstName}
            className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
          />
        </label>
        <label className="block text-sm font-bold">
          Cognome
          <input
            name="lastName"
            defaultValue={initial.lastName}
            className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
          />
        </label>
      </div>
      <label className="block text-sm font-bold">
        Email
        <input
          type="email"
          name="email"
          defaultValue={initial.email}
          readOnly
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
        />
      </label>
      <label className="block text-sm font-bold">
        Telefono
        <input
          type="tel"
          name="phone"
          defaultValue={initial.phone}
          readOnly
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
        />
      </label>
      <label className="block text-sm font-bold">
        Data di nascita
        <input
          type="date"
          name="birthDate"
          defaultValue={initial.birthDate}
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
        />
      </label>
      <label className="block text-sm font-bold">
        Allergie e intolleranze (testo libero)
        <textarea
          name="allergiesNote"
          rows={4}
          defaultValue={initial.allergiesNote}
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
        />
      </label>
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold">Preferenze alimentari</legend>
        <div className="flex flex-wrap gap-3">
          {DIETARY.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="diet"
                value={key}
                defaultChecked={initial.dietaryPreferences.includes(key)}
              />
              {key}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit" disabled={status === "saving"} className="menuary-button menuary-button-accent disabled:opacity-60">
        {status === "saving" ? "Salvataggio…" : "Salva profilo"}
      </button>
      {status === "saved" && (
        <p className="text-sm text-[var(--menuary-sage)]" role="status">
          Profilo aggiornato. I prossimi suggerimenti terranno conto delle tue preferenze.
        </p>
      )}
      {status === "error" && <p className="text-sm text-red-700" role="alert">Non è stato possibile salvare il profilo. Riprova.</p>}
    </form>
  );
}
