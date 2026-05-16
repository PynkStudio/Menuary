"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2, Save } from "lucide-react";
import Link from "next/link";

type LeadCreatePayload = {
  business_name: string;
  business_vertical: "food" | "services";
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  source: string;
  temperature: "cold" | "warm" | "hot";
  location_name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  notes: string;
};

const INITIAL_FORM: LeadCreatePayload = {
  business_name: "",
  business_vertical: "food",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  source: "manuale",
  temperature: "cold",
  location_name: "Sede principale",
  address: "",
  city: "",
  province: "",
  postal_code: "",
  notes: "",
};

const INPUT_CLASS = "w-full rounded-xl border border-pork-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pork-red/25";

async function parseCreateResponse(res: Response): Promise<{ id: string; error?: string }> {
  const data = (await res.json().catch(() => ({}))) as { id: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Creazione lead non riuscita.");
  return data;
}

export function PlatformLeadCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof LeadCreatePayload>(key: K, value: LeadCreatePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = await parseCreateResponse(await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }));
      router.replace(`/admin/crm/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore creazione lead.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="impact-title text-xs text-pork-red">CRM</p>
          <h1 className="headline text-4xl">Nuovo lead</h1>
          <p className="mt-1 text-pork-ink/60">
            Inserimento manuale con classificazione fredda di default e una sede principale.
          </p>
        </div>
        <Link
          href="/admin/crm"
          className="inline-flex items-center gap-2 rounded-full bg-pork-ink/5 px-4 py-2 text-sm font-black text-pork-ink hover:bg-pork-ink/10"
        >
          <ArrowLeft size={16} /> CRM
        </Link>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/10">
        <div className="mb-5 flex items-center gap-2">
          <Building2 size={18} className="text-pork-red" />
          <h2 className="headline text-2xl">Dati lead</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Attività" required>
            <input
              value={form.business_name}
              onChange={(event) => setField("business_name", event.target.value)}
              className={INPUT_CLASS}
              required
            />
          </Field>
          <Field label="Verticale">
            <select
              value={form.business_vertical}
              onChange={(event) => setField("business_vertical", event.target.value as LeadCreatePayload["business_vertical"])}
              className={INPUT_CLASS}
            >
              <option value="food">Menuary · Food</option>
              <option value="services">Bizery · Services</option>
            </select>
          </Field>
          <Field label="Referente" required>
            <input
              value={form.contact_name}
              onChange={(event) => setField("contact_name", event.target.value)}
              className={INPUT_CLASS}
              required
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={form.contact_email}
              onChange={(event) => setField("contact_email", event.target.value)}
              className={INPUT_CLASS}
              required
            />
          </Field>
          <Field label="Telefono">
            <input
              value={form.contact_phone}
              onChange={(event) => setField("contact_phone", event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Classificazione">
            <select
              value={form.temperature}
              onChange={(event) => setField("temperature", event.target.value as LeadCreatePayload["temperature"])}
              className={INPUT_CLASS}
            >
              <option value="cold">Freddo</option>
              <option value="warm">Tiepido</option>
              <option value="hot">Caldo</option>
            </select>
          </Field>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Field label="Nome sede">
            <input
              value={form.location_name}
              onChange={(event) => setField("location_name", event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Indirizzo">
            <input
              value={form.address}
              onChange={(event) => setField("address", event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Città">
            <input
              value={form.city}
              onChange={(event) => setField("city", event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provincia">
              <input
                value={form.province}
                onChange={(event) => setField("province", event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="CAP">
              <input
                value={form.postal_code}
                onChange={(event) => setField("postal_code", event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </div>

        <Field label="Note" className="mt-4">
          <textarea
            value={form.notes}
            onChange={(event) => setField("notes", event.target.value)}
            className={`${INPUT_CLASS} min-h-28`}
          />
        </Field>

        <div className="mt-6 flex justify-end">
          <button
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-3 text-sm font-black text-white hover:bg-pork-red/90 disabled:cursor-not-allowed disabled:bg-pork-ink/25"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salva lead
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-black uppercase text-pork-ink/45">
        {label}{required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
