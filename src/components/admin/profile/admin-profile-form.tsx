"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Save } from "lucide-react";
import { useDraftPersistence } from "@/lib/hooks/use-draft-persistence";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";

type Initial = {
  email:         string;
  role:          string;
  firstName:     string;
  lastName:      string;
  phone:         string;
  workHours:     string;
  signatureRole: string;
};

type FormDraft = Pick<Initial, "firstName" | "lastName" | "phone" | "workHours" | "signatureRole">;

const ROLE_LABEL_IT: Record<string, string> = {
  superadmin:      "Amministratore di sistema",
  admin:           "Amministratore",
  amministrazione: "Amministrazione",
  venditore:       "Consulente commerciale",
  lead_inserter:   "Sviluppo commerciale",
};

export function AdminProfileForm({
  initial,
  canEditSignatureRole = false,
}: {
  initial: Initial;
  canEditSignatureRole?: boolean;
}) {
  const [firstName,     setFirstName]     = useState(initial.firstName);
  const [lastName,      setLastName]      = useState(initial.lastName);
  const [phone,         setPhone]         = useState(initial.phone);
  const [workHours,     setWorkHours]     = useState(initial.workHours);
  const [signatureRole, setSignatureRole] = useState(initial.signatureRole);
  const [error,         setError]         = useState<string | null>(null);
  const [saved,         setSaved]         = useState(false);
  const [isPending,     start]            = useTransition();

  const draft = useDraftPersistence<FormDraft>("draft:admin-profile");
  const isDirty =
    firstName     !== initial.firstName ||
    lastName      !== initial.lastName  ||
    phone         !== initial.phone     ||
    workHours     !== initial.workHours ||
    signatureRole !== initial.signatureRole;
  useUnsavedChangesWarning(isDirty);

  function currentDraft(overrides: Partial<FormDraft> = {}): FormDraft {
    return { firstName, lastName, phone, workHours, signatureRole, ...overrides };
  }

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
            first_name:     firstName,
            last_name:      lastName,
            phone,
            work_hours:     workHours,
            signature_role: signatureRole,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setError(data.error ?? "Errore salvataggio.");
          return;
        }
        setSaved(true);
        draft.clearDraft();
      } catch {
        setError("Errore di rete.");
      }
    });
  }

  const roleLabel = ROLE_LABEL_IT[initial.role] ?? initial.role;

  return (
    <form onSubmit={handleSubmit} className="menuary-admin-card space-y-6 p-6">
      {draft.draftDate && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            Modifiche non salvate del{" "}
            {draft.draftDate.toLocaleDateString("it-IT", {
              day: "2-digit", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => draft.clearDraft()}
              className="text-xs font-bold text-amber-700 hover:underline">
              Ignora
            </button>
            <button type="button"
              onClick={() => {
                const d = draft.readDraft();
                if (d) {
                  setFirstName(d.firstName);
                  setLastName(d.lastName);
                  setPhone(d.phone);
                  setWorkHours(d.workHours);
                  if (d.signatureRole !== undefined) setSignatureRole(d.signatureRole);
                  draft.clearDraft();
                }
              }}
              className="inline-flex items-center gap-1 rounded-full bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
              <RotateCcw size={12} /> Recupera
            </button>
          </div>
        </div>
      )}

      {/* Identità non modificabile */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email">
          <input type="email" value={initial.email} disabled className="menuary-admin-input opacity-70" />
        </Field>
        <Field label="Ruolo">
          <input type="text" value={roleLabel} disabled className="menuary-admin-input opacity-70" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome">
          <input
            value={firstName}
            onChange={(e) => { setFirstName(e.target.value); draft.saveDraft(currentDraft({ firstName: e.target.value })); }}
            placeholder="Mario"
            className="menuary-admin-input"
            required
          />
        </Field>
        <Field label="Cognome">
          <input
            value={lastName}
            onChange={(e) => { setLastName(e.target.value); draft.saveDraft(currentDraft({ lastName: e.target.value })); }}
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
            onChange={(e) => { setPhone(e.target.value); draft.saveDraft(currentDraft({ phone: e.target.value })); }}
            placeholder="+39 02 1234567"
            className="menuary-admin-input"
          />
        </Field>
        <Field label="Orari di lavoro">
          <input
            value={workHours}
            onChange={(e) => { setWorkHours(e.target.value); draft.saveDraft(currentDraft({ workHours: e.target.value })); }}
            placeholder="Lun-Ven 9:00-18:00"
            className="menuary-admin-input"
          />
        </Field>
      </div>

      {canEditSignatureRole && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ruolo mostrato in firma">
            <input
              value={signatureRole}
              onChange={(e) => { setSignatureRole(e.target.value); draft.saveDraft(currentDraft({ signatureRole: e.target.value })); }}
              placeholder={roleLabel}
              className="menuary-admin-input"
            />
            <p className="mt-1 text-xs text-[var(--ma-muted)]">
              Lascia vuoto per usare il ruolo di sistema.
            </p>
          </Field>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--ma-muted)]">
          Questi dati popolano automaticamente la firma email.
        </p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-emerald-700">Profilo salvato.</span>
          )}
          <button type="submit" disabled={isPending} className="menuary-admin-action-btn">
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
