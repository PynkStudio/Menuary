"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type ChangeEvent } from "react";
import { Eye, GripVertical, Plus, Save, Trash2, UploadCloud } from "lucide-react";
import {
  valentinaBasePath,
  valentinaCreativeWorks,
  type ValentinaCreativeWork,
} from "@/components/tenants/valentina-orciuoli/content";

const tenantId = "valentina-orciuoli";

function emptyWork(): ValentinaCreativeWork {
  const id = crypto.randomUUID();
  return {
    id,
    slug: `nuova-opera-${id.slice(0, 8)}`,
    title: "Nuova opera",
    description: "",
    secondaryText: "",
    coverImageUrl: "",
    backgroundMediaUrl: "",
    ctaLabel: "Scopri",
    ctaHref: "",
    enabled: true,
  };
}

export function ValentinaWorksCatalogAdmin() {
  const [works, setWorks] = useState<ValentinaCreativeWork[]>(valentinaCreativeWorks);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/gestione/creative-works?tenantId=${tenantId}`)
      .then((response) => response.json())
      .then((data) => {
        if (alive && Array.isArray(data.works)) setWorks(data.works);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function updateWork(id: string, patch: Partial<ValentinaCreativeWork>) {
    setWorks((current) => current.map((work) => work.id === id ? { ...work, ...patch } : work));
  }

  function moveWork(id: string, direction: -1 | 1) {
    setWorks((current) => {
      const index = current.findIndex((work) => work.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const copy = [...current];
      const [work] = copy.splice(index, 1);
      copy.splice(target, 0, work);
      return copy;
    });
  }

  async function uploadImage(
    workId: string,
    field: "coverImageUrl" | "backgroundMediaUrl",
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setStatus(null);
    setUploading(`${workId}:${field}`);

    const form = new FormData();
    form.append("tenantId", tenantId);
    form.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    setUploading(null);
    if (!response.ok || typeof data.path !== "string") {
      setStatus(data.detail ?? "Caricamento immagine non riuscito.");
      return;
    }
    updateWork(workId, { [field]: data.path });
    setStatus("Immagine caricata. Salva il catalogo per pubblicarla.");
  }

  async function save() {
    setPending(true);
    setStatus(null);
    const response = await fetch("/api/gestione/creative-works", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, works }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setStatus(data.error ?? "Errore durante il salvataggio.");
      return;
    }
    if (Array.isArray(data.works)) setWorks(data.works);
    setStatus("Catalogo aggiornato.");
  }

  return (
    <div className="vo-admin-works ga-dashboard">
      <header className="vo-admin-works-hero">
        <div>
          <span className="ga-eyebrow">Catalogo opere</span>
          <h1 className="ga-heading">Editor della pagina libri</h1>
          <p className="ga-lead">
            Aggiungi, ordina o rimuovi le opere e aggiorna titolo, copertina e sfondo
            delle sezioni pubblicate su /libri.
          </p>
        </div>
        <div className="vo-admin-works-actions">
          <a className="ga-btn ga-btn-ghost" href={`${valentinaBasePath}/libri`} target="_blank" rel="noopener noreferrer">
            <Eye size={15} /> Anteprima
          </a>
          <button className="ga-btn ga-btn-primary" type="button" onClick={save} disabled={pending || Boolean(uploading)}>
            <Save size={15} /> {pending ? "Salvataggio..." : "Salva catalogo"}
          </button>
        </div>
      </header>

      <section className="vo-admin-works-stats" aria-label="Stato catalogo">
        <article className="ga-kpi">
          <span className="ga-kpi-label">Opere totali</span>
          <span className="ga-kpi-value">{works.length}</span>
        </article>
        <article className="ga-kpi">
          <span className="ga-kpi-label">Visibili online</span>
          <span className="ga-kpi-value">{works.filter((work) => work.enabled).length}</span>
        </article>
      </section>

      <section className="ga-section vo-admin-work-editor">
        <div className="ga-section-head">
          <div>
            <h2 className="ga-section-title">Opere</h2>
            <span className="ga-section-hint">L’ordine qui sotto è lo stesso della pagina pubblica.</span>
          </div>
          <button type="button" className="ga-button ga-button-light" onClick={() => setWorks((current) => [...current, emptyWork()])}>
            <Plus size={16} /> Aggiungi opera
          </button>
        </div>

        <div className="vo-admin-work-list">
          {works.map((work, index) => (
            <article className="vo-admin-work-card" key={work.id}>
              <div className="vo-admin-work-order">
                <GripVertical size={18} />
                <span>{String(index + 1).padStart(2, "0")}</span>
                <button type="button" className="ga-icon-button" onClick={() => moveWork(work.id, -1)} disabled={index === 0}>↑</button>
                <button type="button" className="ga-icon-button" onClick={() => moveWork(work.id, 1)} disabled={index === works.length - 1}>↓</button>
              </div>

              <div className="vo-admin-work-fields">
                <label>
                  Nome dell’opera
                  <input className="ga-input" value={work.title} onChange={(event) => updateWork(work.id, { title: event.target.value })} />
                </label>
                <label>
                  Testo introduttivo
                  <textarea className="ga-textarea" rows={2} value={work.description} onChange={(event) => updateWork(work.id, { description: event.target.value })} />
                </label>
                <label>
                  Testo della scheda
                  <textarea className="ga-textarea" rows={3} value={work.secondaryText} onChange={(event) => updateWork(work.id, { secondaryText: event.target.value })} />
                </label>
                <div className="vo-admin-work-link-fields">
                  <label>
                    Testo pulsante
                    <input className="ga-input" value={work.ctaLabel} onChange={(event) => updateWork(work.id, { ctaLabel: event.target.value })} />
                  </label>
                  <label>
                    Link pulsante
                    <input className="ga-input" value={work.ctaHref} onChange={(event) => updateWork(work.id, { ctaHref: event.target.value })} />
                  </label>
                </div>
              </div>

              <div className="vo-admin-work-media">
                <WorkImageField
                  label="Copertina"
                  value={work.coverImageUrl}
                  busy={uploading === `${work.id}:coverImageUrl`}
                  onUpload={(event) => void uploadImage(work.id, "coverImageUrl", event)}
                  onRemove={() => updateWork(work.id, { coverImageUrl: "" })}
                />
                <WorkImageField
                  label="Sfondo sezione"
                  value={work.backgroundMediaUrl}
                  busy={uploading === `${work.id}:backgroundMediaUrl`}
                  onUpload={(event) => void uploadImage(work.id, "backgroundMediaUrl", event)}
                  onRemove={() => updateWork(work.id, { backgroundMediaUrl: "" })}
                />
              </div>

              <div className="vo-admin-work-footer">
                <label className="vo-admin-work-toggle">
                  <input type="checkbox" checked={work.enabled} onChange={(event) => updateWork(work.id, { enabled: event.target.checked })} />
                  Visibile su /libri
                </label>
                <button type="button" className="ga-button vo-admin-work-delete" onClick={() => setWorks((current) => current.filter((item) => item.id !== work.id))}>
                  <Trash2 size={15} /> Rimuovi
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="vo-admin-work-savebar">
          <button type="button" className="ga-button ga-button-primary" onClick={save} disabled={pending || Boolean(uploading)}>
            <Save size={16} /> {pending ? "Salvataggio..." : "Salva catalogo"}
          </button>
          {status && <span className="ga-section-hint" role="status">{status}</span>}
        </div>
      </section>
    </div>
  );
}

function WorkImageField({
  label,
  value,
  busy,
  onUpload,
  onRemove,
}: {
  label: string;
  value: string;
  busy: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const isVideo = /\.(mp4|webm)(\?|$)/i.test(value);

  return (
    <div className="vo-admin-image-field">
      <span>{label}</span>
      <div className="vo-admin-image-preview">
        {value ? (
          isVideo
            ? <video src={value} muted playsInline aria-label={`Anteprima ${label}`} />
            : <img src={value} alt={`Anteprima ${label}`} />
        ) : (
          <span>Nessuna immagine</span>
        )}
        {busy && <strong>Caricamento...</strong>}
      </div>
      <div>
        <label className="ga-button ga-button-light">
          <UploadCloud size={14} /> {value ? "Sostituisci" : "Carica"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={onUpload} disabled={busy} />
        </label>
        {value && (
          <button type="button" className="ga-icon-button" aria-label={`Rimuovi ${label}`} onClick={onRemove}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
