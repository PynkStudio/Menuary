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
  const [savedHint, setSavedHint] = useState(false);

  return (
    <form
      className="mx-auto max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setSavedHint(true);
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
          className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3"
        />
      </label>
      <label className="block text-sm font-bold">
        Telefono
        <input
          type="tel"
          name="phone"
          defaultValue={initial.phone}
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
      <button type="submit" className="menuary-button menuary-button-accent">
        Salva profilo
      </button>
      {savedHint && (
        <p className="text-sm text-[var(--menuary-sage)]" role="status">
          (Demo) Salvataggio collegato a Supabase in seguito.
        </p>
      )}
    </form>
  );
}
