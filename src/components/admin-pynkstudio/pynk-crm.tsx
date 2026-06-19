"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, Phone, Search, X, ChevronRight, Building2, Users, MapPin, Clock, Tag, StickyNote } from "lucide-react";

type Status = "lead" | "prospect" | "client" | "lost";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  employees_count: number | null;
  industry: string | null;
  address: string | null;
  work_hours: string | null;
  notes: string | null;
  tags: string[];
  status: Status;
  source: string;
  last_booking_at: string | null;
  bookings_count: number;
  created_at: string;
};

const STATUS_LABELS: Record<Status, string> = {
  lead: "Lead",
  prospect: "Prospect",
  client: "Cliente",
  lost: "Perso",
};

const STATUS_FILTERS = [
  { value: "all", label: "Tutti" },
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospect" },
  { value: "client", label: "Clienti" },
  { value: "lost", label: "Persi" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

function StatusBadge({ status }: { status: Status }) {
  return <span className="pynk-crm-badge" data-status={status}>{STATUS_LABELS[status]}</span>;
}

// ── Drawer ────────────────────────────────────────────────────────────────────

type DrawerProps = {
  contact: Contact;
  onClose: () => void;
  onSaved: (updated: Contact) => void;
};

function Drawer({ contact, onClose, onSaved }: DrawerProps) {
  const [form, setForm] = useState({
    name: contact.name,
    phone: contact.phone,
    company: contact.company ?? "",
    employees_count: contact.employees_count?.toString() ?? "",
    industry: contact.industry ?? "",
    address: contact.address ?? "",
    work_hours: contact.work_hours ?? "",
    notes: contact.notes ?? "",
    tags: contact.tags.join(", "),
    status: contact.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Chiudi cliccando fuori
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pynkstudio/crm/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          company: form.company,
          employees_count: form.employees_count === "" ? null : Number(form.employees_count),
          industry: form.industry,
          address: form.address,
          work_hours: form.work_hours,
          notes: form.notes,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          status: form.status,
        }),
      });
      if (!res.ok) throw new Error();
      onSaved({
        ...contact,
        name: form.name,
        phone: form.phone,
        company: form.company || null,
        employees_count: form.employees_count ? Number(form.employees_count) : null,
        industry: form.industry || null,
        address: form.address || null,
        work_hours: form.work_hours || null,
        notes: form.notes || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: form.status as Status,
      });
    } catch {
      setError("Salvataggio fallito. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="pynk-crm-overlay" onClick={onClose} aria-hidden />
      <div className="pynk-crm-drawer" ref={panelRef} role="dialog" aria-modal aria-label={`Scheda: ${contact.name}`}>
        {/* Header */}
        <div className="pynk-crm-drawer-header">
          <div>
            <p className="pynk-crm-drawer-name">{contact.name}</p>
            <div className="pynk-crm-drawer-meta">
              <a href={`mailto:${contact.email}`} className="pynk-crm-drawer-link"><Mail size={13} />{contact.email}</a>
              <a href={`tel:${contact.phone}`} className="pynk-crm-drawer-link"><Phone size={13} />{contact.phone}</a>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pynk-admin-icon-btn" aria-label="Chiudi"><X size={18} /></button>
        </div>

        <div className="pynk-crm-drawer-body">
          {/* Stato */}
          <div className="pynk-crm-drawer-section">
            <label className="pynk-crm-label">Stato</label>
            <select className="pynk-admin-select" value={form.status} onChange={set("status")}>
              {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Base */}
          <div className="pynk-crm-drawer-section">
            <p className="pynk-crm-drawer-section-title">Contatto</p>
            <div className="pynk-crm-field-row">
              <div className="pynk-crm-field">
                <label className="pynk-crm-label">Nome</label>
                <input className="pynk-admin-input" value={form.name} onChange={set("name")} />
              </div>
              <div className="pynk-crm-field">
                <label className="pynk-crm-label">Telefono</label>
                <input className="pynk-admin-input" value={form.phone} onChange={set("phone")} type="tel" />
              </div>
            </div>
          </div>

          {/* Azienda */}
          <div className="pynk-crm-drawer-section">
            <p className="pynk-crm-drawer-section-title"><Building2 size={14} /> Azienda</p>
            <div className="pynk-crm-field">
              <label className="pynk-crm-label">Nome azienda</label>
              <input className="pynk-admin-input" value={form.company} onChange={set("company")} placeholder="Es. Acme S.r.l." />
            </div>
            <div className="pynk-crm-field-row">
              <div className="pynk-crm-field">
                <label className="pynk-crm-label"><Users size={12} /> N° dipendenti</label>
                <input className="pynk-admin-input" value={form.employees_count} onChange={set("employees_count")} type="number" min={1} placeholder="Es. 12" />
              </div>
              <div className="pynk-crm-field">
                <label className="pynk-crm-label">Categoria merceologica</label>
                <input className="pynk-admin-input" value={form.industry} onChange={set("industry")} placeholder="Es. Manifattura, Retail…" />
              </div>
            </div>
            <div className="pynk-crm-field">
              <label className="pynk-crm-label"><MapPin size={12} /> Indirizzo</label>
              <input className="pynk-admin-input" value={form.address} onChange={set("address")} placeholder="Via Roma 1, Milano" />
            </div>
            <div className="pynk-crm-field">
              <label className="pynk-crm-label"><Clock size={12} /> Orari di lavoro</label>
              <input className="pynk-admin-input" value={form.work_hours} onChange={set("work_hours")} placeholder="Lun-Ven 9:00-18:00" />
            </div>
          </div>

          {/* Tag */}
          <div className="pynk-crm-drawer-section">
            <p className="pynk-crm-drawer-section-title"><Tag size={14} /> Tag</p>
            <div className="pynk-crm-field">
              <input
                className="pynk-admin-input"
                value={form.tags}
                onChange={set("tags")}
                placeholder="Es. e-commerce, nord-italia, urgente (separati da virgola)"
              />
            </div>
            {form.tags && (
              <div className="pynk-crm-tags-preview">
                {form.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                  <span key={t} className="pynk-crm-tag">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          <div className="pynk-crm-drawer-section">
            <p className="pynk-crm-drawer-section-title"><StickyNote size={14} /> Note</p>
            <div className="pynk-crm-field">
              <textarea
                className="pynk-admin-textarea"
                value={form.notes}
                onChange={set("notes")}
                rows={5}
                placeholder="Appunti post-call, dettagli sul progetto, prossimi passi…"
              />
            </div>
          </div>

          {/* Storico (sola lettura) */}
          <div className="pynk-crm-drawer-section pynk-crm-drawer-section-muted">
            <p className="pynk-crm-drawer-section-title">Storico</p>
            <div className="pynk-crm-meta-grid">
              <span>Call prenotate</span><strong>{contact.bookings_count}</strong>
              <span>Ultima call</span><strong>{formatDate(contact.last_booking_at)}</strong>
              <span>Sorgente</span><strong>{contact.source}</strong>
              <span>Creato</span><strong>{formatDate(contact.created_at)}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pynk-crm-drawer-footer">
          {error && <p className="pynk-crm-drawer-error">{error}</p>}
          <button type="button" onClick={onClose} className="pynk-admin-btn-outline">Annulla</button>
          <button type="button" onClick={save} disabled={saving} className="pynk-admin-btn-primary">
            {saving ? "Salvo…" : "Salva modifiche"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function PynkCrm() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Contact | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, st: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, status: st });
      const res = await fetch(`/api/admin/pynkstudio/crm?${params}`, { cache: "no-store" });
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => void load(search, statusFilter), search ? 300 : 0);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [load, search, statusFilter]);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSaved = (updated: Contact) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelected(updated);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="pynk-admin-page-title">CRM</h1>
        <p className="pynk-admin-page-subtitle">{total} contatti · aggiornato da ogni prenotazione</p>
      </div>

      {/* Toolbar */}
      <div className="pynk-crm-toolbar">
        <div className="pynk-crm-search-wrap">
          <Search size={15} className="pynk-crm-search-icon" />
          <input
            className="pynk-crm-search"
            placeholder="Cerca per nome, email, azienda, telefono…"
            value={search}
            onChange={onSearchChange}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="pynk-crm-search-clear" aria-label="Cancella">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="pynk-crm-status-tabs">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className="pynk-crm-status-tab"
              data-active={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="pynk-admin-card pynk-crm-table-wrap">
        {loading ? (
          <p className="pynk-crm-empty">Carico…</p>
        ) : contacts.length === 0 ? (
          <p className="pynk-crm-empty">Nessun contatto trovato.</p>
        ) : (
          <table className="pynk-crm-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Azienda</th>
                <th>Stato</th>
                <th>Ultima call</th>
                <th>Call</th>
                <th>Contatti</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="pynk-crm-row" onClick={() => setSelected(c)}>
                  <td>
                    <span className="pynk-crm-row-name">{c.name}</span>
                  </td>
                  <td className="pynk-crm-row-secondary">{c.company ?? <span className="pynk-crm-empty-cell">—</span>}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="pynk-crm-row-secondary">{formatDate(c.last_booking_at)}</td>
                  <td className="pynk-crm-row-secondary">{c.bookings_count}</td>
                  <td className="pynk-crm-row-secondary">
                    <span className="pynk-crm-contacts-cell">
                      <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="pynk-crm-icon-link" aria-label="Chiama"><Phone size={13} /></a>
                      <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="pynk-crm-icon-link" aria-label="Email"><Mail size={13} /></a>
                    </span>
                  </td>
                  <td><ChevronRight size={15} className="pynk-crm-row-chevron" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <Drawer
          contact={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
