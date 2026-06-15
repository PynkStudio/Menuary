"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
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
  X,
} from "lucide-react";
import { PLATFORM_PACKAGES } from "@/lib/platform-admin-data";
import type { PlatformLead } from "@/lib/platform-crm-types";
import {
  BRAND_INFO,
  BRAND_PREFIX,
  FORNITORE,
  MAX_SETUP_RATE,
  clientName,
  clientTaxDetails,
  computeFirstPaymentTotal,
  computeRecurringPaymentTotal,
  computeYearlyTotal,
  contractPaymentDescription,
  defaultContractData,
  formatEUR,
  isIndividualClient,
  normalizeContractData,
  paymentMethodLabel,
  round2,
  setupRateTotal,
  splitSetupEvenly,
  taxSuffix,
  MARCA_BOLLO,
  type BillingCycle,
  type ContractBrand,
  type ContractClientType,
  type ContractData,
  type PaymentMethod,
} from "@/lib/contracts/menuary-contract";
import { buildClauses, VESSATORIE_RIF } from "@/lib/contracts/menuary-clauses";
import { buildAttachments } from "@/lib/contracts/menuary-attachments";
import {
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  type StoredContract,
} from "@/lib/contracts/contracts-store";
import { useDraftPersistence } from "@/lib/hooks/use-draft-persistence";

type ServerContract = {
  id: string;
  numero: string;
  brand: string;
  status: string;
  lead_id: string | null;
  package_slug: string | null;
  contract_data: ContractData;
  clause_overrides: Record<string, string>;
  documenso_envelope_id: string | null;
  signing_url: string | null;
  signed_at: string | null;
  signed_document_path: string | null;
  payment_method: string | null;
  payment_status: string;
  paid_at: string | null;
  tenant_id: string | null;
  tenant_activated_at: string | null;
  sent_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  contractId?: string;
};

export function ContractEditor({ contractId }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const prefillLeadId = search.get("leadId");

  const [data, setData] = useState<ContractData>(() => defaultContractData());
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [stored, setStored] = useState<StoredContract | null>(null);
  const [serverContract, setServerContract] = useState<ServerContract | null>(null);
  const [leads, setLeads] = useState<PlatformLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string>("");
  const [packageSlug, setPackageSlug] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendPreviewOpen, setSendPreviewOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [countersigning, setCountersigning] = useState(false);
  const [syncing, setSyncing] = useState(false);

  type ContractDraft = { data: ContractData; overrides: Record<string, string> };
  const draftKey = `draft:contract:${contractId ?? "new"}`;
  const contractDraft = useDraftPersistence<ContractDraft>(draftKey, {
    serverUpdatedAt: serverContract?.updated_at ?? stored?.updatedAt,
  });
  const loadedRef = useRef(false);

  const isDirty = useMemo(() => {
    if (!loadedRef.current) return false;
    if (serverContract) {
      return JSON.stringify(data) !== JSON.stringify(serverContract.contract_data) ||
        JSON.stringify(overrides) !== JSON.stringify(serverContract.clause_overrides);
    }
    if (stored) return JSON.stringify(data) !== JSON.stringify(stored.data) || JSON.stringify(overrides) !== JSON.stringify(stored.clauseOverrides);
    return !!(data.cliente.ragioneSociale || data.cliente.email || data.cliente.piva);
  }, [data, overrides, stored, serverContract]);
  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    if (!sendPreviewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sendPreviewOpen]);

  useEffect(() => {
    if (contractId) {
      // Load from server
      fetch(`/api/admin/contracts?id=${contractId}`, { cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) return;
          const { contract } = await res.json() as { contract: ServerContract };
          if (!contract) return;
          setServerContract(contract);
          const normalizedData = normalizeContractData({
            ...contract.contract_data,
            brand: contract.contract_data.brand ?? "menuary",
            economiche: {
              ...contract.contract_data.economiche,
              setupRateale: contract.contract_data.economiche.setupRateale ?? false,
              setupRate: contract.contract_data.economiche.setupRate ?? [contract.contract_data.economiche.setup],
            },
          });
          setData(normalizedData);
          setOverrides(contract.clause_overrides ?? {});
          setLeadId(contract.lead_id ?? "");
          setPackageSlug(contract.package_slug ?? "");
        })
        .catch(() => {})
        .finally(() => { loadedRef.current = true; });
      return;
    }
    if (prefillLeadId) setLeadId(prefillLeadId);
    loadedRef.current = true;
  }, [contractId, prefillLeadId]);

  useEffect(() => {
    let active = true;
    setLoadingLeads(true);
    setLeadsError(null);
    fetch("/api/admin/leads?scope=contracts", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          leads?: PlatformLead[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Impossibile caricare i lead del CRM.");
        }
        if (!active) return;
        const crmLeads = payload.leads ?? [];
        setLeads(crmLeads);
        if (!contractId && prefillLeadId) applyLead(prefillLeadId, crmLeads);
      })
      .catch((error) => {
        if (active) {
          setLeadsError(
            error instanceof Error ? error.message : "Impossibile caricare i lead del CRM.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingLeads(false);
      });
    return () => {
      active = false;
    };
    // applyLead legge solo lo stato corrente del form; il caricamento va eseguito una volta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId, prefillLeadId]);

  // Salva bozza ad ogni modifica utente (salta il primo ciclo = caricamento iniziale)
  const skipFirstSaveRef = useRef(true);
  useEffect(() => {
    if (skipFirstSaveRef.current) {
      skipFirstSaveRef.current = false;
      return;
    }
    if (loadedRef.current) contractDraft.saveDraft({ data, overrides });
    // contractDraft.saveDraft è stabile, data/overrides sono le dipendenze rilevanti
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, overrides]);

  const clauses = useMemo(() => buildClauses(data), [data]);
  const attachments = useMemo(() => buildAttachments(data), [data]);
  const annuale = data.economiche.cicloFatturazione === "yearly";
  const totaleAnnuale = computeYearlyTotal(
    data.economiche.canoneMensile,
    data.economiche.scontoAnnuale,
  );
  const firstPayment = computeFirstPaymentTotal(data.economiche);
  const recurringPayment = computeRecurringPaymentTotal(data.economiche);
  const paymentDescription = contractPaymentDescription(data);
  const selectedPkg = PLATFORM_PACKAGES.find((p) => p.slug === packageSlug);
  const defaultSetup = selectedPkg?.setup_amount;
  const setupDiscountPct =
    defaultSetup && data.economiche.setup < defaultSetup
      ? Math.round((1 - data.economiche.setup / defaultSetup) * 100)
      : 0;

  function applyLead(id: string, source = leads) {
    if (!id) return;
    const lead = source.find((item) => item.id === id);
    if (!lead) return;
    setLeadId(id);
    const inferredBrand: ContractBrand =
      lead.business_vertical === "creative"
        ? "orpheo"
        : lead.business_vertical === "services"
          ? "bizery"
          : "menuary";

    // Proposta commerciale del lead → pre-compila pacchetto ed economiche.
    const proposedPkg = lead.proposed_package_slug
      ? PLATFORM_PACKAGES.find((p) => p.slug === lead.proposed_package_slug)
      : undefined;
    if (lead.proposed_package_slug) setPackageSlug(lead.proposed_package_slug);

    setData((d) => {
      const cycle = lead.proposed_billing_cycle ?? d.economiche.cicloFatturazione;
      const recurring = lead.proposed_recurring_amount;
      // Il contratto modella un canone mensile base; il canone effettivo concordato
      // (multi-sede + addon inclusi) viene riportato in mensile-equivalente.
      const canoneMensile =
        recurring != null
          ? cycle === "yearly"
            ? round2(recurring / 12)
            : recurring
          : proposedPkg?.price_monthly ?? d.economiche.canoneMensile;
      const setup = lead.proposed_setup_amount ?? proposedPkg?.setup_amount ?? d.economiche.setup;

      return {
        ...d,
        brand: inferredBrand,
        cliente: {
          tipo: lead.billing_cf && !lead.billing_vat ? "individual" : d.cliente.tipo,
          ragioneSociale: lead.billing_name ?? lead.business_name,
          legaleRappresentante: lead.contact_name ?? "",
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
          email: lead.contact_email ?? "",
          telefono: lead.contact_phone ?? "",
          sdi: lead.billing_sdi ?? "",
        },
        servizio: {
          ...d.servizio,
          tenantSlug: lead.business_slug ?? "",
          dominio: lead.official_domain ?? "",
          pianoNome: proposedPkg?.name ?? d.servizio.pianoNome,
        },
        economiche: {
          ...d.economiche,
          cicloFatturazione: cycle,
          canoneMensile,
          setup,
          setupRate: [setup],
          // Lo sconto annuale è già incluso nel canone concordato → azzerato per non riapplicarlo.
          scontoAnnuale: recurring != null ? 0 : d.economiche.scontoAnnuale,
        },
      };
    });
  }

  function applyPackage(slug: string) {
    setPackageSlug(slug);
    const pkg = PLATFORM_PACKAGES.find((p) => p.slug === slug);
    if (!pkg) return;
    setData((d) => ({
      ...d,
      servizio: { ...d.servizio, pianoNome: pkg.name },
      economiche: {
        ...d.economiche,
        canoneMensile: pkg.price_monthly,
        setup: pkg.setup_amount ?? d.economiche.setup,
        setupRate: pkg.setup_amount ? [pkg.setup_amount] : d.economiche.setupRate,
        scontoAnnuale:
          d.economiche.cicloFatturazione === "yearly"
            ? (pkg.annual_discount_pct ?? d.economiche.scontoAnnuale)
            : 0,
      },
    }));
  }

  async function handleSave(): Promise<ServerContract | null> {
    try {
      let result: ServerContract;
      if (serverContract) {
        const res = await fetch("/api/admin/contracts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: serverContract.id,
            contract_data: data,
            clause_overrides: overrides,
            lead_id: leadId || null,
            package_slug: packageSlug || null,
            numero: data.numero,
            brand: data.brand,
          }),
        });
        if (!res.ok) {
          setFeedback("Errore nel salvataggio");
          return null;
        }
        const { contract } = await res.json() as { contract: ServerContract };
        result = contract;
      } else {
        const res = await fetch("/api/admin/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data,
            overrides,
            leadId: leadId || null,
            packageSlug: packageSlug || null,
          }),
        });
        if (!res.ok) {
          setFeedback("Errore nella creazione del contratto");
          return null;
        }
        const { contract } = await res.json() as { contract: ServerContract };
        result = contract;
      }
      setServerContract(result);
      contractDraft.clearDraft();
      setFeedback("Contratto salvato");
      if (!serverContract && result) router.replace(`/admin/contratti/${result.id}`);
      return result;
    } catch {
      setFeedback("Errore di rete nel salvataggio");
      return null;
    }
  }

  function validateRate(): string | null {
    if (!data.economiche.setupRateale) return null;
    const sum = setupRateTotal(data.economiche.setupRate);
    const delta = round2(sum - data.economiche.setup);
    if (Math.abs(delta) >= 0.005) {
      return `Le rate del setup non coincidono col totale (${formatEUR(sum)} vs ${formatEUR(data.economiche.setup)}, differenza ${formatEUR(delta)}).`;
    }
    return null;
  }

  function openSendPreview() {
    const rateErr = validateRate();
    if (rateErr) {
      setFeedback(rateErr);
      return;
    }
    if (!data.cliente.email && !data.cliente.pec) {
      setFeedback("Inserisci l'email o la PEC del cliente prima dell'invio.");
      return;
    }
    setSendError(null);
    setSendPreviewOpen(true);
  }

  async function handleSendViaDocumenso() {
    setSending(true);
    setSendError(null);
    setFeedback("Salvo, genero il PDF, carico su Documenso e invio la mail…");
    try {
      // Save first
      let contract = serverContract;
      if (!contract) {
        contract = await handleSave();
        if (!contract) return;
      } else if (isDirty) {
        contract = await handleSave();
        if (!contract) return;
      }

      const res = await fetch("/api/admin/contracts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: contract.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore sconosciuto" })) as { error?: string };
        const message = `Errore: ${err.error ?? res.statusText}`;
        setFeedback(message);
        setSendError(message);
        return;
      }

      const result = await res.json() as {
        contract: ServerContract;
        signingUrl: string | null;
        emailSent: boolean;
      };
      setServerContract(result.contract);
      setFeedback(
        result.emailSent
          ? `Contratto inviato con link firma elettronica.${result.signingUrl ? "" : " (Link firma non disponibile)"}`
          : "Contratto caricato su Documenso ma errore nell'invio email.",
      );
      if (result.emailSent) {
        setSendPreviewOpen(false);
        router.push('/admin/contratti');
      } else {
        setSendError("Il contratto è stato caricato su Documenso, ma l'email non è stata inviata.");
      }
    } catch {
      const message = "Errore di rete nell'invio del contratto.";
      setFeedback(message);
      setSendError(message);
    } finally {
      setSending(false);
    }
  }

  async function handleCountersign() {
    if (!serverContract) return;
    if (!window.confirm("Confermi la controfirma del contratto? Il PDF firmato verrà scaricato da Documenso e salvato come controfirmato.")) return;
    setCountersigning(true);
    try {
      const res = await fetch("/api/admin/contracts/countersign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: serverContract.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore" })) as { error?: string };
        setFeedback(`Errore: ${err.error}`);
        return;
      }
      const { contract } = await res.json() as { contract: ServerContract };
      setServerContract(contract);
      setData(normalizeContractData(contract.contract_data));
      setFeedback("Contratto controfirmato con successo.");
      window.dispatchEvent(new Event("contracts:refresh"));
    } catch {
      setFeedback("Errore di rete nella controfirma.");
    } finally {
      setCountersigning(false);
    }
  }

  async function handleConfirmPayment() {
    if (!serverContract) return;
    if (!window.confirm("Confermi la ricezione del pagamento per questo contratto?")) return;
    setConfirmingPayment(true);
    try {
      const res = await fetch("/api/admin/contracts/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: serverContract.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore" })) as { error?: string };
        setFeedback(`Errore: ${err.error}`);
        return;
      }
      const { contract } = await res.json() as { contract: ServerContract };
      setServerContract(contract);
      setFeedback("Pagamento confermato. Tenant attivato.");
    } catch {
      setFeedback("Errore di rete nella conferma pagamento.");
    } finally {
      setConfirmingPayment(false);
    }
  }

  async function handleSyncDocumenso() {
    if (!serverContract) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/contracts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: serverContract.id }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: "Errore" }))) as { error?: string };
        setFeedback(`Errore: ${err.error}`);
        return;
      }
      const { contract, synced, envelopeStatus } = (await res.json()) as {
        contract: ServerContract;
        synced: boolean;
        envelopeStatus: string;
      };
      setServerContract(contract);
      if (synced) {
        setData(normalizeContractData(contract.contract_data));
        setFeedback("Stato sincronizzato: contratto firmato.");
        window.dispatchEvent(new Event("contracts:refresh"));
      } else {
        setFeedback(`Nessuna modifica. Stato Documenso: ${envelopeStatus}`);
      }
    } catch {
      setFeedback("Errore di rete nella sincronizzazione.");
    } finally {
      setSyncing(false);
    }
  }

  function handleDownloadSigned() {
    if (!serverContract?.signed_document_path) return;
    const link = document.createElement("a");
    link.href = `/api/admin/contracts/download-signed?id=${serverContract.id}`;
    link.download = `Firmato-${serverContract.numero}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handleDownloadPdf(): Promise<Blob | null> {
    const rateErr = validateRate();
    if (rateErr) {
      setFeedback(rateErr);
      return null;
    }
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
    setServerContract(null);
    setFeedback(null);
  }

  const effectiveStatus = (serverContract?.status ?? stored?.status ?? "draft") as keyof typeof CONTRACT_STATUS_LABELS;
  const statusLabel = CONTRACT_STATUS_LABELS[effectiveStatus] ?? "Nuova bozza";
  const statusColor = CONTRACT_STATUS_COLORS[effectiveStatus] ?? "bg-gray-100 text-gray-700";
  const individualClient = isIndividualClient(data);
  const availablePackages = PLATFORM_PACKAGES.filter(
    (pkg) =>
      BRAND_INFO[data.brand].vertical === "creative"
        ? pkg.vertical === "creative"
        : pkg.vertical === "both" || pkg.vertical === BRAND_INFO[data.brand].vertical,
  );
  const filteredLeads = leads.filter(
    (lead) => lead.business_vertical === BRAND_INFO[data.brand].vertical,
  );

  function selectBrand(brand: ContractBrand) {
    const selectedLead = leads.find((lead) => lead.id === leadId);
    if (selectedLead && selectedLead.business_vertical !== BRAND_INFO[brand].vertical) {
      setLeadId("");
    }
    setData((current) => {
      const prefix = BRAND_PREFIX[brand];
      const oldPrefix = BRAND_PREFIX[current.brand];
      const numero = current.numero.startsWith(oldPrefix)
        ? `${prefix}${current.numero.slice(oldPrefix.length)}`
        : current.numero;
      return { ...current, brand, numero };
    });
  }

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

        {contractDraft.draftDate && (
          <div className="contract-feedback" style={{ background: "#fffbeb", borderColor: "#f59e0b", color: "#92400e" }}>
            <span style={{ fontSize: 13 }}>
              Bozza non salvata del{" "}
              {contractDraft.draftDate.toLocaleDateString("it-IT", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
            <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
              <button type="button" onClick={() => contractDraft.clearDraft()}
                style={{ fontSize: 12, fontWeight: 700, color: "#92400e", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Ignora
              </button>
              <button type="button"
                onClick={() => {
                  const d = contractDraft.readDraft();
                  if (d) { setData(normalizeContractData(d.data)); setOverrides(d.overrides); contractDraft.clearDraft(); }
                }}
                style={{ fontSize: 12, fontWeight: 700, background: "#92400e", color: "#fff", border: "none", borderRadius: 999, padding: "3px 10px", cursor: "pointer" }}>
                Recupera modifiche
              </button>
            </div>
          </div>
        )}

        {feedback && <div className="contract-feedback">{feedback}</div>}

        <h3>Brand</h3>
        <div className="brand-picker">
          {(Object.keys(BRAND_INFO) as ContractBrand[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => selectBrand(b)}
              className={data.brand === b ? "brand-pill active" : "brand-pill"}
            >
              {BRAND_INFO[b].label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 12px" }}>
          Verticale {BRAND_INFO[data.brand].vertical}
        </p>

        <h3>Lead</h3>
        <select
          value={leadId}
          onChange={(e) => {
            setLeadId(e.target.value);
            applyLead(e.target.value);
          }}
          disabled={loadingLeads}
        >
          <option value="">
            {loadingLeads
              ? "Caricamento lead CRM…"
              : `— Lead ${BRAND_INFO[data.brand].label} —`}
          </option>
          {filteredLeads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.business_name}
            </option>
          ))}
        </select>
        {leadsError && (
          <p className="contract-field-error">
            {leadsError}
          </p>
        )}

        <h3>Cliente</h3>
        <label>Tipo cliente</label>
        <select
          value={data.cliente.tipo}
          onChange={(e) =>
            setData((d) => ({
              ...d,
              cliente: {
                ...d.cliente,
                tipo: e.target.value as ContractClientType,
                piva: e.target.value === "individual" ? "" : d.cliente.piva,
                legaleRappresentante:
                  e.target.value === "individual" ? "" : d.cliente.legaleRappresentante,
                sdi: e.target.value === "individual" ? "" : d.cliente.sdi,
              },
            }))
          }
        >
          <option value="business">Azienda / professionista con P.IVA</option>
          <option value="individual">Persona fisica senza P.IVA</option>
        </select>
        <label>{individualClient ? "Nome e cognome" : "Ragione sociale"}</label>
        <input
          value={data.cliente.ragioneSociale}
          onChange={(e) =>
            setData((d) => ({ ...d, cliente: { ...d.cliente, ragioneSociale: e.target.value } }))
          }
        />
        {!individualClient && (
          <>
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
          </>
        )}
        <div className={individualClient ? "" : "row"}>
          {!individualClient && (
            <div>
            <label>P.IVA</label>
            <input
              value={data.cliente.piva}
              onChange={(e) =>
                setData((d) => ({ ...d, cliente: { ...d.cliente, piva: e.target.value } }))
              }
            />
          </div>
          )}
          <div>
            <label>Codice fiscale</label>
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
        <div className={individualClient ? "" : "row"}>
          {!individualClient && (
            <div>
              <label>SDI</label>
              <input
                value={data.cliente.sdi}
                onChange={(e) =>
                  setData((d) => ({ ...d, cliente: { ...d.cliente, sdi: e.target.value } }))
                }
              />
            </div>
          )}
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
          {availablePackages.map((p) => (
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
          onChange={(e) => {
            const next = e.target.value as BillingCycle;
            setData((d) => {
              const pkg = PLATFORM_PACKAGES.find((p) => p.slug === packageSlug);
              return {
                ...d,
                economiche: {
                  ...d.economiche,
                  cicloFatturazione: next,
                  scontoAnnuale:
                    next === "yearly"
                      ? (pkg?.annual_discount_pct ?? d.economiche.scontoAnnuale)
                      : 0,
                },
              };
            });
          }}
        >
          <option value="monthly">Mensile</option>
          <option value="yearly">Annuale anticipato</option>
        </select>
        <div className="row">
          <div>
            <label>Canone mensile (€)</label>
            <LocalizedMoneyInput
              value={data.economiche.canoneMensile}
              onValueChange={(value) =>
                setData((d) => ({
                  ...d,
                  economiche: { ...d.economiche, canoneMensile: value },
                }))
              }
            />
          </div>
          <div>
            <label>Setup una tantum (€)</label>
            <LocalizedMoneyInput
              value={data.economiche.setup}
              onValueChange={(value) => {
                setData((d) => ({
                  ...d,
                  economiche: {
                    ...d.economiche,
                    setup: value,
                    setupRate: d.economiche.setupRateale
                      ? splitSetupEvenly(value, d.economiche.setupRate.length)
                      : [value],
                  },
                }));
              }}
            />
          </div>
        </div>

        <label className="rate-toggle">
          <input
            type="checkbox"
            checked={data.economiche.setupRateale}
            onChange={(e) => {
              const enabled = e.target.checked;
              setData((d) => ({
                ...d,
                economiche: {
                  ...d.economiche,
                  setupRateale: enabled,
                  setupRate: enabled
                    ? splitSetupEvenly(d.economiche.setup, 3)
                    : [d.economiche.setup],
                },
              }));
            }}
          />
          Rateizza setup (fino a {MAX_SETUP_RATE} mensilità)
        </label>

        {data.economiche.setupRateale && (
          <div className="rate-box">
            <label>Numero rate</label>
            <select
              value={data.economiche.setupRate.length}
              onChange={(e) => {
                const count = Number(e.target.value);
                setData((d) => ({
                  ...d,
                  economiche: {
                    ...d.economiche,
                    setupRate: splitSetupEvenly(d.economiche.setup, count),
                  },
                }));
              }}
            >
              {Array.from({ length: MAX_SETUP_RATE - 1 }, (_, i) => i + 2).map((n) => (
                <option key={n} value={n}>
                  {n} rate
                </option>
              ))}
            </select>

            <div className="rate-list">
              {data.economiche.setupRate.map((rata, i) => (
                <div key={i} className="rate-row">
                  <span>Rata {i + 1}</span>
                  <LocalizedMoneyInput
                    value={rata}
                    onValueChange={(value) => {
                      setData((d) => ({
                        ...d,
                        economiche: {
                          ...d.economiche,
                          setupRate: d.economiche.setupRate.map((r, idx) =>
                            idx === i ? value : r,
                          ),
                        },
                      }));
                    }}
                  />
                </div>
              ))}
            </div>

            {(() => {
              const sum = setupRateTotal(data.economiche.setupRate);
              const target = round2(data.economiche.setup);
              const delta = round2(sum - target);
              const ok = Math.abs(delta) < 0.005;
              return (
                <div className={ok ? "rate-check ok" : "rate-check err"}>
                  <strong>
                    Totale rate: {formatEUR(sum)} / {formatEUR(target)}
                  </strong>
                  {!ok && (
                    <span>
                      Differenza: {delta > 0 ? "+" : ""}
                      {formatEUR(delta)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setData((d) => ({
                        ...d,
                        economiche: {
                          ...d.economiche,
                          setupRate: splitSetupEvenly(
                            d.economiche.setup,
                            d.economiche.setupRate.length,
                          ),
                        },
                      }))
                    }
                  >
                    Suddividi automaticamente
                  </button>
                </div>
              );
            })()}
          </div>
        )}
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
          <option value="bunq">Link di pagamento Bunq</option>
          <option value="bonifico">Bonifico 30gg</option>
          <option value="carta">Carta ricorrente (Stripe)</option>
        </select>
        <label className="rate-toggle">
          <input
            type="checkbox"
            checked={data.economiche.esenzioneIva}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                economiche: { ...d.economiche, esenzioneIva: e.target.checked },
              }))
            }
          />
          Regime forfettario (€2 marca da bollo, poi rivalsa INPS 4% sul totale)
        </label>

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
          <button
            type="button"
            className="primary"
            onClick={openSendPreview}
            disabled={sending || effectiveStatus === "sent" || effectiveStatus === "signed" || effectiveStatus === "countersigned"}
          >
            <Send size={14} /> {sending ? "Invio in corso…" : "Invia con firma elettronica"}
          </button>
        </div>
        <div className="contract-actions">
          <button type="button" onClick={reset}>
            <RotateCcw size={14} /> Nuovo
          </button>
        </div>

        {serverContract && (
          <>
            {/* Signing status */}
            {effectiveStatus === "sent" && (
              <div style={{ marginTop: 12 }}>
                <h3>Firma elettronica</h3>
                <div style={{ fontSize: 12, padding: "8px 10px", background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 6, color: "#1e40af" }}>
                  <Send size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                  In attesa di firma del cliente
                  {serverContract.expires_at && (
                    <span style={{ display: "block", fontSize: 11, marginTop: 4, color: "#3b82f6" }}>
                      Scadenza: {new Date(serverContract.expires_at).toLocaleDateString("it-IT")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSyncDocumenso}
                    disabled={syncing}
                    style={{
                      display: "block", marginTop: 8, padding: "6px 12px",
                      background: "#1e40af", color: "#fff", border: "none",
                      borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    {syncing ? "Controllo…" : "Controlla stato su Documenso"}
                  </button>
                </div>
              </div>
            )}

            {/* Signed status */}
            {effectiveStatus === "signed" && (
              <div style={{ marginTop: 12 }}>
                <h3>Firma elettronica</h3>
                <div className="signed-box">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong>Contratto firmato dal cliente</strong>
                    {serverContract.signed_at && (
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        Firmato il {new Date(serverContract.signed_at).toLocaleString("it-IT")}
                      </div>
                    )}
                    {serverContract.signed_document_path ? (
                      <button
                        type="button"
                        onClick={handleDownloadSigned}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
                          padding: "4px 10px", background: "#047857", color: "#fff", border: "none",
                          borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        <Download size={12} /> Scarica PDF firmato
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSyncDocumenso}
                        disabled={syncing}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
                          padding: "4px 10px", background: "#1e40af", color: "#fff", border: "none",
                          borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        <RotateCcw size={12} /> {syncing ? "Recupero…" : "Recupera PDF firmato"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCountersign}
                      disabled={countersigning}
                      style={{
                        display: "block", marginTop: 8, padding: "6px 12px",
                        background: "#1d4ed8", color: "#fff", border: "none",
                        borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      <CheckCircle2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                      {countersigning ? "Controfirmo…" : "Controfirma"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Countersigned status */}
            {effectiveStatus === "countersigned" && (
              <div style={{ marginTop: 12 }}>
                <h3>Firma elettronica</h3>
                <div className="signed-box">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong>Contratto controfirmato</strong>
                    {serverContract.signed_at && (
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        Firmato dal cliente il {new Date(serverContract.signed_at).toLocaleString("it-IT")}
                      </div>
                    )}
                    {data.countersigned?.at && (
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                        Controfirmato da {data.countersigned.by} il {new Date(data.countersigned.at).toLocaleString("it-IT")}
                      </div>
                    )}
                    {serverContract.signed_document_path && (
                      <button
                        type="button"
                        onClick={handleDownloadSigned}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
                          padding: "4px 10px", background: "#047857", color: "#fff", border: "none",
                          borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        <Download size={12} /> Scarica PDF firmato
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment status */}
            {effectiveStatus === "signed" && serverContract.payment_status !== "paid" && (
              <div style={{ marginTop: 12 }}>
                <h3>Pagamento</h3>
                {serverContract.payment_method === "carta" ? (
                  <div style={{ fontSize: 12, padding: "8px 10px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, color: "#92400e" }}>
                    <AlertTriangle size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    Link checkout Stripe inviato al cliente. In attesa di pagamento.
                  </div>
                ) : (
                  <div style={{ fontSize: 12, padding: "8px 10px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, color: "#92400e" }}>
                    <AlertTriangle size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    In attesa di bonifico
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={confirmingPayment}
                      style={{
                        display: "block", marginTop: 8, padding: "6px 12px",
                        background: "#065f46", color: "#fff", border: "none",
                        borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      <CheckCircle2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                      {confirmingPayment ? "Confermo…" : "Conferma ricezione pagamento"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Payment confirmed */}
            {serverContract.payment_status === "paid" && (
              <div style={{ marginTop: 12 }}>
                <h3>Pagamento</h3>
                <div className="signed-box">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong>Pagamento confermato</strong>
                    {serverContract.paid_at && (
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {new Date(serverContract.paid_at).toLocaleString("it-IT")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tenant activation */}
            {serverContract.tenant_activated_at && (
              <div style={{ marginTop: 12 }}>
                <h3>Attivazione</h3>
                <div className="signed-box">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong>Tenant attivato: {serverContract.tenant_id}</strong>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      {new Date(serverContract.tenant_activated_at).toLocaleString("it-IT")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 12, lineHeight: 1.4 }}>
          Le clausole nel documento sono modificabili: clicca un paragrafo per editarlo.
          Il bottone PDF genera un file lato server con grafica vettoriale, allegati e
          numerazione delle pagine. L&apos;invio carica il contratto su Documenso per la
          firma elettronica e invia l&apos;email al cliente.
        </p>
      </aside>

      <article className="contract-doc">
        <header>
          <div className={`brand-badge brand-badge-${data.brand}`}>
            {BRAND_INFO[data.brand].platformName}
          </div>
          <h1>Contratto di fornitura del servizio {BRAND_INFO[data.brand].platformName}</h1>
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
            <strong>{clientName(data)}</strong>
            <br />
            {clientTaxDetails(data)}
            <br />
            {data.cliente.sedeLegale || "—"}
            <br />
            {data.cliente.pec
              ? `PEC: ${data.cliente.pec}`
              : `Email: ${data.cliente.email || "—"}`}
            {!individualClient && (
              <>
                <br />
                Legale rappresentante: {data.cliente.legaleRappresentante || "—"}
              </>
            )}
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
            <dd>
              {formatEUR(data.economiche.setup)} {taxSuffix(data.economiche)}
              {setupDiscountPct > 0 && (
                <span style={{ color: "#059669", fontWeight: 600, marginLeft: 6 }}>
                  (sconto {setupDiscountPct}%)
                </span>
              )}
              {data.economiche.setupRateale && data.economiche.setupRate.length > 1 ? (
                <span style={{ display: "block", color: "#6b7280", fontWeight: 400, fontSize: 11 }}>
                  Rateizzato in {data.economiche.setupRate.length} mensilità:{" "}
                  {data.economiche.setupRate.map((r) => formatEUR(r)).join(" + ")}
                </span>
              ) : null}
            </dd>
            <dt>Canone</dt>
            <dd>
              {annuale
                ? data.economiche.scontoAnnuale > 0
                  ? `${formatEUR(totaleAnnuale)} ${taxSuffix(data.economiche)} / anno (sconto ${data.economiche.scontoAnnuale}% — equivalente a ${formatEUR(totaleAnnuale / 12)}/mese)`
                  : `${formatEUR(totaleAnnuale)} ${taxSuffix(data.economiche)} / anno`
                : `${formatEUR(data.economiche.canoneMensile)} ${taxSuffix(data.economiche)} / mese`}
            </dd>
            {data.economiche.esenzioneIva && (
              <>
                <dt>Marca da bollo</dt>
                <dd>
                  {formatEUR(MARCA_BOLLO)} — applicata una sola volta per fattura
                </dd>
              </>
            )}
            <dt>Modalità di pagamento</dt>
            <dd>{paymentMethodLabel(data.economiche.metodoPagamento)}</dd>
            {(data.economiche.metodoPagamento === "bonifico" || data.economiche.metodoPagamento === "bunq") && (
              <>
                {data.economiche.metodoPagamento === "bonifico" && (
                  <>
                    <dt>IBAN</dt>
                    <dd>{FORNITORE.iban} — Massimo Pernozzoli</dd>
                  </>
                )}
                <dt>Causale</dt>
                <dd>{paymentDescription}</dd>
                <dt>Primo pagamento complessivo</dt>
                <dd>{formatEUR(firstPayment)}</dd>
                <dt>Pagamenti successivi complessivi</dt>
                <dd>{formatEUR(recurringPayment)} / {annuale ? "anno" : "mese"}</dd>
              </>
            )}
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
              {clientName(data)}
            </div>
            <div className="sig-line">{individualClient ? "Firma" : "Timbro e firma"}</div>
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

      {sendPreviewOpen &&
        createPortal(
          <div
            className="contract-send-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contract-send-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !sending) setSendPreviewOpen(false);
            }}
          >
            <div className="contract-send-dialog">
              <div className="contract-send-header">
                <div>
                  <h2 id="contract-send-title">Anteprima messaggio</h2>
                  <p>Controlla i dati prima di creare la richiesta di firma.</p>
                </div>
                <button
                  type="button"
                  aria-label="Chiudi anteprima"
                  onClick={() => setSendPreviewOpen(false)}
                  disabled={sending}
                >
                  <X size={18} />
                </button>
              </div>

              <dl className="contract-send-meta">
                <dt>A</dt>
                <dd>{data.cliente.email || data.cliente.pec}</dd>
                <dt>Oggetto</dt>
                <dd>
                  Contratto {data.numero} {BRAND_INFO[data.brand].platformName} —{" "}
                  {data.cliente.ragioneSociale || "—"}
                </dd>
                <dt>Allegato</dt>
                <dd>Contratto-{data.numero}.pdf</dd>
              </dl>

              <div className="contract-send-message">
                <p>
                  Gentile{" "}
                  {(!individualClient ? data.cliente.legaleRappresentante?.trim() : "") ||
                    data.cliente.ragioneSociale?.trim() ||
                    "Cliente"},
                </p>
                <p>
                  come da accordi intercorsi, le inviamo la proposta contrattuale n.{" "}
                  <strong>{data.numero}</strong> per l&apos;attivazione del servizio{" "}
                  <strong>{data.servizio.pianoNome}</strong> sulla piattaforma{" "}
                  {BRAND_INFO[data.brand].platformName}.
                </p>
                <div className="contract-send-sign-placeholder">
                  Firma il contratto elettronicamente
                </div>
                <p>
                  Il messaggio includerà il riepilogo economico, il link Documenso e la copia PDF
                  completa del contratto.
                </p>
              </div>

              {sendError && <div className="contract-send-error">{sendError}</div>}

              <div className="contract-send-actions">
                <button
                  type="button"
                  onClick={() => setSendPreviewOpen(false)}
                  disabled={sending}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={handleSendViaDocumenso}
                  disabled={sending}
                >
                  <Send size={14} />
                  {sending ? "Invio in corso…" : "Crea firma e invia"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function LocalizedMoneyInput({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(() => String(value).replace(".", ","));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setDraft(String(value).replace(".", ","));
  }, [value]);

  function commit(raw: string) {
    const parsed = Number(raw.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onValueChange(round2(parsed));
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onChange={(event) => {
        const next = event.target.value;
        if (!/^\d*(?:[.,]\d{0,2})?$/.test(next)) return;
        setDraft(next);
        if (next && !/[.,]$/.test(next)) commit(next);
      }}
      onBlur={() => {
        focusedRef.current = false;
        const parsed = Number(draft.replace(",", "."));
        if (Number.isFinite(parsed) && parsed >= 0) {
          const normalized = round2(parsed);
          onValueChange(normalized);
          setDraft(String(normalized).replace(".", ","));
        } else {
          setDraft(String(value).replace(".", ","));
        }
      }}
    />
  );
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
.contract-field-error { margin: -2px 0 8px; color: #b91c1c; font-size: 11px; line-height: 1.4; }
.contract-form .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.brand-picker { display: inline-flex; padding: 3px; gap: 3px; border-radius: 999px; background: #f3f4f6; margin-bottom: 4px; }
.brand-picker .brand-pill { border: none; padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; cursor: pointer; background: transparent; color: #6b7280; }
.brand-picker .brand-pill.active { background: #fff; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
.rate-toggle { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #374151; margin-bottom: 8px !important; cursor: pointer; }
.rate-toggle input { width: auto !important; margin: 0 !important; }
.rate-box { border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 8px; padding: 10px; margin-bottom: 12px; }
.rate-list { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; }
.rate-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #6b7280; }
.rate-row span { width: 48px; flex-shrink: 0; }
.rate-row input { margin: 0 !important; }
.rate-check { display: flex; flex-direction: column; gap: 4px; padding: 8px; border-radius: 6px; font-size: 11px; }
.rate-check.ok { background: #ecfdf5; color: #065f46; }
.rate-check.err { background: #fef2f2; color: #991b1b; }
.rate-check button { align-self: flex-start; margin-top: 2px; padding: 3px 8px; border-radius: 4px; border: 1px solid currentColor; background: transparent; color: inherit; font-size: 11px; cursor: pointer; }
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
.contract-actions button:disabled { cursor: not-allowed; opacity: 0.45; }
.signed-box { display: flex; gap: 8px; padding: 10px; border: 1px solid #a7f3d0; background: #ecfdf5; border-radius: 8px; font-size: 12px; color: #065f46; }
.signed-box a { display: inline-flex; align-items: center; gap: 3px; color: #047857; margin-top: 4px; font-size: 11px; }
.expiry-warning { display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; padding: 6px 8px; background: #fef3c7; color: #92400e; border-radius: 6px; font-size: 11px; }
.contract-doc { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 48px; max-width: 820px; }
.contract-doc h1 { font-size: 22px; margin: 0 0 4px; }
.brand-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 8px; }
.brand-badge-menuary { background: #fef3c7; color: #92400e; }
.brand-badge-bizery { background: #dbeafe; color: #1e40af; }
.brand-badge-orpheo { background: #fae8ff; color: #86198f; }
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
.contract-send-modal { position: fixed; inset: 0; z-index: 80; display: flex; min-height: 100dvh; align-items: center; justify-content: center; padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left)); background: rgba(17, 24, 39, 0.55); backdrop-filter: blur(3px); }
.contract-send-dialog { width: min(640px, 100%); max-height: calc(100dvh - 40px); overflow-y: auto; border-radius: 16px; background: #fff; box-shadow: 0 24px 70px rgba(17, 24, 39, 0.28); }
.contract-send-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px; border-bottom: 1px solid #e5e7eb; }
.contract-send-header h2 { margin: 0; font-size: 18px; }
.contract-send-header p { margin: 4px 0 0; color: #6b7280; font-size: 12px; }
.contract-send-header button { display: inline-flex; align-items: center; justify-content: center; padding: 7px; border: 0; border-radius: 999px; background: #f3f4f6; color: #374151; cursor: pointer; }
.contract-send-meta { display: grid; grid-template-columns: 72px 1fr; gap: 8px 14px; margin: 0; padding: 18px 22px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
.contract-send-meta dt { color: #6b7280; }
.contract-send-meta dd { margin: 0; overflow-wrap: anywhere; font-weight: 600; }
.contract-send-message { margin: 18px 22px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; color: #374151; font-size: 13px; line-height: 1.6; }
.contract-send-message p { margin: 0 0 14px; }
.contract-send-message p:last-child { margin-bottom: 0; }
.contract-send-sign-placeholder { width: fit-content; margin: 18px auto; padding: 11px 20px; border-radius: 8px; background: #111827; color: #fff; font-weight: 700; text-align: center; }
.contract-send-error { margin: 0 22px 18px; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #b91c1c; font-size: 12px; }
.contract-send-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 0 22px 22px; }
.contract-send-actions button { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 9px 14px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; color: #374151; font-size: 12px; font-weight: 600; cursor: pointer; }
.contract-send-actions button.primary { border-color: #111827; background: #111827; color: #fff; }
.contract-send-actions button:disabled, .contract-send-header button:disabled { cursor: not-allowed; opacity: 0.5; }

@media (max-width: 768px) {
  .contract-page { grid-template-columns: 1fr; gap: 16px; padding: 12px; }
  .contract-form { position: static; max-height: none; }
  .contract-doc { padding: 20px; }
  .contract-doc .parties { grid-template-columns: 1fr; gap: 16px; }
  .contract-doc .summary-box dl { grid-template-columns: 1fr; gap: 2px 0; }
  .contract-doc .summary-box dt { color: #6b7280; font-size: 11px; margin-top: 8px; }
  .contract-doc .signatures { grid-template-columns: 1fr; gap: 24px; margin-top: 32px; }
  .contract-doc .signatures .sig-line { margin-top: 32px; }
  .contract-actions button { font-size: 11px; padding: 7px 6px; }
}

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
