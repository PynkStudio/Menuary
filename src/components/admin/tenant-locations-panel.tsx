"use client";

import { useEffect, useState } from "react";
import { MapPin, Save, Loader2 } from "lucide-react";
import { GestioneLocationsManager } from "@/components/gestione/gestione-locations-manager";
import type { TenantLocation } from "@/lib/tenant";

interface LocationsData {
  tenantId: string;
  currentCount: number;
  maxLocations: number;
}

interface Props {
  tenantId: string;
  multiLocationEnabled: boolean;
}

export function AdminTenantLocationsPanel({ tenantId, multiLocationEnabled }: Props) {
  const [data, setData] = useState<LocationsData | null>(null);
  const [maxInput, setMaxInput] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<TenantLocation[]>([]);

  useEffect(() => {
    fetch(`/api/admin/tenant-locations?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then((d: LocationsData) => {
        setData(d);
        setMaxInput(d.maxLocations);
      })
      .catch(() => null);
    fetch(`/api/gestione/locations?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then((rows: Array<Record<string, unknown>>) => {
        if (!Array.isArray(rows)) return;
        setLocations(rows.map((row) => ({
          id: String(row.id),
          tenantId: String(row.tenant_id),
          name: String(row.name),
          slug: String(row.slug),
          address: typeof row.address === "string" ? row.address : null,
          city: typeof row.city === "string" ? row.city : null,
          phone: typeof row.phone === "string" ? row.phone : null,
          email: typeof row.email === "string" ? row.email : null,
          isDefault: Boolean(row.is_default),
          routingMode: row.routing_mode === "path" || row.routing_mode === "subdomain" ? row.routing_mode : "both",
        })));
      })
      .catch(() => null);
  }, [tenantId]);

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/tenant-locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, maxLocations: maxInput }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Errore"); return; }
      setData((prev) => prev ? { ...prev, maxLocations: maxInput } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-pork-ink/40">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Caricamento sedi…
      </div>
    );
  }

  const atLimit = data.currentCount >= data.maxLocations;

  return (
    <div className="rounded-2xl bg-pork-cream p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-pork-ink">
        <MapPin size={16} className="text-pork-red" />
        Sedi
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-pork-ink/5">
          <span className="text-pork-ink/50">Sedi attive</span>
          <span className="ml-2 font-bold text-pork-ink">{data.currentCount}</span>
        </div>
        <div className={`rounded-xl px-3 py-2 ring-1 ${atLimit ? "bg-pork-red/10 ring-pork-red/20" : "bg-white ring-pork-ink/5"}`}>
          <span className="text-pork-ink/50">Limite piano</span>
          <span className={`ml-2 font-bold ${atLimit ? "text-pork-red" : "text-pork-ink"}`}>
            {data.maxLocations}
          </span>
        </div>
      </div>

      {!multiLocationEnabled && data.maxLocations > 1 && (
        <p className="text-xs text-pork-ink/50">
          ⚠ Il modulo multiLocation non è attivo — il limite sedi non ha effetto finché non viene abilitato.
        </p>
      )}

      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-pork-ink/60 shrink-0">
          Max sedi
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={maxInput}
          onChange={(e) => setMaxInput(Math.max(1, Math.min(50, Number(e.target.value))))}
          className="w-20 rounded-xl border border-pork-ink/15 px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-pork-red/40"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || maxInput === data.maxLocations}
          className="inline-flex items-center gap-1.5 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {saved ? "Salvato" : "Salva"}
        </button>
      </div>

      {error && <p className="text-xs text-pork-red">{error}</p>}

      {data.currentCount > maxInput && (
        <p className="rounded-xl bg-pork-mustard/25 px-3 py-2 text-xs font-bold text-pork-ink/70">
          Attenzione: ci sono {data.currentCount} sedi già create, più del nuovo limite.
          Le sedi esistenti non vengono eliminate, ma non si potranno aggiungerne di nuove.
        </p>
      )}

      <div className="border-t border-pork-ink/10 pt-4">
        <GestioneLocationsManager
          tenantId={tenantId}
          initialLocations={locations}
          multiLocationEnabled={multiLocationEnabled}
        />
      </div>
    </div>
  );
}
