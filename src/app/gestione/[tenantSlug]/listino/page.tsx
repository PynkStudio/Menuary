import { requireGestioneSection } from "@/lib/gestione-page";
import { ValentinaWorksCatalogAdmin } from "@/components/tenants/valentina-orciuoli/admin/works-catalog";

export default async function GestioneListinoPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const { tenant } = await requireGestioneSection(tenantSlug, "menu");

  if (tenant.id === "valentina-orciuoli") {
    return <ValentinaWorksCatalogAdmin />;
  }

  if (tenant.vertical === "creative") {
    return (
      <div className="ga-dashboard">
        <header>
          <span className="ga-eyebrow">Catalogo opere</span>
          <h1 className="ga-heading">Opere e progetti</h1>
          <p className="ga-lead">
            Gestisci schede, materiali, crediti e link pubblici delle opere.
          </p>
        </header>
        <section className="ga-empty">
          Configura un editor tenant-specifico per questo profilo creativo.
        </section>
      </div>
    );
  }

  const { default: AdminMenuPage } = await import("@/app/admin/menu/page");
  return <AdminMenuPage />;
}
