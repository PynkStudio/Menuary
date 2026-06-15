import type {
  PlatformLead,
  PlatformPayment,
  PlatformSubscription,
} from "@/lib/platform-crm-types";

export type NextActionTone = "red" | "amber" | "green" | "info" | "neutral";

export type NextLeadAction = {
  label: string;
  detail: string;
  tone: NextActionTone;
  /** Link suggerito per agire (relativo all'admin). */
  href?: string;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00Z`).getTime();
  const b = new Date(`${toISO}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Prossima azione consigliata per un lead, derivata dallo stato reale.
 * `subscription`/`payments` sono opzionali: senza, calcola solo la pipeline
 * commerciale (uso in lista). Con, copre anche pagamento/attivazione/rinnovo.
 * Priorità: urgenze cliente (pagamenti/sospensione) prima della pipeline.
 */
export function nextLeadAction(
  lead: PlatformLead,
  subscription?: PlatformSubscription | null,
  payments?: PlatformPayment[],
): NextLeadAction {
  const today = todayISO();

  // ─── Urgenze lato cliente ──────────────────────────────────────────────────
  if (subscription) {
    if (subscription.status === "suspended") {
      return {
        label: "Recupera il pagamento",
        detail: "Tenant sospeso per mancato pagamento: il sito è offline finché non rientra l'importo.",
        tone: "red",
        href: `/admin/crm/${lead.id}`,
      };
    }

    const pending = (payments ?? []).filter((p) => p.status === "pending");
    const overdue = pending.find((p) => p.due_date && p.due_date < today);
    if (overdue) {
      return {
        label: "Sollecita il pagamento scaduto",
        detail: `Pagamento di ${formatAmount(overdue.amount)} scaduto il ${formatDate(overdue.due_date!)}.`,
        tone: "red",
        href: `/admin/crm/${lead.id}`,
      };
    }

    if (subscription.status === "pending_payment") {
      const next = pending[0];
      const due = next?.due_date ?? subscription.grace_until;
      return {
        label: "In attesa del pagamento",
        detail: due
          ? `Contratto firmato. Pagamento atteso entro il ${formatDate(due)} (${daysBetween(today, due)}gg).`
          : "Contratto firmato, in attesa del primo pagamento.",
        tone: "amber",
        href: `/admin/crm/${lead.id}`,
      };
    }

    if (subscription.status === "active") {
      const renew = subscription.next_renewal_at;
      const days = renew ? daysBetween(today, renew) : null;
      return {
        label: "Cliente attivo",
        detail: renew
          ? `Prossimo rinnovo il ${formatDate(renew)}${days !== null && days <= 7 ? ` (${days}gg)` : ""}.`
          : "Abbonamento attivo.",
        tone: days !== null && days <= 7 ? "amber" : "green",
        href: `/admin/crm/${lead.id}`,
      };
    }
  }

  // ─── Esiti terminali ────────────────────────────────────────────────────────
  if (lead.status === "churned") {
    return { label: "Cliente cessato", detail: "Recesso registrato. Valuta un'azione di win-back.", tone: "neutral" };
  }
  if (lead.status === "lost" || lead.stage === "lost") {
    return { label: "Lead perso", detail: "Non convertito. Nessuna azione richiesta.", tone: "neutral" };
  }

  // ─── Pipeline commerciale ─────────────────────────────────────────────────────
  const hasProposal = Boolean(lead.proposed_package_slug);
  switch (lead.stage) {
    case "new":
    case "contacted":
      return { label: "Contatta e qualifica", detail: "Verifica interesse, attività e referente.", tone: "info" };
    case "qualified":
      return hasProposal
        ? { label: "Crea la demo", detail: "Proposta definita: prepara la demo per il tenant.", tone: "info" }
        : { label: "Definisci la proposta", detail: "Scegli pacchetto, add-on e condizioni nel tab Proposta.", tone: "info", href: `/admin/crm/${lead.id}` };
    case "demo":
      return lead.demo_url
        ? { label: "Mostra la demo", detail: "Demo pronta: presentala e raccogli il feedback.", tone: "info" }
        : { label: "Prepara la demo", detail: "Crea la demo a partire dalla proposta.", tone: "info" };
    case "proposal":
      return {
        label: "Crea il contratto",
        detail: hasProposal ? "Genera il contratto pre-compilato dalla proposta." : "Definisci prima la proposta, poi crea il contratto.",
        tone: "info",
        href: `/admin/contratti/nuovo?leadId=${lead.id}`,
      };
    case "contract":
      return { label: "Invia il contratto per la firma", detail: "Apri il contratto e invialo via Documenso.", tone: "info" };
    case "tenant":
      return { label: "Completa l'attivazione", detail: "Genera/attiva il tenant sul dominio indicato.", tone: "info", href: `/admin/crm/${lead.id}` };
    default:
      return { label: "Lavora il lead", detail: "Avanza la pipeline commerciale.", tone: "info" };
  }
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

export const NEXT_ACTION_TONE_CLASSES: Record<NextActionTone, string> = {
  red: "bg-pork-red/10 text-pork-red ring-pork-red/20",
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  green: "bg-pork-green/15 text-pork-green ring-pork-green/20",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  neutral: "bg-pork-ink/5 text-pork-ink/55 ring-pork-ink/10",
};
