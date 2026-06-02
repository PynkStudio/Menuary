import type { Metadata } from "next";
import { DocaProductReservationPage } from "@/components/tenants/doca/doca-product-reservation-page";

export const metadata: Metadata = {
  title: "Prenota il tuo ritiro",
  description: "Prenota pane e dolci brasiliani da ritirare da DOCA a Milano Corvetto.",
};

export default function ReservationPage() {
  return <DocaProductReservationPage />;
}
