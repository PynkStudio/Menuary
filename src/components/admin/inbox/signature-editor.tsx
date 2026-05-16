"use client";

import { useState, useTransition } from "react";
import { Save, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboundEmailBrand } from "@/lib/email/inbound-types";
import type { EmailSignature } from "@/lib/email/signature-queries";

type Props = {
  brand: InboundEmailBrand;
  initial: EmailSignature | null;
};

type Fields = {
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
};

const BRAND_LABELS: Record<InboundEmailBrand, string> = {
  menuary: "Menuary",
  bizery:  "Bizery",
};

const BRAND_COLORS: Record<InboundEmailBrand, string> = {
  menuary: "#B8332E",
  bizery:  "#2563EB",
};

function buildPreviewHtml(fields: Fields, brand: InboundEmailBrand): string {
  const color = BRAND_COLORS[brand];
  const parts: string[] = [];
  if (fields.name)
    parts.push(`<strong style="color:${color};font-size:14px">${fields.name}</strong>`);
  if (fields.title)
    parts.push(`<span style="color:#555;font-size:12px">${fields.title} · ${BRAND_LABELS[brand]}</span>`);
  if (fields.phone)
    parts.push(`<span style="color:#666;font-size:12px">📞 ${fields.phone}</span>`);
  if (fields.email)
    parts.push(`<a href="mailto:${fields.email}" style="color:${color};font-size:12px">${fields.email}</a>`);
  if (fields.website)
    parts.push(`<a href="${fields.website}" style="color:${color};font-size:12px">${fields.website.replace(/^https?:\/\//, "")}</a>`);
  return parts.join("<br>");
}

export function SignatureEditor({ brand, initial }: Props) {
  const [fields, setFields] = useState<Fields>({
    name:    initial?.name    ?? "",
    title:   initial?.title   ?? "",
    phone:   initial?.phone   ?? "",
    email:   initial?.email   ?? "",
    website: initial?.website ?? "",
  });
  const [preview, setPreview] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [isPending, start]    = useTransition();

  function set(field: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    start(async () => {
      try {
        const res = await fetch("/api/email/signature", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand, ...fields }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) { setError(data.error ?? "Errore salvataggio."); return; }
        setSaved(true);
      } catch {
        setError("Errore di rete.");
      }
    });
  }

  const previewHtml = buildPreviewHtml(fields, brand);

  return (
    <div className="menuary-admin-card space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--ma-ink)]">
            Firma {BRAND_LABELS[brand]}
          </h3>
          <p className="text-sm text-[var(--ma-muted)]">
            Apparirà in fondo alle email inviate da {brand === "menuary" ? "hello@menuary.it" : "hello@bizery.it"}
          </p>
        </div>
        <button
          onClick={() => setPreview((p) => !p)}
          className={cn("menuary-admin-nav-link !w-auto !px-3 !py-1.5 text-sm gap-1.5", preview && "text-[var(--ma-accent)]")}
        >
          <Eye size={14} /> {preview ? "Modifica" : "Anteprima"}
        </button>
      </div>

      {preview ? (
        <div className="rounded-xl border border-[var(--ma-line)] bg-[var(--ma-surface)] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--ma-muted)]">Anteprima firma</p>
          <div
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: previewHtml || "<span style='color:#999'>Firma vuota</span>" }}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { key: "name",    label: "Nome e cognome",  placeholder: "Mario Rossi" },
              { key: "title",   label: "Ruolo / Titolo",  placeholder: "Responsabile commerciale" },
              { key: "phone",   label: "Telefono",        placeholder: "+39 02 1234567" },
              { key: "email",   label: "Email di contatto", placeholder: "mario@menuary.it" },
              { key: "website", label: "Sito web",        placeholder: "https://menuary.it" },
            ] as { key: keyof Fields; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <div key={key} className={key === "website" ? "sm:col-span-2" : ""}>
              <label className="mb-1 block text-xs font-medium text-[var(--ma-muted)]">{label}</label>
              <input
                value={fields[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="menuary-admin-input w-full"
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        {saved && <p className="text-sm text-green-600">Firma salvata.</p>}
        {!saved && <div />}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="menuary-admin-action-btn flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={15} />
          {isPending ? "Salvataggio…" : "Salva firma"}
        </button>
      </div>
    </div>
  );
}
