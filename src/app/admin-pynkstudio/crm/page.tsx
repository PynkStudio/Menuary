import type { Metadata } from "next";
import { FolderKanban, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Progetti · PynkStudio Admin",
};

export const dynamic = "force-dynamic";

export default function PynkAdminCrmPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="pynk-admin-page-title">Progetti</h1>
          <p className="pynk-admin-page-subtitle">
            CRM progetti PynkStudio — indipendenti dai verticali
          </p>
        </div>
        <button className="pynk-admin-btn-primary" disabled>
          <Plus size={16} />
          Nuovo progetto
        </button>
      </div>

      <div className="pynk-admin-card flex flex-col items-center justify-center py-20 text-center">
        <FolderKanban size={48} className="mb-4 opacity-30" />
        <p className="text-lg font-semibold opacity-60">Nessun progetto</p>
        <p className="mt-1 text-sm opacity-40">
          I progetti PynkStudio appariranno qui. Questa sezione è in costruzione.
        </p>
      </div>
    </div>
  );
}
