import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Sparkles,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getCountersignedContractByTenant } from "@/lib/contracts/contract-queries";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { isDemoHost } from "@/lib/platform";
import { getTenantDemoControl } from "@/lib/demo-controls";
import { TENANTS } from "@/lib/tenant-registry";
import { getVerticalMeta } from "@/lib/vertical";
import {
  demoBillingPlan,
  demoBillingInvoices,
  type BillingPlan,
  type BillingInvoice,
} from "@/lib/demo-fixtures";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEuroAmount(amount: number) {
  return `€ ${amount.toFixed(2).replace(".", ",")}`;
}

function InvoiceStatusBadge({ status }: { status: BillingInvoice["status"] }) {
  if (status === "paid")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
        <CheckCircle2 size={11} /> Pagata
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-bold text-yellow-700">
        <Clock size={11} /> In attesa
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
      <AlertCircle size={11} /> Fallita
    </span>
  );
}

function PlanBadge({ tier }: { tier: BillingPlan["tier"] }) {
  const colors: Record<BillingPlan["tier"], string> = {
    starter: "bg-pork-ink/10 text-pork-ink/70",
    pro: "bg-pork-mustard text-pork-ink",
    business: "bg-pork-red text-white",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wide ${colors[tier]}`}
    >
      {tier === "business" && <Sparkles size={11} />}
      {tier}
    </span>
  );
}

export default async function FatturazionePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const host = (await headers()).get("host") ?? "";
  const isDemoHostname = isDemoHost(host);

  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();

  const vertical = getVerticalMeta(tenant.vertical);

  let isDemo = isDemoHostname;

  if (!isDemoHostname) {
    const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) notFound();

    const [{ data: sa }, { data: ta }] = await Promise.all([
      supabase
        .from("siteadmin")
        .select("role")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .maybeSingle(),
      supabase
        .from("tenantadmin")
        .select("email")
        .eq("user_id", user.id)
        .eq("tenant_id", tenantSlug)
        .eq("enabled", true)
        .maybeSingle(),
    ]);
    if (!sa && !ta) notFound();
  } else {
    const demoControl = await getTenantDemoControl(tenantSlug).catch(() => null);
    isDemo = !demoControl?.backendLive;
  }

  // Questa pagina non legge ancora la fatturazione reale dal backend: in demo
  // mostriamo sempre la struttura completa con dati esempio.
  const showDemoBilling = isDemoHostname;
  const plan = showDemoBilling ? demoBillingPlan(tenant.vertical) : null;
  const invoices = showDemoBilling ? demoBillingInvoices() : [];

  // Contratto controfirmato reale: disponibile solo fuori dalla demo, quando
  // esiste un contratto in stato "countersigned" legato a questo tenant.
  let signedContract: {
    numero: string;
    countersignedAt: string | null;
    url: string;
  } | null = null;
  if (!isDemoHostname) {
    try {
      const contract = await getCountersignedContractByTenant(tenantSlug);
      if (contract?.signed_document_path) {
        const db = createSupabaseServiceClient();
        const { data: signed } = db
          ? await db.storage
              .from("platform-documents")
              .createSignedUrl(contract.signed_document_path, 3600)
          : { data: null };
        if (signed?.signedUrl) {
          signedContract = {
            numero: contract.numero,
            countersignedAt:
              contract.contract_data?.countersigned?.at ??
              contract.signed_at ??
              null,
            url: signed.signedUrl,
          };
        }
      }
    } catch {
      signedContract = null;
    }
  }

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Amministrazione</span>
        <h1 className="ga-heading">Fatturazione</h1>
        <p className="ga-lead">
          Piano attivo, metodo di pagamento e storico fatture per {tenant.name}.
        </p>
        {showDemoBilling && (
          <span className="ga-section-hint mt-2 inline-block rounded-full bg-pork-mustard/30 px-3 py-1 text-xs font-bold text-pork-ink/70">
            Demo: dati di esempio
          </span>
        )}
      </header>

      {signedContract && (
        <section className="ga-section" aria-labelledby="billing-contract-title">
          <div className="ga-section-head">
            <h2 id="billing-contract-title" className="ga-section-title">
              Contratto
            </h2>
          </div>
          <div className="ga-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">
                  Contratto {signedContract.numero} — controfirmato
                </p>
                {signedContract.countersignedAt && (
                  <p className="text-[11px] text-pork-ink/50">
                    Controfirmato il {formatDate(signedContract.countersignedAt)}
                  </p>
                )}
              </div>
              <a
                href={signedContract.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1 text-xs font-bold text-pork-ink hover:bg-pork-ink hover:text-pork-cream"
              >
                <Download size={12} /> Scarica PDF
              </a>
            </div>
          </div>
        </section>
      )}

      {!plan && !isDemo ? (
        <section className="ga-card">
          <p className="ga-card-hint">
            I dati di fatturazione non sono ancora disponibili. Contatta{" "}
            <a
              href={`mailto:billing@${vertical.marketingDomain}`}
              className="font-bold text-pork-red underline"
            >
              billing@{vertical.marketingDomain}
            </a>{" "}
            per assistenza.
          </p>
        </section>
      ) : (
        plan && (
          <>
            {/* Piano attivo */}
            <section className="ga-section" aria-labelledby="billing-plan-title">
              <div className="ga-section-head">
                <h2 id="billing-plan-title" className="ga-section-title">
                  Piano attivo
                </h2>
                <PlanBadge tier={plan.tier} />
              </div>

              <div className="ga-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="impact-title text-2xl text-pork-ink">{plan.name}</p>
                    <p className="mt-1 text-sm text-pork-ink/60">
                      {formatEuroAmount(plan.monthlyPrice)} / mese · rinnovo il{" "}
                      <strong>{formatDate(plan.nextBillingDate)}</strong>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        plan.status === "active"
                          ? "bg-green-100 text-green-700"
                          : plan.status === "past_due"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {plan.status === "active" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <AlertCircle size={12} />
                      )}
                      {plan.status === "active"
                        ? "Attivo"
                        : plan.status === "past_due"
                          ? "Pagamento in ritardo"
                          : "Cancellato"}
                    </span>
                    <p className="text-[11px] text-pork-ink/40">
                      Prossimo importo:{" "}
                      <strong>{formatEuroAmount(plan.monthlyPrice)}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-pork-ink/10 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pork-ink/50">
                    Moduli inclusi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {plan.includedModules.map((mod) => (
                      <span
                        key={mod}
                        className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-2.5 py-1 text-xs font-semibold text-pork-ink/70"
                      >
                        <CheckCircle2 size={11} className="text-green-600" />
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-pork-ink/10 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-pork-ink/50">
                    Metodo di pagamento
                  </p>
                  <div className="flex items-center gap-3">
                    {plan.paymentMethod.type === "stripe" ? (
                      <>
                        <CreditCard size={20} className="text-pork-ink/40" />
                        <div>
                          <p className="text-sm font-semibold">
                            Carta di credito ···· {plan.paymentMethod.last4}
                          </p>
                          <p className="text-[11px] text-pork-ink/50">
                            Pagamenti automatici via Stripe
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Building2 size={20} className="text-pork-ink/40" />
                        <div>
                          <p className="text-sm font-semibold">
                            Bonifico bancario
                            {plan.paymentMethod.bankName
                              ? ` · ${plan.paymentMethod.bankName}`
                              : ""}
                          </p>
                          <p className="text-[11px] text-pork-ink/50">
                            Fattura inviata via email, pagamento manuale
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-pork-ink/10 pt-4">
                  <button
                    type="button"
                    disabled
                    title="Disponibile a breve"
                    className="rounded-xl bg-pork-ink/5 px-4 py-2 text-sm font-bold text-pork-ink/40 disabled:cursor-not-allowed"
                  >
                    Cambia piano
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Disponibile a breve"
                    className="rounded-xl bg-pork-ink/5 px-4 py-2 text-sm font-bold text-pork-ink/40 disabled:cursor-not-allowed"
                  >
                    Aggiorna metodo di pagamento
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Disponibile a breve"
                    className="rounded-xl bg-pork-ink/5 px-4 py-2 text-sm font-bold text-pork-ink/40 disabled:cursor-not-allowed"
                  >
                    Dati di fatturazione
                  </button>
                </div>
              </div>
            </section>

            {/* Fatture */}
            <section className="ga-section" aria-labelledby="billing-invoices-title">
              <div className="ga-section-head">
                <h2 id="billing-invoices-title" className="ga-section-title">
                  Fatture
                </h2>
                <span className="ga-section-hint">{invoices.length} fatture</span>
              </div>

              {invoices.length === 0 ? (
                <div className="ga-empty">Nessuna fattura disponibile.</div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-pork-ink/10">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b border-pork-ink/10 bg-pork-ink/[0.03]">
                          <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-pork-ink/50">
                            Fattura
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-pork-ink/50">
                            Data
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-pork-ink/50">
                            Importo
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide text-pork-ink/50">
                            Stato
                          </th>
                          <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-wide text-pork-ink/50">
                            PDF
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv, i) => (
                          <tr
                            key={inv.id}
                            className={`border-b border-pork-ink/5 last:border-0 ${
                              i % 2 === 0 ? "bg-white" : "bg-pork-cream/30"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold">{inv.id}</p>
                              <p className="text-[11px] text-pork-ink/50">
                                {inv.description}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-pork-ink/70">
                              {formatDate(inv.date)}
                            </td>
                            <td className="px-4 py-3 font-bold">
                              {formatEuroAmount(inv.amount)}
                            </td>
                            <td className="px-4 py-3">
                              <InvoiceStatusBadge status={inv.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              {inv.pdfUrl ? (
                                <a
                                  href={inv.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1 text-xs font-bold text-pork-ink hover:bg-pork-ink hover:text-pork-cream"
                                >
                                  <Download size={12} /> PDF
                                </a>
                              ) : (
                                <span
                                  className="inline-flex cursor-default items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1 text-xs font-bold text-pork-ink/30"
                                  title="PDF disponibile dopo la conferma del pagamento"
                                >
                                  <Download size={12} /> PDF
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            <section className="ga-card">
              <p className="ga-card-hint">
                Per richieste su fatture, pagamenti o dati fiscali contatta{" "}
                <a
                  href={`mailto:billing@${vertical.marketingDomain}`}
                  className="font-bold text-pork-red underline"
                >
                  billing@{vertical.marketingDomain}
                </a>
                .
              </p>
            </section>
          </>
        )
      )}
    </div>
  );
}
