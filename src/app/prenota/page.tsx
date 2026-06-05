import type { Metadata } from "next";
import { ReservationRequestForm } from "@/components/modules/reservations/reservation-request-form";

export const metadata: Metadata = {
  title: "Prenota un tavolo",
  description: "Richiedi una prenotazione tavolo online.",
};

export default function ReservationPage() {
  return (
    <div className="bg-pork-cream px-5 py-28 text-pork-ink md:py-36">
      <div className="container-wide">
        <div className="mb-8 max-w-2xl">
          <span className="chip-mustard">Prenotazioni</span>
          <h1 className="headline mt-4 text-5xl sm:text-6xl">
            Richiedi un tavolo.
          </h1>
          <p className="mt-4 text-lg leading-8 text-pork-ink/70">
            Scegli giorno, orario e numero di persone. Lo staff riceve la richiesta
            nel pannello prenotazioni.
          </p>
        </div>
        <div className="max-w-3xl">
          <ReservationRequestForm />
        </div>
      </div>
    </div>
  );
}
