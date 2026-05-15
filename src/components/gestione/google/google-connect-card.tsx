"use client";

import { useState } from "react";
import { MapPin, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

interface Location {
  locationResourceName: string;
  placeId: string | null;
  locationName: string | null;
  isPrimary: boolean;
}

interface Props {
  tenantId: string;
  connected: boolean;
  location: Location | null;
  lastSync: string | null;
}

export function GoogleConnectCard({ tenantId, connected, location, lastSync }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gestione/google/connect?tenantId=${tenantId}`);
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.url) {
        window.location.href = json.url;
      } else {
        setError(json.error ?? "Errore sconosciuto");
      }
    } catch {
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  }

  const lastSyncLabel = lastSync
    ? new Date(lastSync).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="rounded-2xl border-2 border-pork-ink/10 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pork-ink/5">
            <MapPin size={20} className="text-pork-ink/60" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
              Google Business Profile
            </p>
            <p className="font-bold">
              {connected ? location?.locationName ?? "Sede collegata" : "Non collegato"}
            </p>
          </div>
        </div>

        {connected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
            <CheckCircle size={12} />
            Attivo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
            <AlertCircle size={12} />
            Non collegato
          </span>
        )}
      </div>

      {connected && lastSyncLabel && (
        <p className="mt-3 text-sm text-pork-ink/50">
          Ultimo sync recensioni: {lastSyncLabel}
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!connected ? (
          <button
            type="button"
            disabled={loading}
            onClick={handleConnect}
            className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-4 py-2 text-sm font-bold text-pork-cream transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            <ExternalLink size={14} />
            {loading ? "Apertura Google…" : "Collega account Google"}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleConnect}
            className="inline-flex items-center gap-2 rounded-full border-2 border-pork-ink/15 px-4 py-2 text-sm font-bold transition-colors hover:border-pork-ink/40"
          >
            <ExternalLink size={14} />
            {loading ? "Apertura Google…" : "Ricollega / cambia account"}
          </button>
        )}
      </div>
    </div>
  );
}
