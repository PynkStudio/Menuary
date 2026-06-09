"use client";

import { useState } from "react";
import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import type { TenantLinktreeItem } from "@/components/modules/linktree/linktree-view";

type EditableLink = TenantLinktreeItem & {
  localId: string;
};

function withLocalIds(items: TenantLinktreeItem[]): EditableLink[] {
  return items.map((item, index) => ({
    ...item,
    localId: item.id ?? `${item.label}-${index}`,
    enabled: item.enabled !== false,
  }));
}

const emptyLink = (): EditableLink => ({
  localId: crypto.randomUUID(),
  label: "",
  href: "",
  description: "",
  kind: "link",
  enabled: true,
});

export function LinktreeManager({
  tenantId,
  initialLinks,
}: {
  tenantId: string;
  initialLinks: TenantLinktreeItem[];
}) {
  const [links, setLinks] = useState<EditableLink[]>(() => withLocalIds(initialLinks));
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function updateLink(localId: string, patch: Partial<EditableLink>) {
    setLinks((current) => current.map((item) => item.localId === localId ? { ...item, ...patch } : item));
  }

  function moveLink(localId: string, direction: -1 | 1) {
    setLinks((current) => {
      const index = current.findIndex((item) => item.localId === localId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  }

  async function save() {
    setPending(true);
    setStatus(null);
    const res = await fetch("/api/gestione/linktree", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, links }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setStatus(data.error ?? "Errore durante il salvataggio.");
      return;
    }
    setStatus("Link aggiornati.");
  }

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Presenza digitale</span>
        <h1 className="ga-heading">Linktree</h1>
        <p className="ga-lead">Aggiorna i collegamenti della pagina Link pubblica.</p>
      </header>

      <section className="ga-section vo-linktree-admin">
        <div className="ga-section-head">
          <h2 className="ga-section-title">Link pubblici</h2>
          <button type="button" className="ga-button ga-button-light" onClick={() => setLinks((current) => [...current, emptyLink()])}>
            <Plus size={16} /> Aggiungi link
          </button>
        </div>

        <div className="vo-linktree-admin-list">
          {links.map((item, index) => (
            <article key={item.localId} className="vo-linktree-admin-row">
              <div className="vo-linktree-admin-order">
                <GripVertical size={16} />
                <button type="button" className="ga-icon-button" onClick={() => moveLink(item.localId, -1)} disabled={index === 0}>↑</button>
                <button type="button" className="ga-icon-button" onClick={() => moveLink(item.localId, 1)} disabled={index === links.length - 1}>↓</button>
              </div>
              <label>
                Titolo
                <input className="ga-input" value={item.label} onChange={(event) => updateLink(item.localId, { label: event.target.value })} />
              </label>
              <label>
                URL
                <input className="ga-input" value={item.href} onChange={(event) => updateLink(item.localId, { href: event.target.value })} />
              </label>
              <label>
                Descrizione
                <input className="ga-input" value={item.description ?? ""} onChange={(event) => updateLink(item.localId, { description: event.target.value })} />
              </label>
              <label>
                Tipo
                <input className="ga-input" value={item.kind ?? "link"} onChange={(event) => updateLink(item.localId, { kind: event.target.value })} />
              </label>
              <label className="vo-linktree-admin-toggle">
                <input type="checkbox" checked={item.enabled !== false} onChange={(event) => updateLink(item.localId, { enabled: event.target.checked })} />
                Attivo
              </label>
              <button type="button" className="ga-icon-button" aria-label="Elimina link" onClick={() => setLinks((current) => current.filter((link) => link.localId !== item.localId))}>
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>

        <div className="vo-linktree-admin-actions">
          <button type="button" className="ga-button ga-button-primary" onClick={save} disabled={pending}>
            <Save size={16} /> {pending ? "Salvataggio..." : "Salva link"}
          </button>
          {status && <span className="ga-section-hint">{status}</span>}
        </div>
      </section>
    </div>
  );
}
