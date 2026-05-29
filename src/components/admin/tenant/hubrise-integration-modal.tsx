"use client";

import { useEffect, useState } from "react";
import { X, RefreshCw, Plug, Unplug } from "lucide-react";
import type { HubriseLink } from "@/lib/hubrise/links";
import type { TenantLocation } from "@/lib/tenant";

type LogRow = {
  id: string;
  link_id: string;
  status: "queued" | "running" | "ok" | "error" | "skipped";
  payload_hash: string | null;
  error: string | null;
  started_at: string;
};

type ApiResponse = {
  locations: TenantLocation[];
  links: HubriseLink[];
  logs: LogRow[];
};

export function HubriseIntegrationModal({
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
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/integrations/hubrise?tenantId=${encodeURIComponent(tenantId)}`);
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenantId]);

  if (!open) return null;

  const linkByLocation = new Map<string | null, HubriseLink>(
    (data?.links ?? []).map((l) => [l.locationId, l]),
  );

  const connect = (locationId: string | null) => {
    const params = new URLSearchParams({ tenantId });
    if (locationId) params.set("locationId", locationId);
    window.location.href = `/api/integrations/hubrise/start?${params.toString()}`;
  };

  const sync = async () => {
    setBusyAction("sync");
    try {
      await fetch("/api/integrations/hubrise/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      await reload();
    } finally {
      setBusyAction(null);
    }
  };

  const disconnect = async (link: HubriseLink) => {
    if (!confirm(`Disconnettere ${link.hubriseLocationId}? Il menu non sarà più sincronizzato e gli ordini smetteranno di arrivare.`)) return;
    setBusyAction(`disc:${link.id}`);
    try {
      await fetch("/api/integrations/hubrise/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId: link.id }),
      });
      await reload();
    } finally {
      setBusyAction(null);
    }
  };

  const locations: TenantLocation[] = data?.locations ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pork-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
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
          <p className="impact-title text-xs text-pork-red">Integrazione · HubRise</p>
          <h2 className="headline mt-1 text-2xl">{tenantName}</h2>
          <p className="mt-2 text-sm text-pork-ink/60">
            Collega una location HubRise per ogni sede. Il menu viene pushato in automatico ad ogni modifica.
            Gli ordini delle piattaforme arrivano sul KDS della sede.
          </p>
        </header>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={sync}
            disabled={loading || !!busyAction || !data?.links.length}
            className="inline-flex items-center gap-2 rounded-full border-2 border-pork-ink/15 px-4 py-2 text-sm font-bold hover:bg-pork-ink/5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={busyAction === "sync" ? "animate-spin" : ""} />
            Forza sync menu (tutte le sedi)
          </button>
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="text-xs font-bold text-pork-ink/50 hover:text-pork-ink"
          >
            Aggiorna
          </button>
        </div>

        <section className="mt-5 space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wide text-pork-ink/45">Sedi</h3>
          {loading && !data ? (
            <p className="rounded-2xl bg-pork-cream p-4 text-sm text-pork-ink/50">Caricamento…</p>
          ) : locations.length === 0 ? (
            <SedeRow
              locationLabel="Sede unica"
              link={linkByLocation.get(null) ?? null}
              onConnect={() => connect(null)}
              onDisconnect={disconnect}
              busyAction={busyAction}
            />
          ) : (
            <ul className="space-y-2">
              {locations.map((loc) => (
                <SedeRow
                  key={loc.id}
                  locationLabel={`${loc.name}${loc.city ? ` · ${loc.city}` : ""}${loc.isDefault ? " (default)" : ""}`}
                  link={linkByLocation.get(loc.id) ?? null}
                  onConnect={() => connect(loc.id)}
                  onDisconnect={disconnect}
                  busyAction={busyAction}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wide text-pork-ink/45">Ultimi sync menu</h3>
          {(data?.logs ?? []).length === 0 ? (
            <p className="text-sm text-pork-ink/40">Nessun evento.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-pork-ink/10">
              <table className="w-full text-xs">
                <thead className="bg-pork-cream text-left text-[10px] uppercase tracking-wide text-pork-ink/55">
                  <tr>
                    <th className="px-3 py-2">Quando</th>
                    <th className="px-3 py-2">Sede</th>
                    <th className="px-3 py-2">Esito</th>
                    <th className="px-3 py-2">Dettaglio</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.logs ?? []).map((log) => {
                    const link = data?.links.find((l) => l.id === log.link_id);
                    return (
                      <tr key={log.id} className="border-t border-pork-ink/5">
                        <td className="px-3 py-2 text-pork-ink/70">{new Date(log.started_at).toLocaleString("it-IT")}</td>
                        <td className="px-3 py-2">{link?.locationName ?? link?.hubriseLocationId?.slice(0, 8) ?? "—"}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={log.status} />
                        </td>
                        <td className="px-3 py-2 text-pork-ink/60">{log.error ?? log.payload_hash?.slice(0, 10) ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SedeRow({
  locationLabel,
  link,
  onConnect,
  onDisconnect,
  busyAction,
}: {
  locationLabel: string;
  link: HubriseLink | null;
  onConnect: () => void;
  onDisconnect: (link: HubriseLink) => void;
  busyAction: string | null;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-2xl border-2 border-pork-ink/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-bold">{locationLabel}</p>
        {link ? (
          <p className="text-xs text-pork-ink/50">
            HubRise <span className="font-mono">{link.hubriseLocationId}</span>
            {link.locationName ? ` · ${link.locationName}` : ""} · {link.status} ·{" "}
            {link.lastMenuPushAt
              ? `ultimo sync ${new Date(link.lastMenuPushAt).toLocaleString("it-IT")}`
              : "mai sincronizzato"}
          </p>
        ) : (
          <p className="text-xs text-pork-ink/40">Non collegato</p>
        )}
      </div>
      {!link ? (
        <button
          type="button"
          onClick={onConnect}
          className="inline-flex items-center gap-1.5 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-white hover:bg-pork-ink/90"
        >
          <Plug size={12} /> Collega
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onDisconnect(link)}
          disabled={busyAction === `disc:${link.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Unplug size={12} /> Disconnetti
        </button>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ok"
      ? "bg-green-100 text-green-800"
      : status === "error"
        ? "bg-red-100 text-red-800"
        : "bg-pork-ink/10 text-pork-ink/60";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{status}</span>;
}
