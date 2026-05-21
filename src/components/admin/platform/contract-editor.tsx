"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Printer,
  RotateCcw,
  FileText,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Download,
} from "lucide-react";
import { PLATFORM_LEADS, PLATFORM_PACKAGES } from "@/lib/platform-admin-data";
import {
  FORNITORE,
  computeYearlyTotal,
  defaultContractData,
  formatEUR,
  paymentMethodLabel,
  type BillingCycle,
  type ContractData,
  type PaymentMethod,
} from "@/lib/contracts/menuary-contract";
import { buildClauses, VESSATORIE_RIF } from "@/lib/contracts/menuary-clauses";
import { buildAttachments } from "@/lib/contracts/menuary-attachments";
import {
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  attachSignedFile,
  getContract,
  linkSubscription,
  markSent,
  saveContract,
  type StoredContract,
} from "@/lib/contracts/contracts-store";
import { upsertSubscriptionFromContract } from "@/lib/contracts/contract-to-subscription";
import { useMailLauncher } from "@/components/admin/inbox/mail-launcher";

type Props = {
  contractId?: string;
};

export function ContractEditor({ contractId }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const launcher = useMailLauncher();

  const [data, setData] = useState<ContractData>(() => defaultContractData());
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [stored, setStored] = useState<StoredContract | null>(null);
  const [leadId, setLeadId] = useState<string>("");
  const [packageSlug, setPackageSlug] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (contractId) {
      const c = getContract(contractId);
      if (c) {
        setStored(c);
        setData(c.data);
        setOverrides(c.clauseOverrides);
        setLeadId(c.leadId ?? "");
        setPackageSlug(c.packageSlug ?? "");
      }
      return;
    }
    const prefillLead = search.get("leadId");
    if (prefillLead) {
      setLeadId(prefillLead);
      applyLead(prefillLead);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const clauses = useMemo(() => buildClauses(data), [data]);
  const attachments = useMemo(() => buildAttachments(data), [data]);
  const annuale = data.economiche.cicloFatturazione === "yearly";
  const totaleAnnuale = computeYearlyTotal(
    data.economiche.canoneMensile,
    data.economiche.scontoAnnuale,
  );

  function applyLead(id: string) {
    if (!id) return;
    const lead = PLATFORM_LEADS.find((l) => l.id === id);
    if (!lead) return;
    setLeadId(id);
    setData((d) => ({
      ...d,
      cliente: {
        ragioneSociale: lead.billing_name ?? lead.business_name,
        legaleRappresentante: lead.contact_name,
        piva: lead.billing_vat ?? "",
        cf: lead.billing_cf ?? "",
        sedeLegale: [
          lead.billing_address ?? lead.address,
          lead.billing_postal_code ?? lead.postal_code,
          lead.billing_city ?? lead.city,
          lead.billing_province ?? lead.province,
        ]
          .filter(Boolean)
          .join(", "),
        pec: lead.billing_pec ?? "",
        email: lead.contact_email,
        telefono: lead.contact_phone ?? "",
        sdi: lead.billing_sdi ?? "",
      },
      servizio: {
        ...d.servizio,
        tenantSlug: lead.business_slug ?? "",
        dominio: lead.official_domain ?? "",
      },
    }));
  }

  function applyPackage(slug: string) {
    setPackageSlug(slug);
    const pkg = PLATFORM_PACKAGES.find((p) => p.slug === slug);
    if (!pkg) return;
    setData((d) => ({
      ...d,
      servizio: { ...d.servizio, pianoNome: pkg.name },
      economiche: { ...d.economiche, canoneMensile: pkg.price_monthly },
    }));
  }

  function handleSave(): StoredContract {
    const saved = saveContract(data, overrides, {
      leadId: leadId || null,
      packageSlug: packageSlug || null,
      id: stored?.id,
    });
    setStored(saved);
    setFeedback("Contratto salvato nello storico");
    if (!stored && saved) router.replace(`/admin/contratti/${saved.id}`);
    return saved;
  }

  function handleSendViaInbox() {
    const saved = stored ?? handleSave();
    const updated = markSent(saved.id);
    if (updated) setStored(updated);

    const lead = leadId ? PLATFORM_LEADS.find((l) => l.id === leadId) : null;
    const dest = lead?.contact_email || data.cliente.email || data.cliente.pec;
    const subject = `Contratto ${data.numero} — ${data.cliente.ragioneSociale || "—"}`;
    const body = buildEmailBody(data);
    setFeedback(
      "Contratto marcato come 'Inviato'. Apri la modale email per completare l'invio.",
    );
    launcher.open({ to: dest || "", subject, body, brand: "menuary" });
  }

  async function handleDownloadPdf(): Promise<Blob | null> {
    setGeneratingPdf(true);
    try {
      const res = await fetch("/api/admin/contracts/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, overrides }),
      });
      if (!res.ok) {
        setFeedback("Errore nella generazione del PDF.");
        return null;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Contratto-${data.numero}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return blob;
    } finally {
      setGeneratingPdf(false);
    }
  }

  function reset() {
    setData(defaultContractData());
    setOverrides({});
    setLeadId("");
    setPackageSlug("");
    setStored(null);
    setFeedback(null);
  }

  function handleUploadSigned(file: File) {
    if (!stored) {
      setFeedback("Prima salva il contratto, poi carica il PDF controfirmato.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const updated = attachSignedFile(stored.id, file.name, dataUrl);
      if (updated) {
        const sub = upsertSubscriptionFromContract(updated);
        linkSubscription(updated.id, sub.id);
        setStored({ ...updated, subscriptionId: sub.id });
        setFeedback(
          `PDF controfirmato caricato. Generato l'abbonamento ${sub.id} (visibile in /admin/abbonamenti).`,
        );
      }
    };
    reader.readAsDataURL(file);
  }

  const statusLabel = stored ? CONTRACT_STATUS_LABELS[stored.status] : "Nuova bozza";
  const statusColor = stored ? CONTRACT_STATUS_COLORS[stored.status] : "bg-gray-100 text-gray-700";

  return (
    <div className="contract-page">
      <style>{CONTRACT_STYLES}</style>

      <aside className="contract-form no-print">
        <div className="contract-back">
          <Link href="/admin/contratti">
            <ArrowLeft size={14} /> Storico contratti
          </Link>
          <span className={`status-pill ${statusColor}`}>{statusLabel}</span>
        </div>

        {feedback && <div className="contract-feedback">{feedback}</div>}

        <h3>Lead</h3>
        <select value={leadId} onChange={(e) => applyLead(e.target.value)}>
          <option value="">— Compila da lead esistente —</option>
          {PLATFORM_LEADS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.business_name}
            </option>
          ))}
        </select>

        <h3>Cliente</h3>
        <label>Ragione sociale</label>
        <input
          value={data.cliente.ragioneSociale}
          onChange={(e) =>
            setData((d) => ({ ...d, cliente: { ...d.cliente, ragioneSociale: e.target.value } }))
          }
        />
        <label>Legale rappresentante</label>
        <input
          value={data.cliente.legaleRappresentante}
          onChange={(e) =>
            setData((d) => ({
              ...d,
              cliente: { ...d.cliente, legaleRappresentante: e.target.value },
            }))
          }
        />
        <div className="row">
          <div>
            <label>P.IVA</label>
            <input
              value={data.cliente.piva}
              onChange={(e) =>
                setData((d) => ({ ...d, cliente: { ...d.cliente, piva: e.target.value } }))
              }
            />
          </div>
          <div>
            <label>C.F.</label>
            <input
              value={data.cliente.cf}
              onChange={(e) =>
                setData((d) => ({ ...d, cliente: { ...d.cliente, cf: e.target.value } }))
              }
            />
          </div>
        </div>
        <label>Sede legale</label>
        <input
          value={data.cliente.sedeLegale}
          onChange={(e) =>
            setData((d) => ({ ...d, cliente: { ...d.cliente, sedeLegale: e.target.value } }))
          }
        />
        <div className="row">
          <div>
            <label>PEC</label>
            <input
              value={data.cliente.pec}
              onChange={(e) =>
                setData((d) => ({ ...d, cliente: { ...d.cliente, pec: e.target.value } }))
              }
            />
          </div>
          <div>
            <label>Email</label>
            <input
              value={data.cliente.email}
              onChange={(e) =>
                setData((d) => ({ ...d, cliente: { ...d.cliente, email: e.target.value } }))
              }
            />
          </div>
        </div>
        <div className="row">
          <div>
            <label>SDI</label>
            <input
              value={data.cliente.sdi}
              onChange={(e) =>
                setData((d) => ({ ...d, cliente: { ...d.cliente, sdi: e.target.value } }))
              }
            />
          </div>
          <div>
            <label>Telefono</label>
            <input
              value={data.cliente.telefono}
              onChange={(e) =>
                setData((d) => ({ ...d, cliente: { ...d.cliente, telefono: e.target.value } }))
              }
            />
          </div>
        </div>

        <h3>Servizio</h3>
        <label>Pacchetto</label>
        <select value={packageSlug} onChange={(e) => applyPackage(e.target.value)}>
          <option value="">— Seleziona piano —</option>
          {PLATFORM_PACKAGES.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name} ({formatEUR(p.price_monthly)}/mese)
            </option>
          ))}
        </select>
        <label>Nome piano (nel contratto)</label>
        <input
          value={data.servizio.pianoNome}
          onChange={(e) =>
            setData((d) => ({ ...d, servizio: { ...d.servizio, pianoNome: e.target.value } }))
          }
        />
        <label>Tenant slug</label>
        <input
          value={data.servizio.tenantSlug}
          onChange={(e) =>
            setData((d) => ({ ...d, servizio: { ...d.servizio, tenantSlug: e.target.value } }))
          }
        />
        <label>Dominio personalizzato</label>
        <input
          value={data.servizio.dominio}
          onChange={(e) =>
            setData((d) => ({ ...d, servizio: { ...d.servizio, dominio: e.target.value } }))
          }
        />

        <h3>Condizioni economiche</h3>
        <label>Ciclo di fatturazione</label>
        <select
          value={data.economiche.cicloFatturazione}
          onChange={(e) =>
            setData((d) => ({
              ...d,
              economiche: {
                ...d.economiche,
                cicloFatturazione: e.target.value as BillingCycle,
              },
            }))
          }
        >
          <option value="monthly">Mensile</option>
          <option value="yearly">Annuale anticipato</option>
        </select>
        <div className="row">
          <div>
            <label>Canone mensile (€)</label>
            <input
              type="number"
              step="0.01"
              value={data.economiche.canoneMensile}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  economiche: { ...d.economiche, canoneMensile: Number(e.target.value) },
                }))
              }
            />
          </div>
          <div>
            <label>Setup una tantum (€)</label>
            <input
              type="number"
              step="0.01"
              value={data.economiche.setup}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  economiche: { ...d.economiche, setup: Number(e.target.value) },
                }))
              }
            />
          </div>
        </div>
        {annuale && (
          <>
            <label>Sconto annuale (%)</label>
            <input
              type="number"
              step="1"
              value={data.economiche.scontoAnnuale}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  economiche: { ...d.economiche, scontoAnnuale: Number(e.target.value) },
                }))
              }
            />
          </>
        )}
        <label>Metodo di pagamento</label>
        <select
          value={data.economiche.metodoPagamento}
          onChange={(e) =>
            setData((d) => ({
              ...d,
              economiche: { ...d.economiche, metodoPagamento: e.target.value as PaymentMethod },
            }))
          }
        >
          <option value="sdd">SDD SEPA</option>
          <option value="bonifico">Bonifico 30gg</option>
          <option value="carta">Carta ricorrente (Stripe)</option>
        </select>

        <h3>Documento</h3>
        <label>Numero contratto</label>
        <input
          value={data.numero}
          onChange={(e) => setData((d) => ({ ...d, numero: e.target.value }))}
        />
        <label>Data stipula</label>
        <input
          type="date"
          value={data.dataStipula}
          onChange={(e) => setData((d) => ({ ...d, dataStipula: e.target.value }))}
        />

        <div className="contract-actions">
          <button type="button" onClick={handleSave}>
            <Save size={14} /> Salva
          </button>
          <button type="button" onClick={handleDownloadPdf} disabled={generatingPdf}>
            <Printer size={14} /> {generatingPdf ? "..." : "PDF"}
          </button>
          <button type="button" className="primary" onClick={handleSendViaInbox}>
            <Send size={14} /> Invia
          </button>
        </div>
        <div className="contract-actions">
          <button type="button" onClick={reset}>
            <RotateCcw size={14} /> Nuovo
          </button>
        </div>

        {stored && (
          <>
            <h3>Controfirma</h3>
            {stored.signedFileDataUrl ? (
              <div className="signed-box">
                <CheckCircle2 size={16} />
                <div>
                  <strong>{stored.signedFileName}</strong>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    Caricato il{" "}
                    {stored.signedAt ? new Date(stored.signedAt).toLocaleString("it-IT") : "—"}
                  </div>
                  <a href={stored.signedFileDataUrl} download={stored.signedFileName ?? "contratto-firmato.pdf"}>
                    <Download size={12} /> Scarica
                  </a>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                  Carica il PDF restituito firmato dal cliente.
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadSigned(f);
                  }}
                />
                {stored.expiresAt && stored.status === "sent" && (
                  <div className="expiry-warning">
                    <AlertTriangle size={12} /> Scadenza firma:{" "}
                    {new Date(stored.expiresAt).toLocaleDateString("it-IT")}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 12, lineHeight: 1.4 }}>
          Le clausole nel documento sono modificabili: clicca un paragrafo per editarlo.
          Il bottone PDF genera un file lato server con grafica vettoriale, allegati e
          numerazione delle pagine.
        </p>
      </aside>

      <article className="contract-doc">
        <header>
          <h1>Contratto di fornitura del servizio Menuary</h1>
          <div className="subtitle">
            Contratto n. {data.numero} — Milano, {data.dataStipula}
          </div>
        </header>

        <div className="parties">
          <div>
            <h4>Fornitore</h4>
            <strong>{FORNITORE.ragioneSociale}</strong>
            <br />
            P.IVA {FORNITORE.piva}
            <br />
            {FORNITORE.indirizzo}
            <br />
            PEC: {FORNITORE.pec}
            <br />
            Legale rappresentante: {FORNITORE.legaleRappresentante}
          </div>
          <div>
            <h4>Cliente</h4>
            <strong>{data.cliente.ragioneSociale || "—"}</strong>
            <br />
            P.IVA {data.cliente.piva || "—"}{" "}
            {data.cliente.cf ? `· C.F. ${data.cliente.cf}` : ""}
            <br />
            {data.cliente.sedeLegale || "—"}
            <br />
            PEC: {data.cliente.pec || "—"}
            <br />
            Legale rappresentante: {data.cliente.legaleRappresentante || "—"}
          </div>
        </div>

        <div className="summary-box">
          <dl>
            <dt>Piano sottoscritto</dt>
            <dd>{data.servizio.pianoNome}</dd>
            <dt>Tenant / dominio</dt>
            <dd>
              {data.servizio.tenantSlug || "—"}
              {data.servizio.dominio ? ` · ${data.servizio.dominio}` : ""}
            </dd>
            <dt>Setup una tantum</dt>
            <dd>{formatEUR(data.economiche.setup)} + IVA</dd>
            <dt>Canone</dt>
            <dd>
              {annuale
                ? `${formatEUR(totaleAnnuale)} + IVA / anno (sconto ${data.economiche.scontoAnnuale}% — equivalente a ${formatEUR(totaleAnnuale / 12)}/mese)`
                : `${formatEUR(data.economiche.canoneMensile)} + IVA / mese`}
            </dd>
            <dt>Modalità di pagamento</dt>
            <dd>{paymentMethodLabel(data.economiche.metodoPagamento)}</dd>
            <dt>Durata</dt>
            <dd>12 mesi con rinnovo tacito · preavviso di recesso 30 giorni</dd>
          </dl>
        </div>

        {clauses.map((c) => (
          <section key={c.id} className="clause">
            <h2>{c.title}</h2>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) =>
                setOverrides((o) => ({ ...o, [c.id]: e.currentTarget.innerText }))
              }
            >
              {overrides[c.id] ?? c.body}
            </div>
          </section>
        ))}

        <div className="vessatorie">
          <strong>
            Approvazione specifica delle clausole vessatorie (artt. 1341 e 1342 c.c.).
          </strong>
          <br />
          Il Cliente, previa attenta lettura, dichiara di approvare specificamente per iscritto le
          clausole di cui agli artt.: {VESSATORIE_RIF.join("; ")}.
        </div>

        <div className="signatures">
          <div>
            <div>Per il Fornitore</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>{FORNITORE.ragioneSociale}</div>
            <div className="sig-line">Timbro e firma</div>
          </div>
          <div>
            <div>Per il Cliente</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>
              {data.cliente.ragioneSociale || "—"}
            </div>
            <div className="sig-line">Timbro e firma</div>
          </div>
        </div>

        <div className="signatures" style={{ marginTop: 24 }}>
          <div>
            <div className="sig-line">
              Firma per accettazione specifica delle clausole vessatorie (Fornitore)
            </div>
          </div>
          <div>
            <div className="sig-line">
              Firma per accettazione specifica delle clausole vessatorie (Cliente)
            </div>
          </div>
        </div>

        {attachments.map((a) => (
          <section key={a.id} className="attachment">
            <div className="page-break" />
            <header>
              <div className="att-code">Allegato {a.code}</div>
              <h2>{a.title}</h2>
              <div className="subtitle">{a.subtitle}</div>
            </header>
            {a.sections.map((s, i) => (
              <div key={i} className="att-section">
                <h3>{s.heading}</h3>
                <p>{s.body}</p>
              </div>
            ))}
            <div className="signatures" style={{ marginTop: 48 }}>
              <div>
                <div className="sig-line">Fornitore</div>
              </div>
              <div>
                <div className="sig-line">Cliente</div>
              </div>
            </div>
          </section>
        ))}

        <p style={{ marginTop: 32, fontSize: 11, color: "#6b7280" }}>
          <FileText size={11} style={{ display: "inline", verticalAlign: "middle" }} /> Il presente
          contratto è composto da {clauses.length} articoli, {attachments.length} allegati e
          dall&apos;approvazione specifica delle clausole vessatorie.
        </p>
      </article>
    </div>
  );
}

function buildEmailBody(data: ContractData): string {
  const annuale = data.economiche.cicloFatturazione === "yearly";
  const totaleAnnuale = computeYearlyTotal(
    data.economiche.canoneMensile,
    data.economiche.scontoAnnuale,
  );
  const canone = annuale
    ? `${formatEUR(totaleAnnuale)} + IVA / anno (sconto ${data.economiche.scontoAnnuale}%)`
    : `${formatEUR(data.economiche.canoneMensile)} + IVA / mese`;
  return `Gentile ${data.cliente.legaleRappresentante || data.cliente.ragioneSociale || "Cliente"},

a seguito dei nostri accordi, in allegato le inviamo il contratto n. ${data.numero} relativo al piano "${data.servizio.pianoNome}" della piattaforma Menuary.

Riepilogo condizioni:
• Piano: ${data.servizio.pianoNome}
• Setup una tantum: ${formatEUR(data.economiche.setup)} + IVA
• Canone: ${canone}
• Durata: 12 mesi con rinnovo tacito (recesso con 30 gg di preavviso)
• Foro competente: Milano

Per attivare il servizio le chiediamo cortesemente di:
1) stampare il contratto e i relativi allegati;
2) firmarlo in ogni pagina, incluso il riquadro di approvazione specifica delle clausole vessatorie (artt. 1341-1342 c.c.) e gli allegati A, B, C, D;
3) restituirlo entro 5 (cinque) giorni lavorativi, scansionato in formato PDF, rispondendo a questa email oppure via PEC a ${FORNITORE.pec}.

Decorso il termine di 5 giorni senza ricezione del contratto controfirmato, la presente proposta si intenderà non accettata e dovrà essere rinnovata.

Per qualsiasi chiarimento siamo a disposizione.

Cordiali saluti,
${FORNITORE.legaleRappresentante}
${FORNITORE.ragioneSociale}`;
}

const CONTRACT_STYLES = `
.contract-page { display: grid; grid-template-columns: 380px 1fr; gap: 24px; padding: 24px; }
.contract-form { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; height: fit-content; position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow-y: auto; }
.contract-form h3 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 16px 0 8px; }
.contract-form h3:first-of-type { margin-top: 12px; }
.contract-form label { display: block; font-size: 12px; color: #374151; margin-bottom: 4px; }
.contract-form input, .contract-form select, .contract-form textarea {
  width: 100%; padding: 6px 8px; font-size: 13px; border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 8px; box-sizing: border-box;
}
.contract-form .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.contract-back { display: flex; align-items: center; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
.contract-back a { display: inline-flex; align-items: center; gap: 4px; color: #2563eb; text-decoration: none; }
.status-pill { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
.contract-feedback { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 8px 10px; border-radius: 6px; font-size: 12px; margin-bottom: 12px; }
.contract-actions { display: flex; gap: 6px; margin-top: 12px; }
.contract-actions button {
  flex: 1; padding: 8px 10px; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; font-size: 12px;
  display: inline-flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer;
}
.contract-actions button.primary { background: #111827; color: #fff; border-color: #111827; }
.signed-box { display: flex; gap: 8px; padding: 10px; border: 1px solid #a7f3d0; background: #ecfdf5; border-radius: 8px; font-size: 12px; color: #065f46; }
.signed-box a { display: inline-flex; align-items: center; gap: 3px; color: #047857; margin-top: 4px; font-size: 11px; }
.expiry-warning { display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; padding: 6px 8px; background: #fef3c7; color: #92400e; border-radius: 6px; font-size: 11px; }
.contract-doc { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 48px; max-width: 820px; }
.contract-doc h1 { font-size: 22px; margin: 0 0 4px; }
.contract-doc .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
.contract-doc .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; font-size: 13px; line-height: 1.5; }
.contract-doc .parties h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin: 0 0 6px; }
.contract-doc .summary-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0 24px; background: #f9fafb; font-size: 13px; }
.contract-doc .summary-box dl { display: grid; grid-template-columns: 220px 1fr; gap: 6px 16px; margin: 0; }
.contract-doc .summary-box dt { color: #6b7280; }
.contract-doc .summary-box dd { margin: 0; font-weight: 500; }
.contract-doc .clause { margin: 20px 0; font-size: 13px; line-height: 1.6; }
.contract-doc .clause h2 { font-size: 14px; font-weight: 700; margin: 0 0 8px; }
.contract-doc .clause [contenteditable="true"] { outline: 1px dashed transparent; padding: 2px 4px; border-radius: 4px; white-space: pre-wrap; }
.contract-doc .clause [contenteditable="true"]:hover { outline-color: #cbd5e1; }
.contract-doc .clause [contenteditable="true"]:focus { outline: 2px solid #2563eb; background: #eff6ff; }
.contract-doc .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 64px; font-size: 13px; }
.contract-doc .signatures .sig-line { border-top: 1px solid #111827; padding-top: 6px; margin-top: 64px; }
.contract-doc .vessatorie { margin-top: 32px; padding: 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 12px; line-height: 1.5; background: #fffbeb; }
.contract-doc .attachment { margin-top: 64px; padding-top: 32px; border-top: 2px solid #111827; }
.contract-doc .attachment .att-code { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
.contract-doc .attachment h2 { font-size: 18px; margin: 0 0 4px; }
.contract-doc .attachment .att-section { margin: 16px 0; font-size: 12.5px; line-height: 1.6; }
.contract-doc .attachment .att-section h3 { font-size: 13px; margin: 0 0 6px; }
.contract-doc .attachment .att-section p { white-space: pre-wrap; margin: 0; }
.page-break { page-break-before: always; }

@media print {
  body * { visibility: hidden; }
  .contract-doc, .contract-doc * { visibility: visible; }
  .contract-page { display: block; padding: 0; }
  .contract-form { display: none !important; }
  .contract-doc { border: none; padding: 0; max-width: none; box-shadow: none; }
  .contract-doc .attachment { page-break-before: always; }
  @page { size: A4; margin: 18mm 16mm; }
}
`;
