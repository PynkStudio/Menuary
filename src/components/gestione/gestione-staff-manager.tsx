"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, RefreshCcw } from "lucide-react";
import {
  ROLE_LABELS,
  ROLE_DEFAULTS,
  EMPLOYEE_ROLES,
  type EmployeeRole,
} from "@/lib/store-roles";

type StoreRole = (typeof EMPLOYEE_ROLES)[number];

interface StaffRow {
  id: string;
  email: string;
  role: string;
  displayName: string | null;
  permissions: Record<string, boolean>;
  enabled: boolean;
}

interface Props {
  tenantSlug: string;
  initialStaff: StaffRow[];
}

const INVITABLE_ROLES: StoreRole[] = [
  "manager",
  "chef",
  "cameriere",
  "personale_cucina",
];

export function GestioneStaffManager({ tenantSlug, initialStaff }: Props) {
  const router = useRouter();
  const [staff] = useState<StaffRow[]>(initialStaff);
  const [pending, startTransition] = useTransition();

  // Form invito
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<StoreRole>("cameriere");
  const [canCassa, setCanCassa] = useState(false);
  const [canManageShifts, setCanManageShifts] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    const overrides: Record<string, boolean> = {};
    const defaults = ROLE_DEFAULTS[role];
    if (canCassa !== defaults.can_cassa) overrides.can_cassa = canCassa;
    if (canManageShifts !== defaults.can_manage_shifts)
      overrides.can_manage_shifts = canManageShifts;

    const res = await fetch("/api/gestione/invite-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_slug: tenantSlug,
        email,
        display_name: displayName || null,
        role,
        permissions: overrides,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setInviteError(json.error ?? "Errore durante l'invito.");
      return;
    }
    setInviteSuccess(`Invito inviato a ${email}. Controllerà la sua casella per impostare la password.`);
    setEmail("");
    setDisplayName("");
    startTransition(() => router.refresh());
  }

  async function handleRevoke(adminUserId: string) {
    if (!confirm("Revocare l'accesso? L'account utente resterà attivo come cliente.")) return;
    const res = await fetch("/api/admin/revoke-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_user_id: adminUserId }),
    });
    if (!res.ok) {
      alert("Errore durante la revoca.");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleRestore(adminUserId: string) {
    const res = await fetch("/api/admin/revoke-access", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_user_id: adminUserId }),
    });
    if (!res.ok) {
      alert("Errore durante il ripristino.");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-12">
      {/* ── Form invito ──────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-current/10 bg-white/50 p-6 backdrop-blur">
        <div className="flex items-center gap-2">
          <UserPlus size={18} />
          <h2 className="text-lg font-bold">Invita un nuovo dipendente</h2>
        </div>

        <form onSubmit={handleInvite} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold sm:col-span-2">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-current/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-current"
              placeholder="dipendente@email.it"
            />
          </label>

          <label className="block text-sm font-semibold">
            Nome (opzionale)
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-current/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-current"
              placeholder="Mario Rossi"
            />
          </label>

          <label className="block text-sm font-semibold">
            Ruolo
            <select
              value={role}
              onChange={(e) => {
                const r = e.target.value as StoreRole;
                setRole(r);
                setCanCassa(ROLE_DEFAULTS[r].can_cassa);
                setCanManageShifts(ROLE_DEFAULTS[r].can_manage_shifts);
              }}
              className="mt-1.5 w-full rounded-xl border border-current/20 bg-white px-4 py-2.5 text-sm outline-none focus:border-current"
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2 grid gap-2 rounded-2xl border border-current/10 bg-current/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">
              Permessi aggiuntivi
            </p>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={canCassa}
                onChange={(e) => setCanCassa(e.target.checked)}
                className="h-4 w-4"
              />
              <span>
                <strong className="font-semibold">Può accedere alla cassa</strong>
                <span className="ml-1 opacity-60">— gestione pagamenti e chiusura conto</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={canManageShifts}
                onChange={(e) => setCanManageShifts(e.target.checked)}
                className="h-4 w-4"
              />
              <span>
                <strong className="font-semibold">Può gestire i turni</strong>
                <span className="ml-1 opacity-60">— crea/modifica turni di tutti i dipendenti</span>
              </span>
            </label>
          </div>

          {inviteError && (
            <p className="sm:col-span-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
              {inviteError}
            </p>
          )}
          {inviteSuccess && (
            <p className="sm:col-span-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">
              {inviteSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !email}
            className="sm:col-span-2 rounded-xl bg-[var(--login-accent,#1A1A1A)] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "currentColor" }}
          >
            <span className="text-white mix-blend-difference">
              {pending ? "Invio…" : "Invia invito"}
            </span>
          </button>
        </form>
      </section>

      {/* ── Lista staff ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold">Staff del locale</h2>
        <p className="mt-1 text-sm opacity-60">
          {staff.length === 0
            ? "Nessun dipendente ancora invitato."
            : `${staff.length} ${staff.length === 1 ? "dipendente" : "dipendenti"}`}
        </p>

        {staff.length > 0 && (
          <div className="mt-5 overflow-x-auto rounded-3xl border border-current/10 bg-white/50">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b border-current/10 text-left text-xs uppercase tracking-wider opacity-60">
                <tr>
                  <th className="px-5 py-3 font-bold">Email / Nome</th>
                  <th className="px-5 py-3 font-bold">Ruolo</th>
                  <th className="px-5 py-3 font-bold">Permessi extra</th>
                  <th className="px-5 py-3 font-bold">Stato</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => {
                  const overrides = Object.entries(row.permissions ?? {})
                    .filter(([, v]) => v === true)
                    .map(([k]) =>
                      k === "can_cassa" ? "Cassa" : k === "can_manage_shifts" ? "Turni" : k,
                    );
                  return (
                    <tr key={row.id} className="border-b border-current/5 last:border-0">
                      <td className="px-5 py-3">
                        <div className="font-semibold">{row.displayName ?? row.email}</div>
                        {row.displayName && <div className="text-xs opacity-50">{row.email}</div>}
                      </td>
                      <td className="px-5 py-3 opacity-80">
                        {ROLE_LABELS[row.role as keyof typeof ROLE_LABELS] ?? row.role}
                      </td>
                      <td className="px-5 py-3 opacity-70 text-xs">
                        {overrides.length === 0 ? "—" : overrides.join(", ")}
                      </td>
                      <td className="px-5 py-3">
                        {row.enabled ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                            Attivo
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-500">
                            Revocato
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {row.enabled ? (
                          <button
                            type="button"
                            onClick={() => handleRevoke(row.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={12} />
                            Revoca
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestore(row.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-current opacity-70 hover:opacity-100"
                          >
                            <RefreshCcw size={12} />
                            Ripristina
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
