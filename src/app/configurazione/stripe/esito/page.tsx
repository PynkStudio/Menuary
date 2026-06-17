import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { tenantSetupLabel } from "@/lib/payments/stripe/setup-link";

export const metadata: Metadata = {
  title: "Esito configurazione Stripe",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/favicons/menuary/icon.svg", type: "image/svg+xml" }],
    shortcut: "/favicons/menuary/icon.svg",
    apple: [{ url: "/favicons/menuary/apple.png", sizes: "180x180" }],
  },
};

type Props = {
  searchParams: Promise<{
    status?: string;
    tenant?: string;
    reason?: string;
  }>;
};

export default async function StripeConfigurationResultPage({ searchParams }: Props) {
  const p = await searchParams;
  const tenantName = p.tenant ? tenantSetupLabel(p.tenant) : "il tenant";
  const status = p.status;
  const isConnected = status === "connected";
  const isPending = status === "pending";
  const isError = status === "error";
  const Icon = isConnected ? CheckCircle2 : isPending ? Clock : AlertTriangle;

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-4 py-16 text-[#171411]">
      <section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/10">
        <div
          className={
            "flex h-12 w-12 items-center justify-center rounded-full " +
            (isConnected
              ? "bg-emerald-100 text-emerald-700"
              : isPending
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700")
          }
        >
          <Icon size={24} />
        </div>
        <h1 className="mt-6 text-3xl font-black">
          {isConnected
            ? "Stripe collegato"
            : isPending
              ? "Configurazione quasi completa"
              : "Configurazione non completata"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-black/60">
          {isConnected
            ? `L'account Stripe di ${tenantName} e' collegato e pronto a incassare online.`
            : isPending
              ? `L'account Stripe di ${tenantName} e' collegato, ma Stripe richiede ancora alcuni dati prima di abilitare gli incassi.`
              : `Stripe non ha completato il collegamento. ${isError && p.reason ? `Dettaglio: ${p.reason}` : "Puoi richiedere un nuovo link al team Menuary."}`}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-[#171411] px-6 py-3 text-sm font-black text-white transition hover:bg-black"
        >
          Torna al sito
        </Link>
      </section>
    </main>
  );
}
