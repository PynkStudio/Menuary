"use client";

import { useRef, useState } from "react";
import { X, GitBranch, Loader2, ExternalLink, CheckCircle2, MonitorUp, Figma, FileX } from "lucide-react";
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
  const [animaFile, setAnimaFile] = useState<File | null>(null);
  const [animaDragging, setAnimaDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [demoUrl, setDemoUrl] = useState<string | null>(null);
  const [figmaUrl, setFigmaUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("leadId", lead.id);
      fd.append("tenantSlug", slug);
      fd.append("domain", domain);
      fd.append("vertical", lead.business_vertical);
      fd.append("businessName", lead.business_name);
      fd.append("primaryColor", primary);
      if (animaFile) fd.append("animaFile", animaFile);

      const res = await fetch("/api/admin/generate-tenant", {
        method: "POST",
        body: fd,
      });

      const data = (await res.json()) as {
        success?: boolean;
        pr_url?: string;
        demo_url?: string;
        figma_url?: string;
        error?: string;
      };

      if (!res.ok || data.error) {
        setError(data.error ?? "Errore sconosciuto");
        return;
      }

      setPrUrl(data.pr_url!);
      setDemoUrl(data.demo_url ?? null);
      setFigmaUrl(data.figma_url ?? null);
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
              <MonitorUp size={16} />
            </div>
            <div>
              <p className="font-black">Crea demo</p>
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
            <p className="text-lg font-black">Demo predisposta</p>
            <p className="text-sm text-pork-ink/60">
              La PR è aperta su GitHub e il link demo è pronto per lavorare al sito e presentarlo al lead.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {demoUrl && (
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-2.5 text-sm font-bold text-white"
                >
                  Apri demo <ExternalLink size={13} />
                </a>
              )}
              {figmaUrl && (
                <a
                  href={figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white"
                >
                  Preview Figma <ExternalLink size={13} />
                </a>
              )}
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-5 py-2.5 text-sm font-bold text-white"
              >
                Apri PR <ExternalLink size={13} />
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
            {/* Info box */}
            <div className="rounded-2xl bg-pork-cream p-4 text-sm text-pork-ink/70">
              <p>
                Verrà creata la branch{" "}
                <code className="rounded bg-pork-ink/8 px-1 font-mono text-xs">
                  demo/{slug || "…"}
                </code>{" "}
                e verrà predisposto il link demo, senza attivare il dominio ufficiale.
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
              <FormField label="Slug demo" hint="ID univoco — solo minuscolo e trattini">
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

              <FormField label="Dominio ufficiale previsto" hint="Resta non attivo finché il lead non firma">
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded-xl border border-pork-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pork-ink/20"
                  placeholder="es. nometenant.menuary.it"
                  required
                />
              </FormField>

              <div className="rounded-2xl bg-pork-cream p-4 text-xs text-pork-ink/60">
                <p className="font-bold text-pork-ink">Link demo: {lead.business_vertical === "services" ? "demo.bizery.it" : "demo.menuary.it"}/{slug || "…"}</p>
                <p className="mt-1">
                  Il piano sottoscritto e i moduli definitivi si scelgono dopo, quando il lead diventa venduto.
                </p>
              </div>

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

              {/* Upload design Figma — opzionale */}
              <div className="space-y-1.5">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-pork-ink/60">
                    Design Figma
                    <span className="ml-1.5 font-normal normal-case text-pork-ink/30">opzionale</span>
                  </p>
                  <p className="text-[10px] text-pork-ink/40">
                    Export ZIP da Anima plugin — va in{" "}
                    <code className="font-mono">public/{slug || "…"}/anima/</code> sulla PR
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.html"
                  className="hidden"
                  onChange={(e) => setAnimaFile(e.target.files?.[0] ?? null)}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setAnimaDragging(true); }}
                  onDragLeave={() => setAnimaDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setAnimaDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) setAnimaFile(f);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3.5 transition",
                    animaDragging
                      ? "border-violet-400 bg-violet-50"
                      : animaFile
                        ? "border-violet-300 bg-violet-50/60"
                        : "border-pork-ink/15 bg-pork-cream hover:border-pork-ink/30",
                  )}
                >
                  <Figma
                    size={18}
                    className={animaFile ? "text-violet-500" : "text-pork-ink/30"}
                  />
                  {animaFile ? (
                    <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                      <span className="truncate text-sm font-bold text-violet-700">
                        {animaFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setAnimaFile(null); }}
                        className="shrink-0 rounded-full p-0.5 text-violet-400 hover:text-violet-700"
                      >
                        <FileX size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-pork-ink/40">
                      {animaDragging ? "Rilascia qui" : "Trascina il file o clicca per sfogliare"}
                    </span>
                  )}
                </div>
              </div>
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
                    <GitBranch size={14} /> Crea demo
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
