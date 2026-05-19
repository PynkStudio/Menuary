"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeEuro, Ban, CheckCircle2, Loader2, MailPlus, Percent, RotateCcw, ShieldCheck, UserCog } from "lucide-react";
import {
  DEFAULT_COMMISSION_BY_SITEADMIN_ROLE,
  SITEADMIN_ROLE_DESCRIPTIONS,
  SITEADMIN_ROLE_LABELS,
  SITEADMIN_ROLES,
  SUPERADMIN_EMAIL,
  type SiteadminRole,
} from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";

type AdminRole = SiteadminRole;
type AdminUserStatus = "active" | "invited" | "revoked";

type AdminUser = {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: AdminRole;
  commission_rate: number;
  status: AdminUserStatus;
  invited_at: string;
  last_seen_at: string | null;
};

type UsersResponse = {
  users: AdminUser[];
  canManage: boolean;
  error?: string;
};

const STATUS_LABELS: Record<AdminUserStatus, string> = {
  active: "Attivo",
  invited: "Invitato",
  revoked: "Revocato",
};

function fmt(iso: string | null) {
  if (!iso) return "Mai";
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function parseResponse(res: Response): Promise<UsersResponse> {
  const data = (await res.json().catch(() => ({}))) as UsersResponse;
  if (!res.ok) throw new Error(data.error ?? "Operazione non riuscita.");
  return data;
}

export function PlatformAdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("venditore");
  const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_BY_SITEADMIN_ROLE.venditore);

  const counts = useMemo(() => ({
    active: users.filter((user) => user.status === "active").length,
    invited: users.filter((user) => user.status === "invited").length,
    revoked: users.filter((user) => user.status === "revoked").length,
  }), [users]);

  const activeSuperadminCount = useMemo(
    () => users.filter((u) => u.role === "superadmin" && u.status !== "revoked").length,
    [users],
  );

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await parseResponse(await fetch("/api/admin/users", { cache: "no-store" }));
      setUsers(data.users);
      setCanManage(data.canManage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore caricamento utenti.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function inviteUser(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await parseResponse(await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          display_name: name || null,
          role,
          commission_rate: commissionRate,
        }),
      }));
      setSuccess("Invito inviato e profilo admin creato.");
      setEmail("");
      setName("");
      setRole("venditore");
      setCommissionRate(DEFAULT_COMMISSION_BY_SITEADMIN_ROLE.venditore);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore invio invito.");
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(id: string, payload: { role?: AdminRole; enabled?: boolean; commission_rate?: number }) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await parseResponse(await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      }));
      setSuccess("Profilo aggiornato.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore aggiornamento profilo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="impact-title text-xs text-pork-red">Piattaforma</p>
        <h1 className="headline text-4xl">Utenti interni</h1>
        <p className="mt-1 text-pork-ink/60">
          Inviti, profili, revoche e percentuali provvigione per chi accede ad admin.menuary.it.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi icon={CheckCircle2} label="Attivi" value={counts.active} className="text-pork-green" />
        <Kpi icon={MailPlus} label="Invitati" value={counts.invited} className="text-pork-mustard" />
        <Kpi icon={Ban} label="Revocati" value={counts.revoked} className="text-pork-red" />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={inviteUser} className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/10">
        <div className="mb-5 flex items-center gap-2">
          <MailPlus size={18} className="text-pork-red" />
          <h2 className="headline text-2xl">Manda invito</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_200px_160px_auto]">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@menuary.it"
            className="rounded-xl border border-pork-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pork-red/25"
            disabled={!canManage || saving}
            required
          />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome visualizzato"
            className="rounded-xl border border-pork-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pork-red/25"
            disabled={!canManage || saving}
          />
          <select
            value={role}
            onChange={(event) => {
              const nextRole = event.target.value as AdminRole;
              setRole(nextRole);
              setCommissionRate(DEFAULT_COMMISSION_BY_SITEADMIN_ROLE[nextRole]);
            }}
            className="rounded-xl border border-pork-ink/10 px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pork-red/25"
            disabled={!canManage || saving}
          >
            {SITEADMIN_ROLES.map((key) => (
              <option key={key} value={key}>{SITEADMIN_ROLE_LABELS[key]}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-pork-ink/10 px-4 py-3 focus-within:ring-2 focus-within:ring-pork-red/25">
            <Percent size={14} className="text-pork-ink/35" />
            <input
              type="number"
              min={0}
              max={100}
              value={commissionRate}
              onChange={(event) => setCommissionRate(Math.max(0, Math.min(100, Number(event.target.value))))}
              className="w-full bg-transparent text-sm font-black tabular-nums outline-none"
              disabled={!canManage || saving}
            />
          </label>
          <button
            disabled={!canManage || saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-pork-red px-5 py-3 text-sm font-black text-white hover:bg-pork-red/90 disabled:cursor-not-allowed disabled:bg-pork-ink/25"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <MailPlus size={15} />}
            Invita
          </button>
        </div>
        <p className="mt-3 text-xs text-pork-ink/45">
          {canManage
            ? `${SITEADMIN_ROLE_DESCRIPTIONS[role]} Provvigione predefinita: ${commissionRate}%.`
            : "Solo super admin e admin possono inviare inviti o modificare i profili."}
        </p>
      </form>

      <section className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
        <div className="flex items-start gap-3">
          <BadgeEuro size={18} className="mt-0.5 text-pork-red" />
          <div>
            <p className="font-black">Regole provvigioni per ruolo</p>
            <p className="mt-1 text-sm text-pork-ink/60">
              Il venditore ha il 30% di default sul primo pagamento. Gli altri ruoli restano a 0 finché non viene assegnata una percentuale.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SITEADMIN_ROLES.map((key) => (
            <div key={key} className="rounded-2xl bg-pork-cream p-4">
              <p className="text-sm font-black">{SITEADMIN_ROLE_LABELS[key]}</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-pork-ink">
                {DEFAULT_COMMISSION_BY_SITEADMIN_ROLE[key]}%
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-3">
        {loading && (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
            <Loader2 size={22} className="mx-auto animate-spin text-pork-red" />
            <p className="mt-3 text-sm font-semibold text-pork-ink/55">Caricamento utenti…</p>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-pork-ink/10">
            <UserCog size={28} className="mx-auto text-pork-ink/20" />
            <p className="mt-3 font-black">Nessun utente interno configurato</p>
            <p className="mt-1 text-sm text-pork-ink/50">Invita il primo collaboratore admin dal form qui sopra.</p>
          </div>
        )}

        {users.map((user) => {
          const isSuperadmin = user.role === "superadmin";
          const isLockedSuperadmin = isSuperadmin && activeSuperadminCount <= 1;
          return (
          <div key={user.id} className={cn("rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10", user.status === "revoked" && "opacity-60")}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <UserCog size={16} className="text-pork-red" />
                  <p className="font-black">{user.name}</p>
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase",
                    user.status === "active" && "bg-pork-green/15 text-pork-green",
                    user.status === "invited" && "bg-pork-mustard/25 text-pork-ink",
                    user.status === "revoked" && "bg-pork-red/10 text-pork-red",
                  )}>
                    {STATUS_LABELS[user.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-pork-ink/55">{user.email}</p>
                <p className="mt-1 text-xs text-pork-ink/40">Invitato {fmt(user.invited_at)} · ultimo accesso {fmt(user.last_seen_at)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={user.role}
                  onChange={(event) => {
                    const nextRole = event.target.value as AdminRole;
                    void updateUser(user.id, {
                      role: nextRole,
                      commission_rate: DEFAULT_COMMISSION_BY_SITEADMIN_ROLE[nextRole],
                    });
                  }}
                  className="rounded-full border border-pork-ink/15 bg-white px-3 py-2 text-xs font-black"
                  disabled={!canManage || saving || user.status === "revoked" || isLockedSuperadmin}
                >
                  {SITEADMIN_ROLES.map((key) => (
                    <option key={key} value={key}>{SITEADMIN_ROLE_LABELS[key]}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1 rounded-full border border-pork-ink/15 bg-white px-3 py-2 text-xs font-black">
                  <Percent size={12} className="text-pork-ink/35" />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={user.commission_rate}
                    onChange={(event) =>
                      void updateUser(user.id, { commission_rate: Math.max(0, Math.min(100, Number(event.target.value))) })
                    }
                    className="w-12 bg-transparent tabular-nums outline-none"
                    disabled={!canManage || saving || user.status === "revoked" || isLockedSuperadmin}
                  />
                </label>
                {!isLockedSuperadmin && (user.status === "revoked" ? (
                  <button
                    disabled={!canManage || saving}
                    onClick={() => void updateUser(user.id, { enabled: true })}
                    className="inline-flex items-center gap-1 rounded-full bg-pork-green px-3 py-2 text-xs font-black text-white disabled:opacity-40"
                  >
                    <RotateCcw size={13} /> Riattiva
                  </button>
                ) : (
                  <button
                    disabled={!canManage || saving}
                    onClick={() => void updateUser(user.id, { enabled: false })}
                    className="inline-flex items-center gap-1 rounded-full bg-pork-red/10 px-3 py-2 text-xs font-black text-pork-red disabled:opacity-40"
                  >
                    <Ban size={13} /> Revoca
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-pork-cream p-3 text-xs text-pork-ink/60">
              <ShieldCheck size={13} className="mr-1 inline text-pork-red" />
              {SITEADMIN_ROLE_DESCRIPTIONS[user.role]}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-pork-ink/10">
      <Icon size={18} className={className} />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="text-xs text-pork-ink/55">{label}</p>
    </div>
  );
}
