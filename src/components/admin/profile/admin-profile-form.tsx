"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";

type Initial = {
  email:     string;
  role:      string;
  firstName: string;
  lastName:  string;
  phone:     string;
  workHours: string;
};

const ROLE_LABEL_IT: Record<string, string> = {
  superadmin:      "Amministratore di sistema",
  admin:           "Amministratore",
  amministrazione: "Amministrazione",
  venditore:       "Consulente commerciale",
  lead_inserter:   "Sviluppo commerciale",
};

export function AdminProfileForm({ initial }: { initial: Initial }) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName,  setLastName]  = useState(initial.lastName);
  const [phone,     setPhone]     = useState(initial.phone);
  const [workHours, setWorkHours] = useState(initial.workHours);
  const [error,     setError]     = useState<string | null>(null);
  const [saved,     setSaved]     = useState(false);
  const [isPending, start]        = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    start(async () => {
      try {
        const res = await fetch("/api/admin/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName,
            last_name:  lastName,
            phone,
            work_hours: workHours,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Errore salvataggio.");
          return;
        }
        setSaved(true);
      } catch {
        setError("Errore di rete.");
      }
    });
  }

  const roleLabel = ROLE_LABEL_IT[initial.role] ?? initial.role;

  return (
    <form onSubmit={handleSubmit} className="menuary-admin-card space-y-6 p-6">
      {/* Identità non modificabile */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email">
          <input
            type="email"
            value={initial.email}
            disabled
            className="menuary-admin-input opacity-70"
          />
        </Field>
        <Field label="Ruolo">
          <input
            type="text"
            value={roleLabel}
            disabled
            className="menuary-admin-input opacity-70"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Mario"
            className="menuary-admin-input"
            required
          />
        </Field>
        <Field label="Cognome">
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Rossi"
            className="menuary-admin-input"
            required
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Telefono">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+39 02 1234567"
            className="menuary-admin-input"
          />
        </Field>
        <Field label="Orari di lavoro">
          <input
            value={workHours}
            onChange={(e) => setWorkHours(e.target.value)}
            placeholder="Lun-Ven 9:00-18:00"
            className="menuary-admin-input"
          />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--ma-muted)]">
          Questi dati popolano automaticamente la firma email.
        </p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-emerald-700">Profilo salvato.</span>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="menuary-admin-action-btn"
          >
            <Save size={15} />
            {isPending ? "Salvataggio…" : "Salva profilo"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="menuary-admin-label">{label}</span>
      {children}
    </label>
  );
}
