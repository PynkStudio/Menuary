"use client";

import { useState } from "react";
import { Building2, Loader2, MapPin } from "lucide-react";
import type { TenantLocation } from "@/lib/tenant";

export function GestioneLocationGate({
  tenantId,
  tenantName,
  locations,
}: {
  tenantId: string;
  tenantName: string;
  locations: TenantLocation[];
}) {
  const [locationId, setLocationId] = useState("");
  const [remember, setRemember] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueToManagement() {
    if (!locationId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/gestione/active-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, locationId, remember }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Impossibile selezionare la sede");
      }
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossibile selezionare la sede");
      setSaving(false);
    }
  }

  return (
    <main className="ga-location-gate">
      <section className="ga-location-dialog" role="dialog" aria-modal="true" aria-labelledby="location-title">
        <div className="ga-location-dialog-icon"><Building2 size={22} /></div>
        <span className="ga-eyebrow">{tenantName}</span>
        <h1 id="location-title" className="ga-heading">Quale sede vuoi gestire?</h1>
        <p className="ga-lead">
          Tutti i dati e le operazioni del pannello saranno limitati esclusivamente alla sede scelta.
        </p>

        <div className="ga-location-options">
          {locations.map((location) => (
            <label key={location.id} className="ga-location-option" data-selected={locationId === location.id}>
              <input
                type="radio"
                name="location"
                value={location.id}
                checked={locationId === location.id}
                onChange={() => setLocationId(location.id)}
              />
              <MapPin size={17} />
              <span>
                <strong>{location.name}</strong>
                {(location.address || location.city) && (
                  <small>{[location.address, location.city].filter(Boolean).join(" · ")}</small>
                )}
              </span>
            </label>
          ))}
        </div>

        <label className="ga-location-remember">
          <input
            type="checkbox"
            className="ga-checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <span>
            <strong>Ricorda su questo dispositivo</strong>
            <small>Al prossimo accesso entrerai direttamente in questa sede.</small>
          </span>
        </label>

        {error && <p className="ga-form-error">{error}</p>}
        <button
          type="button"
          className="ga-btn ga-btn-primary ga-location-continue"
          disabled={!locationId || saving}
          onClick={continueToManagement}
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          Continua
        </button>
      </section>
    </main>
  );
}
