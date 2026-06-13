import type { Metadata } from "next";
import { BadgeEuro, TrendingUp, Building2, Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Patrimoniale · PynkStudio Admin",
};

export const dynamic = "force-dynamic";

export default function PynkAdminPatrimonialePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="pynk-admin-page-title">Patrimoniale</h1>
        <p className="pynk-admin-page-subtitle">
          Quadro finanziario complessivo — verticali + attività diretta PynkStudio
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="pynk-admin-kpi-card">
          <div className="pynk-admin-kpi-icon">
            <TrendingUp size={20} />
          </div>
          <p className="pynk-admin-kpi-label">Totale complessivo</p>
          <p className="pynk-admin-kpi-value">—</p>
        </div>
        <div className="pynk-admin-kpi-card">
          <div className="pynk-admin-kpi-icon">
            <Building2 size={20} />
          </div>
          <p className="pynk-admin-kpi-label">Menuary</p>
          <p className="pynk-admin-kpi-value">—</p>
        </div>
        <div className="pynk-admin-kpi-card">
          <div className="pynk-admin-kpi-icon">
            <Building2 size={20} />
          </div>
          <p className="pynk-admin-kpi-label">Bizery</p>
          <p className="pynk-admin-kpi-value">—</p>
        </div>
        <div className="pynk-admin-kpi-card">
          <div className="pynk-admin-kpi-icon">
            <Briefcase size={20} />
          </div>
          <p className="pynk-admin-kpi-label">PynkStudio diretto</p>
          <p className="pynk-admin-kpi-value">—</p>
        </div>
      </div>

      <div className="mt-8 pynk-admin-card flex flex-col items-center justify-center py-16 text-center">
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
