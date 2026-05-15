"use client";

import { useState } from "react";
import { X, GitBranch, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformLead } from "@/lib/platform-crm-types";

type Props = {
  lead: PlatformLead;
  onClose: () => void;
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function GenerateTenantModal({ lead, onClose }: Props) {
  const defaultSlug = lead.business_slug ?? toSlug(lead.business_name);
  const defaultDomain =
    lead.business_vertical === "food"
      ? `${defaultSlug}.menuary.it`
      : `${defaultSlug}.bizery.it`;

  const [slug, setSlug] = useState(defaultSlug);
  const [domain, setDomain] = useState(defaultDomain);
  const [primary, setPrimary] = useState("#0f172a");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/generate-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          tenantSlug: slug,
          domain,
          vertical: lead.business_vertical,
          businessName: lead.business_name,
          primaryColor: primary,
        }),
      });

      const data = (await res.json()) as { success?: boolean; pr_url?: string; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Errore sconosciuto");
        return;
      }

      setPrUrl(data.pr_url!);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl ring-1 ring-pork-ink/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pork-ink/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pork-ink text-white">
              <GitBranch size={16} />
            </div>
            <div>
              <p className="font-black">Converti in Tenant</p>
              <p className="text-xs text-pork-ink/50">{lead.business_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-pork-ink/5">
            <X size={16} />
          </button>
        </div>

        {/* Stato success */}
        {prUrl ? (
          <div className="space-y-4 px-6 py-10 text-center">
            <CheckCircle2 size={40} className="mx-auto text-pork-green" />
            <p className="text-lg font-black">Branch e PR creati!</p>
            <p className="text-sm text-pork-ink/60">
              La PR è aperta su GitHub. Quando il dev completa l&apos;UI custom, basta fare merge.
            </p>
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-5 py-2.5 text-sm font-bold text-white"
            >
              Apri PR su GitHub <ExternalLink size={13} />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
            {/* Info box */}
            <div className="rounded-2xl bg-pork-cream p-4 text-sm text-pork-ink/70">
              <p>
                Verrà creata la branch{" "}
                <code className="rounded bg-pork-ink/8 px-1 font-mono text-xs">
                  tenant/{slug || "…"}
                </code>{" "}
                con:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
                <li>
                  CSS tokens in{" "}
                  <code className="font-mono">src/styles/tenants/{slug || "…"}.css</code>
                </li>
                <li>
                  Componente stub in{" "}
                  <code className="font-mono">src/components/tenants/{slug || "…"}/</code>
                </li>
                <li>
                  Entry in <code className="font-mono">tenant-registry.ts</code> e{" "}
                  <code className="font-mono">tenant-content.ts</code>
                </li>
              </ul>
            </div>

            {/* Campi */}
            <div className="space-y-4">
              <FormField label="Slug tenant" hint="ID univoco — solo minuscolo e trattini">
                <input
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className="w-full rounded-xl border border-pork-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pork-ink/20"
                  placeholder="es. osteria-della-piazza"
                  required
                />
              </FormField>

              <FormField label="Dominio" hint="Dominio definitivo del tenant">
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded-xl border border-pork-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pork-ink/20"
                  placeholder="es. nometenant.menuary.it"
                  required
                />
              </FormField>

              <FormField
                label="Colore primario"
                hint="Punto di partenza per i CSS token (modificabile dopo)"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-pork-ink/15 bg-white p-1"
                  />
                  <input
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="flex-1 rounded-xl border border-pork-ink/15 px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pork-ink/20"
                    placeholder="#000000"
                  />
                </div>
              </FormField>
            </div>

            {/* Errore */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-pork-ink/15 py-2.5 text-sm font-bold text-pork-ink/60 hover:bg-pork-ink/5"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading || !slug || !domain}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-white transition",
                  loading || !slug || !domain
                    ? "cursor-not-allowed bg-pork-ink/30"
                    : "bg-pork-ink hover:bg-pork-ink/80",
                )}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Generazione…
                  </>
                ) : (
                  <>
                    <GitBranch size={14} /> Genera Tenant
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-pork-ink/60">{label}</p>
        {hint && <p className="text-[10px] text-pork-ink/40">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
