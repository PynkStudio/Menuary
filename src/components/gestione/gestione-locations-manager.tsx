"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star, Check, X } from "lucide-react";
import type { TenantLocation, LocationRoutingMode } from "@/lib/tenant";
import { isGestioneFixtureMode, readDemoLocations } from "@/lib/demo-mode";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";

interface Props {
  tenantId: string;
  initialLocations: TenantLocation[];
  multiLocationEnabled: boolean;
}

const ROUTING_LABELS: Record<LocationRoutingMode, string> = {
  subdomain: "Sottodominio (milano.tenant.it)",
  path:      "Query param (?loc=milano)",
  both:      "Entrambi",
};

const emptyForm = {
  name: "",
  slug: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  routingMode: "both" as LocationRoutingMode,
};

export function GestioneLocationsManager({ tenantId, initialLocations, multiLocationEnabled }: Props) {
  const [locations, setLocations] = useState(initialLocations);

  useEffect(() => {
    setLocations(initialLocations);
  }, [initialLocations]);

  // Su demo idratiamo le sedi da localStorage al mount: il layout server
  // non interroga Supabase quindi initialLocations è sempre [].
  useEffect(() => {
    if (!isGestioneFixtureMode()) return;
    const persisted = readDemoLocations(tenantId);
    if (persisted.length === 0) return;
    setLocations(persisted.map((l) => ({
      id: l.id,
      tenantId: l.tenant_id,
      name: l.name,
      slug: l.slug,
      address: l.address,
      city: l.city,
      phone: l.phone,
      email: l.email,
      isDefault: l.is_default,
      routingMode: l.routing_mode,
    })));
  }, [tenantId]);

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormDirty = (creating || editingId !== null) && (form.name !== "" || form.slug !== "");
  useUnsavedChangesWarning(isFormDirty);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setCreating(true);
  }

  function openEdit(loc: TenantLocation) {
    setCreating(false);
    setError(null);
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      slug: loc.slug,
      address: loc.address ?? "",
      city: loc.city ?? "",
      phone: loc.phone ?? "",
      email: loc.email ?? "",
      routingMode: loc.routingMode,
    });
  }

  function closeForm() {
    setCreating(false);
    setEditingId(null);
    setError(null);
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/gestione/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Errore"); return; }
      setLocations((prev) => [...prev, {
        id: data.id,
        tenantId: data.tenant_id,
        name: data.name,
        slug: data.slug,
        address: data.address,
        city: data.city,
        phone: data.phone,
        email: data.email,
        isDefault: data.is_default,
        routingMode: data.routing_mode ?? "both",
      }]);
      closeForm();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(locationId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gestione/locations/${locationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, routingMode: form.routingMode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Errore"); return; }
      setLocations((prev) => prev.map((l) =>
        l.id === locationId
          ? { ...l, name: data.name, slug: data.slug, address: data.address, city: data.city, phone: data.phone, email: data.email, routingMode: data.routing_mode ?? "both" }
          : l,
      ));
      closeForm();
    } finally {
      setLoading(false);
    }
  }

  async function handleSetDefault(locationId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/gestione/locations/${locationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) return;
      setLocations((prev) => prev.map((l) => ({ ...l, isDefault: l.id === locationId })));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(locationId: string, name: string) {
    if (!confirm(`Eliminare la sede "${name}"? Questa azione non può essere annullata.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gestione/locations/${locationId}`, { method: "DELETE" });
      if (res.status === 204) {
        setLocations((prev) => prev.filter((l) => l.id !== locationId));
      } else {
        const data = await res.json();
        setError(data.error ?? "Errore");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Lista sedi */}
      <div className="space-y-3">
        {locations.length === 0 && (
          <p className="text-sm opacity-50">Nessuna sede configurata.</p>
        )}
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--color-ink, #1a1a1a)1A" }}
          >
            {editingId === loc.id ? (
              <LocationForm
                form={form}
                onChange={setForm}
                onSave={() => handleUpdate(loc.id)}
                onCancel={closeForm}
                loading={loading}
                error={error}
                isNew={false}
              />
            ) : (
              <div className="flex flex-wrap items-start gap-4">
                <MapPin className="mt-0.5 w-4 h-4 shrink-0 opacity-40" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{loc.name}</span>
                    <code className="text-xs opacity-50 bg-black/5 px-1.5 py-0.5 rounded">
                      {loc.slug}
                    </code>
                    {loc.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  {(loc.address || loc.city) && (
                    <p className="mt-1 text-sm opacity-60">
                      {[loc.address, loc.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs opacity-40">{ROUTING_LABELS[loc.routingMode]}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!loc.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(loc.id)}
                      disabled={loading}
                      className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                      title="Imposta come default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(loc)}
                    disabled={loading}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {!loc.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDelete(loc.id, loc.name)}
                      disabled={loading}
                      className="text-xs opacity-50 hover:opacity-100 transition-opacity text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Form nuova sede */}
      {creating && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-ink, #1a1a1a)1A" }}>
          <p className="mb-4 text-sm font-semibold">Nuova sede</p>
          <LocationForm
            form={form}
            onChange={setForm}
            onSave={handleCreate}
            onCancel={closeForm}
            loading={loading}
            error={error}
            isNew
          />
        </div>
      )}

      {/* CTA nuova sede — solo se multiLocation è abilitato */}
      {!creating && !editingId && multiLocationEnabled && (
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--color-ink, #1a1a1a)" }}
        >
          <Plus className="w-4 h-4" />
          Aggiungi sede
        </button>
      )}
    </div>
  );
}

// ── Form interna ─────────────────────────────────────────────────────────────

interface FormValue {
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  routingMode: LocationRoutingMode;
}

function LocationForm({
  form,
  onChange,
  onSave,
  onCancel,
  loading,
  error,
  isNew,
}: {
  form: FormValue;
  onChange: (f: FormValue) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  isNew: boolean;
}) {
  function field(key: keyof FormValue, label: string, placeholder?: string, type = "text") {
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold opacity-60">{label}</label>
        {key === "routingMode" ? (
          <select
            value={form[key]}
            onChange={(e) => onChange({ ...form, [key]: e.target.value as LocationRoutingMode })}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
          >
            <option value="both">Entrambi (subdomain + query param)</option>
            <option value="subdomain">Solo sottodominio</option>
            <option value="path">Solo query param</option>
          </select>
        ) : (
          <input
            type={type}
            value={form[key] as string}
            onChange={(e) => onChange({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {field("name", "Nome sede *", "es. Milano, Via Mengoni")}
        {field("slug", "Slug URL *", "es. milano")}
        {field("address", "Indirizzo", "Via Roma 1")}
        {field("city", "Città", "Milano")}
        {field("phone", "Telefono", "+39 02 1234567")}
        {field("email", "Email", "milano@esempio.it", "email")}
      </div>
      {field("routingMode", "Forma URL")}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={loading || !form.name || !form.slug}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--color-ink, #1a1a1a)" }}
        >
          <Check className="w-3.5 h-3.5" />
          {isNew ? "Crea" : "Salva"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold opacity-50 hover:opacity-80"
        >
          <X className="w-3.5 h-3.5" />
          Annulla
        </button>
      </div>
    </div>
  );
}
