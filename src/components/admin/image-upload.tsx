"use client";

import Image from "next/image";
import { type DragEvent, useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { ADMIN_TOKEN_HEADER, getAdminPassword } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 6 * 1024 * 1024;

function uploadErrorLabel(error?: string, detail?: string) {
  if (detail) return detail;
  switch (error) {
    case "unauthorized":
      return "Non hai i permessi per caricare immagini.";
    case "invalid-type":
      return "Formato non supportato. Usa JPG, PNG, WebP o AVIF.";
    case "too-large":
      return "Il file supera 6 MB.";
    case "no-file":
      return "Nessun file ricevuto.";
    case "bucket-create-failed":
    case "bucket-check-failed":
    case "upload-failed":
    case "upload-error":
      return "Upload non riuscito. Riprova o controlla la configurazione Storage.";
    default:
      return "Errore upload";
  }
}

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
  const [dragging, setDragging] = useState(false);

  function validateFile(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Formato non supportato. Usa JPG, PNG, WebP o AVIF.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Il file supera 6 MB.";
    }
    return null;
  }

  async function handleFile(file: File) {
    setErr(null);
    const validationError = validateFile(file);
    if (validationError) {
      setErr(validationError);
      return;
    }
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
        const j = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        throw new Error(uploadErrorLabel(j.error, j.detail));
      }
      const j = (await res.json()) as { path: string };
      onChange(j.path);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusy(false);
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!busy) setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div
      className="space-y-2"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          "relative aspect-[4/3] w-full overflow-hidden rounded-xl transition-colors",
          value
            ? "bg-pork-ink/5 ring-1 ring-pork-ink/10"
            : "border-2 border-dashed border-pork-ink/20 bg-white",
          dragging && "border-pork-red bg-pork-red/5 ring-2 ring-pork-red/30",
          busy && "pointer-events-none opacity-70",
        )}
      >
        {value ? (
          <>
            <Image src={value} alt="Anteprima" fill className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-pork-ink/90 px-3 py-1.5 text-xs font-bold text-pork-cream hover:bg-pork-red"
            >
              <Trash2 size={12} /> Rimuovi
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-pork-ink/70 px-4 text-center text-pork-cream opacity-0 transition-opacity hover:opacity-100",
                dragging && "opacity-100",
              )}
            >
              <UploadCloud size={28} />
              <span className="text-sm font-black">
                {dragging ? "Rilascia per sostituire" : "Trascina qui una nuova foto"}
              </span>
              <span className="text-[11px] font-semibold opacity-80">oppure clicca per scegliere</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-pork-ink/50 transition-colors hover:text-pork-red"
          >
            {dragging ? <UploadCloud size={28} /> : <ImagePlus size={26} />}
            <span className="text-sm font-semibold">
              {dragging ? "Rilascia qui la foto" : "Carica foto"}
            </span>
            <span className="text-[11px]">Trascina un file oppure scegli JPG / PNG / WebP, max 6 MB</span>
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-black text-pork-ink">
            Caricamento…
          </div>
        )}
      </div>

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
