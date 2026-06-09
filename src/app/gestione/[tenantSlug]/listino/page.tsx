import { notFound } from "next/navigation";
import { ValentinaWorksCatalogAdmin } from "@/components/tenants/valentina-orciuoli/admin/works-catalog";
import { getTenantById } from "@/lib/data/tenant";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";

export default async function GestioneListinoPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant) notFound();

  const access = getGestioneModuleAccess(tenant.features);
  if (!access.canManageMenu) notFound();

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
            Il catalogo creative usa il verticale Orpheo e non il menu food.
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
