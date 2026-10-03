import { requireGestioneSection } from "@/lib/gestione-page";
import { PrintersPanel } from "@/components/gestione/printers-panel";

export default async function GestioneCassaSettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const { access, auth } = await requireGestioneSection(tenantSlug, "checkout");
  const canConfigurePrinters = access.canManagePrintStations && (auth.isDemo || auth.isAdmin);

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Impostazioni</span>
        <h1 className="ga-heading">{access.canManageCheckout ? "Cassa e stampanti" : "Stampanti"}</h1>
        <p className="ga-lead">
          {access.canManageCheckout
            ? "Stampanti di comanda e fiscali della sede. La battuta di cassa si fa dal portale operativo."
            : "Stampanti di comanda della sede: dove escono gli ordini e con quale formato."}
        </p>
      </header>

      {canConfigurePrinters ? (
        <section className="ga-card">
          <PrintersPanel />
        </section>
      ) : (
        <section className="ga-empty">
          {access.canManagePrintStations
            ? "La configurazione delle stampanti è riservata al titolare."
            : "Il modulo stampanti non è attivo: chiedi l'attivazione al supporto."}
        </section>
      )}
    </div>
  );
}
