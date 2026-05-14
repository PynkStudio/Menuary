import type { Metadata } from "next";
import { ClientsRestaurantDataTable } from "@/components/clients/clients-restaurant-data-table";
import { MOCK_SHARED_RESTAURANTS } from "@/lib/clients-mock-data";

export const metadata: Metadata = {
  title: "Dati con i ristoranti",
};

export default function ClientiRistorantiPage() {
  return (
    <div>
      <p className="menuary-section-label">Trasparenza</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">
        Ristoranti con cui hai condiviso dati
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--menuary-muted)]">
        Elenco dei locali che trattano i tuoi dati in qualità di titolari autonomi (es. ordini,
        prenotazioni, profilo alimentare). Puoi richiedere la rimozione: effettueremo
        anonimizzazione ed estrazione pulita dei dati operativi (implementazione backend in
        seguito).
      </p>
      <div className="mt-10">
        <ClientsRestaurantDataTable rows={MOCK_SHARED_RESTAURANTS} />
      </div>
    </div>
  );
}
