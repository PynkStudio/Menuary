"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ChevronDown, Check } from "lucide-react";

type InboxItem = {
  id: string;
  received_at: string;
  event: string | null;
  hubrise_location_id: string | null;
  resource_id: string | null;
  status: "signature_invalid" | "unmatched_location" | "inactive_link" | "processing_error";
  reason: string | null;
};

const STATUS_COPY: Record<InboxItem["status"], string> = {
  signature_invalid: "Firma invalida",
  unmatched_location: "Location non collegata",
  inactive_link: "Link sospeso",
  processing_error: "Errore processing",
};

export function HubriseInboxBanner() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [count, setCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = async () => {
    try {
      const res = await fetch("/api/admin/integrations/hubrise/inbox?limit=20");
      const data = (await res.json()) as { items: InboxItem[]; unresolvedCount: number };
      setItems(data.items ?? []);
      setCount(data.unresolvedCount ?? 0);
    } catch {
      /* fail silent: il banner non deve mai bloccare la pagina */
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resolve = (ids: string[]) => {
    startTransition(async () => {
      await fetch("/api/admin/integrations/hubrise/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      await load();
    });
  };

  if (count === 0) return null;

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-700" />
          <div>
            <p className="font-bold text-amber-900">
              {count} eventi HubRise non risolti
            </p>
            <p className="text-xs text-amber-800/70">
              Webhook ricevuti che non siamo riusciti a processare. Clicca per ispezionare.
            </p>
          </div>
        </div>
        <ChevronDown size={18} className={`text-amber-700 transition ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-4 space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-amber-800/70">Caricamento…</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800/60">
                  Ultimi {items.length}
                </p>
                <button
                  type="button"
                  onClick={() => resolve(items.map((i) => i.id))}
                  disabled={pending}
                  className="rounded-full bg-amber-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-amber-800 disabled:opacity-50"
                >
                  Segna tutti come letti
                </button>
              </div>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-1 rounded-xl bg-white p-3 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-900">
                        {STATUS_COPY[item.status]}
                        {item.event ? <span className="ml-2 font-mono text-amber-700/80">{item.event}</span> : null}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-amber-800/70">
                        {new Date(item.received_at).toLocaleString("it-IT")}
                        {item.hubrise_location_id ? ` · loc ${item.hubrise_location_id}` : ""}
                        {item.resource_id ? ` · res ${item.resource_id}` : ""}
                      </p>
                      {item.reason && (
                        <p className="mt-0.5 truncate text-[11px] text-amber-900/60">{item.reason}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => resolve([item.id])}
                      disabled={pending}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 px-2.5 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    >
                      <Check size={11} /> Risolvi
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
