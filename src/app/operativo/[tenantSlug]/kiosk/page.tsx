import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";

export default async function OperationalKioskPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant) notFound();

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Operatività</span>
        <h1 className="ga-heading">Kiosk</h1>
        <p className="ga-lead">
          Runtime kiosk sede-aware. Il pairing dei dispositivi resta configurabile da gestione; questa pagina diventerà
          l&apos;entrypoint operativo del kiosk per la sede selezionata.
        </p>
      </header>
      <section className="ga-card">
        <h2 className="ga-section-title">Pairing dispositivo</h2>
        <p className="ga-section-hint" style={{ marginTop: 8 }}>
          Per ora i dispositivi accoppiati continuano a usare il link con codice <code>/k/[code]</code>.
        </p>
      </section>
    </div>
  );
}
