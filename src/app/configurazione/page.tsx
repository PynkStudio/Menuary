import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CreditCard, Link2, PlugZap } from "lucide-react";
import { buildAuthorizeUrl } from "@/lib/payments/stripe/connect";
import { parseStripeSetupToken, tenantSetupLabel } from "@/lib/payments/stripe/setup-link";

export const metadata: Metadata = {
  title: "Configurazione tenant - Menuary",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/favicons/menuary/icon.svg", type: "image/svg+xml" }],
    shortcut: "/favicons/menuary/icon.svg",
    apple: [{ url: "/favicons/menuary/apple.png", sizes: "180x180" }],
  },
};

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function TenantConfigurationPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const parsed = token ? parseStripeSetupToken(token) : { valid: false, reason: "missing" };

  if (!parsed.valid || !parsed.payload) {
    return (
      <ConfigShell>
        <section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-[#18231f]/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle size={24} />
          </div>
          <h1 className="mt-6 text-3xl font-black">Link non valido</h1>
          <p className="mt-3 text-sm leading-6 text-[#5f6b63]">
            Il link di configurazione e&rsquo; scaduto o non e&rsquo; corretto. Chiedi al team Menuary di inviarti un nuovo link.
          </p>
        </section>
      </ConfigShell>
    );
  }

  const tenantName = tenantSetupLabel(parsed.payload.tenantId);
  const modules = parsed.payload.modules;
  const stripeUrl = buildAuthorizeUrl({
    tenantId: parsed.payload.tenantId,
    email: parsed.payload.email ?? undefined,
    redirectPath: "/configurazione/esito",
  });

  return (
    <ConfigShell>
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-[#18231f]/10 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a95f45]">Menuary setup</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#18231f] md:text-4xl">
          Configurazione di {tenantName}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f6b63]">
          Completa i collegamenti richiesti per attivare le funzioni del tenant. Ogni provider gestisce le proprie credenziali:
          Menuary salva solo i riferimenti tecnici necessari al funzionamento.
        </p>

        <div className="mt-8 grid gap-3">
          {modules.includes("stripe") && (
            <SetupCard
              icon={<CreditCard size={22} />}
              title="Pagamenti Stripe"
              description="Collega un account Stripe aziendale per ricevere pagamenti online sul conto del tenant."
              actionHref={stripeUrl}
              actionLabel="Collega Stripe"
            />
          )}
          {modules.includes("hubrise") && (
            <SetupCard
              icon={<PlugZap size={22} />}
              title="HubRise"
              description="Il collegamento HubRise sara' disponibile qui appena abilitato per il tenant."
              disabled
              actionLabel="In arrivo"
            />
          )}
          {!modules.length && (
            <SetupCard
              icon={<CheckCircle2 size={22} />}
              title="Nessuna azione richiesta"
              description="Tutte le configurazioni richieste risultano gia' completate o non sono piu' necessarie."
              disabled
              actionLabel="Completato"
            />
          )}
        </div>
      </section>
    </ConfigShell>
  );
}

function ConfigShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f6f1e8] px-4 py-16 text-[#18231f]">
      <div className="mx-auto mb-8 max-w-3xl">
        <div className="inline-flex items-center gap-2 text-2xl font-black tracking-tight">
          menuary<span className="text-[#a95f45]">.</span>
        </div>
      </div>
      {children}
    </main>
  );
}

function SetupCard({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel: string;
  disabled?: boolean;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-[#18231f]/10 bg-[#fbfaf7] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#18231f] text-white">
          {icon}
        </div>
        <div>
          <h2 className="font-black text-[#18231f]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#5f6b63]">{description}</p>
        </div>
      </div>
      {actionHref && !disabled ? (
        <a
          href={actionHref}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#18231f] px-5 py-2.5 text-sm font-black text-white transition hover:bg-black"
        >
          <Link2 size={15} />
          {actionLabel}
        </a>
      ) : (
        <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#18231f]/15 px-5 py-2.5 text-sm font-black text-[#5f6b63]">
          {actionLabel}
        </span>
      )}
    </article>
  );
}
