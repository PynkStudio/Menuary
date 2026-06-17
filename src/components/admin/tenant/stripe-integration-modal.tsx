"use client";

import { useEffect, useState } from "react";
import { X, RefreshCw, Plug, Unplug, CheckCircle2, AlertTriangle } from "lucide-react";

type AccountResponse = {
  account: {
    id: string;
    tenantId: string;
    provider: "stripe";
    stripeAccountId: string | null;
    accountType: "standard" | "express";
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    accountEmail: string | null;
    accountCountry: string | null;
    status: "pending" | "connected" | "restricted" | "disconnected";
    connectedAt: string | null;
    lastSyncedAt: string | null;
    mode?: "tenant_connect" | "demo_sandbox_connect" | "demo_sandbox_platform";
  } | null;
};

type AccountStatus = "pending" | "connected" | "restricted" | "disconnected";

function StatusBadge({ status }: { status: AccountStatus }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
    connected: { label: "Collegato", cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
    pending: { label: "Onboarding in corso", cls: "bg-amber-100 text-amber-700", Icon: AlertTriangle },
    restricted: { label: "Limitato", cls: "bg-amber-100 text-amber-700", Icon: AlertTriangle },
    disconnected: { label: "Disconnesso", cls: "bg-pork-ink/10 text-pork-ink/60", Icon: Unplug },
  };
  const v = map[status] ?? map.pending;
  const { Icon } = v;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${v.cls}`}>
      <Icon size={13} /> {v.label}
    </span>
  );
}

export function StripeIntegrationModal({
  tenantId,
  tenantName,
  open,
  onClose,
}: {
  tenantId: string;
  tenantName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [account, setAccount] = useState<AccountResponse["account"]>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<"connect" | "refresh" | "disconnect" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/admin/integrations/stripe?tenantId=${encodeURIComponent(tenantId)}${refresh ? "&refresh=1" : ""}`;
      const res = await fetch(url);
      const json = (await res.json()) as AccountResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "lookup_failed");
      setAccount(json.account);
    } catch (e) {
      setError(e instanceof Error ? e.message : "errore");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void reload(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenantId]);

  if (!open) return null;

  const connect = async () => {
    setBusy("connect");
    setError(null);
    try {
      const res = await fetch("/api/payments/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, email: account?.accountEmail ?? undefined }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "connect_failed");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "errore");
      setBusy(null);
    }
  };

  const refresh = async () => {
    setBusy("refresh");
    try {
      await reload(true);
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnettere l'account Stripe? Il tenant non potrà più incassare finché non lo ricollega.")) return;
    setBusy("disconnect");
    setError(null);
    try {
      const res = await fetch(`/api/admin/integrations/stripe?tenantId=${encodeURIComponent(tenantId)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "disconnect_failed");
      await reload(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "errore");
    } finally {
      setBusy(null);
    }
  };

  const isConnected = account?.status === "connected" && account.chargesEnabled;
  const hasAccount = Boolean(account);
  const isDemoSandbox = account?.mode === "demo_sandbox_connect" || account?.mode === "demo_sandbox_platform";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pork-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-pork-ink/40 hover:bg-pork-ink/5"
          aria-label="Chiudi"
        >
          <X size={20} />
        </button>

        <header>
          <p className="impact-title text-xs text-pork-red">
            Integrazione · {isDemoSandbox ? "Stripe sandbox demo" : "Stripe (Connect Standard)"}
          </p>
          <h2 className="headline mt-1 text-2xl">{tenantName}</h2>
          <p className="mt-2 text-sm text-pork-ink/60">
            {isDemoSandbox
              ? "Questo tenant demo usa la sandbox Stripe condivisa della piattaforma. I pagamenti sono test mode e non producono incassi reali."
              : "Ogni tenant collega il proprio account Stripe. I pagamenti vanno direttamente sull'account del locale."}
            {!isDemoSandbox && (
              <>
                {" "}
                Fee piattaforma: <strong>0%</strong> per ordini al tavolo e online, <strong>3%</strong> per ordini AI (WhatsApp, voce Retell).
              </>
            )}
          </p>
        </header>

        <div className="mt-5 rounded-2xl bg-pork-cream p-4">
          {loading && !account ? (
            <p className="text-sm text-pork-ink/50">Caricamento…</p>
          ) : !hasAccount ? (
            <div>
              <div className="flex items-center gap-2 text-sm text-pork-ink/70">
                <Unplug size={16} /> Nessun account Stripe collegato per questo tenant.
              </div>
              <button
                type="button"
                onClick={connect}
                disabled={busy === "connect"}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-2.5 text-sm font-bold text-white hover:bg-pork-red/90 disabled:opacity-50"
              >
                <Plug size={15} />
                {busy === "connect" ? "Apertura Stripe…" : "Collega account Stripe"}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-pork-ink/50">Account Stripe</div>
                  <div className="font-mono text-sm">
                    {account!.stripeAccountId ?? "Sandbox piattaforma test"}
                  </div>
                  {account?.accountEmail && (
                    <div className="mt-1 text-xs text-pork-ink/60">{account.accountEmail} · {account.accountCountry ?? "—"}</div>
                  )}
                </div>
                <StatusBadge status={account!.status} />
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-white p-2.5">
                  <dt className="text-pork-ink/50">Incassi</dt>
                  <dd className={account!.chargesEnabled ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                    {account!.chargesEnabled ? "Attivi" : "Non attivi"}
                  </dd>
                </div>
                <div className="rounded-xl bg-white p-2.5">
                  <dt className="text-pork-ink/50">Payout</dt>
                  <dd className={account!.payoutsEnabled ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                    {isDemoSandbox && account!.mode === "demo_sandbox_platform"
                      ? "N/A test"
                      : account!.payoutsEnabled
                        ? "Attivi"
                        : "Non attivi"}
                  </dd>
                </div>
                <div className="rounded-xl bg-white p-2.5">
                  <dt className="text-pork-ink/50">Onboarding</dt>
                  <dd className={account!.detailsSubmitted ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                    {account!.detailsSubmitted ? "Completato" : "Da finire"}
                  </dd>
                </div>
              </dl>

              {isDemoSandbox && (
                <p className="mt-3 rounded-lg bg-sky-50 p-3 text-xs text-sky-800">
                  Sandbox condivisa: usa carte test Stripe. In produzione questo tenant dovrà collegare il proprio account Stripe.
                </p>
              )}

              {!isDemoSandbox && !isConnected && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  L&apos;account è collegato ma non ancora pronto a incassare. Il tenant deve completare l&apos;onboarding su Stripe (dati attività, conto bancario, verifica identità).
                </p>
              )}

              {!isDemoSandbox && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-pork-ink/15 px-4 py-2 text-sm font-bold hover:bg-pork-ink/5 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={busy === "refresh" ? "animate-spin" : ""} />
                    Aggiorna stato
                  </button>
                  <button
                    type="button"
                    onClick={connect}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-pork-ink/15 px-4 py-2 text-sm font-bold hover:bg-pork-ink/5 disabled:opacity-50"
                  >
                    <Plug size={14} />
                    Ricollega
                  </button>
                  <button
                    type="button"
                    onClick={disconnect}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Unplug size={14} />
                    Disconnetti
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>
          )}
        </div>

        <p className="mt-4 text-xs text-pork-ink/45">
          {isDemoSandbox
            ? "Produzione: TODO configurare Stripe live della piattaforma per contratti Menuary/Bizery/PynkStudio e completare il flusso Connect per account tenant reali."
            : "Stripe Connect Standard: il tenant è proprietario dell'account, ha la propria dashboard Stripe per fatture, rimborsi e dispute. Menuary preleva solo l'application fee configurata per la sorgente dell'ordine."}
        </p>
      </div>
    </div>
  );
}
