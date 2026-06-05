"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";

type InitialProfile = {
  tenantSlug: string;
  email: string;
  roleLabel: string;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
};

const LANGUAGE_OPTIONS = [
  { value: "it", label: "Italiano" },
  { value: "en", label: "English" },
  { value: "fr", label: "Francais" },
  { value: "es", label: "Espanol" },
  { value: "de", label: "Deutsch" },
  { value: "pt-br", label: "Portugues brasileiro" },
];

export function GestioneProfileForm({ initial }: { initial: InitialProfile }) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [preferredLanguage, setPreferredLanguage] = useState(initial.preferredLanguage || "it");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDirty =
    firstName !== initial.firstName ||
    lastName !== initial.lastName ||
    preferredLanguage !== (initial.preferredLanguage || "it");

  useUnsavedChangesWarning(isDirty);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/gestione/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_slug: initial.tenantSlug,
            first_name: firstName,
            last_name: lastName,
            preferred_language: preferredLanguage,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Errore durante il salvataggio.");
          return;
        }
        setSaved(true);
      } catch {
        setError("Errore di rete.");
      }
    });
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="ga-card space-y-5">
        <div className="ga-section-head">
          <div>
            <h2 className="ga-section-title">Informazioni personali</h2>
            <p className="ga-card-hint">Questi dati identificano il tuo account nel pannello gestione.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input value={initial.email} disabled className="ga-input" />
          </Field>
          <Field label="Ruolo">
            <input value={initial.roleLabel} disabled className="ga-input" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Mario"
              className="ga-input"
              autoComplete="given-name"
            />
          </Field>
          <Field label="Cognome">
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Rossi"
              className="ga-input"
              autoComplete="family-name"
            />
          </Field>
        </div>

        <Field label="Lingua preferita">
          <select
            value={preferredLanguage}
            onChange={(event) => setPreferredLanguage(event.target.value)}
            className="ga-select"
          >
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </Field>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="ga-card-hint m-0">La lingua verra usata come preferenza per l&apos;accesso a gestione.</p>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm font-semibold text-emerald-700">Profilo salvato.</span>}
            <button type="submit" disabled={isPending} className="ga-btn ga-btn-primary">
              <Save size={14} />
              {isPending ? "Salvataggio..." : "Salva profilo"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="ga-label-text">{label}</span>
      {children}
    </label>
  );
}
