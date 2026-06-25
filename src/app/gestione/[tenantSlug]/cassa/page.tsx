import { notFound } from "next/navigation";
import { CreditCard, Printer, ReceiptText, Settings2 } from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { PrintersPanel } from "@/components/gestione/printers-panel";

export default async function GestioneCassaSettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();
  const access = getGestioneModuleAccess(tenant.features);
  // La pagina è raggiungibile sia col modulo cassa sia col modulo stampanti.
  if (!access.canManageCheckout && !access.canManagePrintStations) notFound();

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Impostazioni</span>
        <h1 className="ga-heading">Cassa</h1>
        <p className="ga-lead">
          Configura metodi di pagamento, fiscalizzazione, dispositivi e regole operative. La battuta di cassa resta
          nel portale operativo dedicato.
        </p>
      </header>

      <section className="ga-card">
        <div className="ga-section-head">
          <h2 className="ga-section-title">
            <Settings2 size={16} strokeWidth={2.4} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
            Setup cassa
          </h2>
          <span className="ga-section-hint">Fondazione sede-aware</span>
        </div>
        <div className="ga-kpi-grid">
          <div className="ga-kpi">
            <span className="ga-kpi-label">Pagamenti</span>
            <span className="ga-kpi-value" style={{ fontSize: 18 }}>
              <CreditCard size={18} strokeWidth={2.2} /> Metodi
            </span>
          </div>
          <div className="ga-kpi">
            <span className="ga-kpi-label">Stampanti</span>
            <span className="ga-kpi-value" style={{ fontSize: 18 }}>
              <Printer size={18} strokeWidth={2.2} /> Fiscale
            </span>
          </div>
          <div className="ga-kpi">
            <span className="ga-kpi-label">Documenti</span>
            <span className="ga-kpi-value" style={{ fontSize: 18 }}>
              <ReceiptText size={18} strokeWidth={2.2} /> Ricevute
            </span>
          </div>
        </div>
      </section>

      {access.canManagePrintStations && (
        <section className="ga-card">
          <PrintersPanel />
        </section>
      )}
    </div>
  );
}
