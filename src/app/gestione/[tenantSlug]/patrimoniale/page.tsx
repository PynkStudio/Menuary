import { notFound } from "next/navigation";
import { BadgeEuro, TrendingUp, Building2, Briefcase } from "lucide-react";
import { getTenantById } from "@/lib/data/tenant";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";

export const dynamic = "force-dynamic";

export default async function GestionePatrimonialePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  const access = tenant ? getGestioneModuleAccess(tenant.features) : null;
  if (!tenant || !access?.canManagePatrimoniale) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="ga-heading">Patrimoniale</h1>
        <p className="ga-lead">
          Quadro finanziario complessivo — verticali + attività diretta PynkStudio
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ga-kpi">
          <TrendingUp size={20} style={{ opacity: 0.5 }} />
          <span className="ga-kpi-label">Totale complessivo</span>
          <span className="ga-kpi-value" data-empty="true">—</span>
        </div>
        <div className="ga-kpi">
          <Building2 size={20} style={{ opacity: 0.5 }} />
          <span className="ga-kpi-label">Menuary</span>
          <span className="ga-kpi-value" data-empty="true">—</span>
        </div>
        <div className="ga-kpi">
          <Building2 size={20} style={{ opacity: 0.5 }} />
          <span className="ga-kpi-label">Bizery</span>
          <span className="ga-kpi-value" data-empty="true">—</span>
        </div>
        <div className="ga-kpi">
          <Briefcase size={20} style={{ opacity: 0.5 }} />
          <span className="ga-kpi-label">PynkStudio diretto</span>
          <span className="ga-kpi-value" data-empty="true">—</span>
        </div>
      </div>

      <div className="ga-empty mt-8 flex flex-col items-center py-16 text-center">
        <BadgeEuro size={48} className="mb-4 opacity-30" />
        <p className="text-lg font-semibold opacity-60">Dati finanziari</p>
        <p className="mt-1 text-sm opacity-40">
          La vista patrimoniale aggregata è in costruzione. Qui vedrai il riepilogo
          degli introiti dei verticali sommati a quelli diretti di PynkStudio.
        </p>
      </div>
    </div>
  );
}
