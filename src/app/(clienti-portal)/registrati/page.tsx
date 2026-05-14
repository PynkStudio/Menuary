import type { Metadata } from "next";
import { ClientsRegistrationForm } from "@/components/clients/clients-registration-form";

export const metadata: Metadata = {
  title: "Crea account — Menuary",
};

export default function RegistratiPage() {
  return (
    <div>
      <p className="menuary-section-label">Nuovo account</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">
        Registrati su Menuary
      </h1>
      <p className="mt-3 max-w-xl text-[var(--menuary-muted)]">
        Crea il tuo account gratuito per salvare i preferiti, gestire le prenotazioni e
        tenere traccia dei tuoi ristoranti.
      </p>
      <div className="mt-10">
        <ClientsRegistrationForm />
      </div>
    </div>
  );
}
