"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { ADMIN_TOKEN_HEADER, getAdminPassword } from "@/lib/admin-auth";

export function ImageUpload({
  value,
  tenantId,
  onChange,
}: {
  value?: string;
  tenantId?: string;
  onChange: (path: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (tenantId) fd.append("tenantId", tenantId);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          [ADMIN_TOKEN_HEADER]: getAdminPassword(),
        },
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Errore upload");
      }
      const j = (await res.json()) as { path: string };
      onChange(j.path);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-pork-ink/5 ring-1 ring-pork-ink/10">
          <Image src={value} alt="Anteprima" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-pork-ink/90 px-3 py-1.5 text-xs font-bold text-pork-cream hover:bg-pork-red"
          >
            <Trash2 size={12} /> Rimuovi
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-pork-ink/20 bg-white text-pork-ink/50 transition-colors hover:border-pork-red hover:text-pork-red"
        >
          <ImagePlus size={26} />
          <span className="text-sm font-semibold">Carica foto</span>
          <span className="text-[11px]">JPG / PNG / WebP, max 6 MB</span>
        </button>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-pork-cream hover:bg-pork-red disabled:opacity-50"
        >
          <UploadCloud size={14} />
          {busy ? "Carico…" : value ? "Sostituisci" : "Scegli file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {err && <p className="text-xs font-semibold text-pork-red">{err}</p>}
    </div>
  );
}
