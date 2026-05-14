import type { Metadata } from "next";
import { ClientsPasswordRecoveryForm } from "@/components/clients/clients-password-recovery-form";

export const metadata: Metadata = {
  title: "Recupera password — Menuary",
};

export default async function RecuperaPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  const showNewPassword = step === "nuova-password";

  return (
    <div>
      <p className="menuary-section-label">Account</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">
        {showNewPassword ? "Scegli una nuova password" : "Recupera la password"}
      </h1>
      <p className="mt-3 max-w-xl text-[var(--menuary-muted)]">
        {showNewPassword
          ? "Inserisci la nuova password per il tuo account Menuary."
          : "Inserisci la tua email: ti invieremo un link per reimpostare la password."}
      </p>
      <div className="mt-10">
        <ClientsPasswordRecoveryForm showNewPassword={showNewPassword} />
      </div>
    </div>
  );
}
