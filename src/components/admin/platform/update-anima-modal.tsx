"use client";

import { useRef, useState } from "react";
import {
  X,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Figma,
  FileX,
  Upload,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  tenantSlug: string;
  figmaUrl: string;
  onClose: () => void;
};

export function UpdateAnimaModal({ tenantSlug, figmaUrl, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    fileCount: number;
    branch: string;
    prUrl: string | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("tenantSlug", tenantSlug);
      fd.append("animaFile", file);

      const res = await fetch("/api/admin/update-anima", {
        method: "POST",
        body: fd,
      });

      const data = (await res.json()) as {
        success?: boolean;
        branch?: string;
        fileCount?: number;
        pr_url?: string | null;
        error?: string;
      };

      if (!res.ok || data.error) {
        setError(data.error ?? "Errore sconosciuto");
        return;
      }

      setResult({
        fileCount: data.fileCount ?? 0,
        branch: data.branch ?? `demo/${tenantSlug}`,
        prUrl: data.pr_url ?? null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl ring-1 ring-pork-ink/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pork-ink/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Figma size={16} />
            </div>
            <div>
              <p className="font-black">Aggiorna design Figma</p>
              <p className="text-xs text-pork-ink/50">{tenantSlug}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-pork-ink/5">
            <X size={16} />
          </button>
        </div>

        {/* Success */}
        {result ? (
          <div className="space-y-4 px-6 py-10 text-center">
            <CheckCircle2 size={40} className="mx-auto text-pork-green" />
            <p className="text-lg font-black">Design aggiornato</p>
            <p className="text-sm text-pork-ink/60">
              {result.fileCount} file committati su{" "}
              <code className="rounded bg-pork-ink/8 px-1 font-mono text-xs">
                {result.branch}
              </code>
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <a
                href={figmaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white"
              >
                Apri preview <ExternalLink size={13} />
              </a>
              {result.prUrl && (
                <a
                  href={result.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-5 py-2.5 text-sm font-bold text-white"
                >
                  <GitBranch size={13} /> Apri PR
                </a>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
            {/* Info contestuale */}
            <div className="rounded-2xl bg-pork-cream p-4 text-xs text-pork-ink/60">
              <p>
                Il nuovo export sovrascriverà i file in{" "}
                <code className="font-mono">public/{tenantSlug}/anima/</code>.
                Se il branch demo è già mergiato, viene aperta una nuova PR.
              </p>
            </div>

            {/* Drop zone */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.html"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) setFile(f);
              }}
              className={cn(
                "flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition",
                dragging
                  ? "border-violet-400 bg-violet-50"
                  : file
                    ? "border-violet-300 bg-violet-50/60"
                    : "border-pork-ink/15 bg-pork-cream hover:border-pork-ink/30",
              )}
            >
              {file ? (
                <>
                  <Figma size={22} className="text-violet-500" />
                  <div className="flex items-center gap-2">
                    <span className="max-w-[200px] truncate text-sm font-bold text-violet-700">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="rounded-full p-0.5 text-violet-400 hover:text-violet-700"
                    >
                      <FileX size={14} />
                    </button>
                  </div>
                  <span className="text-xs text-pork-ink/40">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </>
              ) : (
                <>
                  <Upload size={22} className="text-pork-ink/25" />
                  <p className="text-sm font-bold text-pork-ink/50">
                    {dragging ? "Rilascia qui" : "Trascina o clicca per sfogliare"}
                  </p>
                  <p className="text-xs text-pork-ink/35">Export ZIP da Anima · .html singolo</p>
                </>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

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
                disabled={loading || !file}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-white transition",
                  loading || !file
                    ? "cursor-not-allowed bg-violet-300"
                    : "bg-violet-600 hover:bg-violet-700",
                )}
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Caricamento…</>
                ) : (
                  <><Upload size={14} /> Aggiorna design</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
