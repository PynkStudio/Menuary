import type { Metadata } from "next";
import { ReservationPageShell } from "@/components/modules/reservations/reservation-page-shell";

export const metadata: Metadata = {
  title: "Prenota un tavolo",
  description: "Richiedi una prenotazione tavolo online.",
};

export default function ReservationPage() {
  return <ReservationPageShell />;
}
