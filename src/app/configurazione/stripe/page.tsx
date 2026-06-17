import type { Metadata } from "next";
import { AlertTriangle, CreditCard, ShieldCheck } from "lucide-react";
import { buildAuthorizeUrl } from "@/lib/payments/stripe/connect";
import { parseStripeSetupToken, tenantSetupLabel } from "@/lib/payments/stripe/setup-link";
import { findTenantById } from "@/lib/tenant-registry";
import { getVerticalMeta } from "@/lib/vertical";

export const metadata: Metadata = {
  title: "Configurazione Stripe",
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

export default async function StripeConfigurationPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const parsed = token ? parseStripeSetupToken(token) : { valid: false, reason: "missing" };

  if (!parsed.valid || !parsed.payload) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] px-4 py-16 text-[#171411]">
        <section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle size={24} />
          </div>
          <h1 className="mt-6 text-3xl font-black">Link non valido</h1>
          <p className="mt-3 text-sm leading-6 text-black/60">
            Il link di configurazione Stripe e&rsquo; scaduto o non e&rsquo; corretto. Chiedi al team Menuary
            di inviarti un nuovo link.
          </p>
        </section>
      </main>
    );
  }

  const tenant = findTenantById(parsed.payload.tenantId);
  const brand = tenant ? getVerticalMeta(tenant.vertical).productName : "Menuary";
  const tenantName = tenantSetupLabel(parsed.payload.tenantId);
  const authorizeUrl = buildAuthorizeUrl({
    tenantId: parsed.payload.tenantId,
    email: parsed.payload.email ?? undefined,
    redirectPath: "/configurazione/stripe/esito",
  });

  return (
    <main className="min-h-screen bg-[#f7f4ef] px-4 py-16 text-[#171411]">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/10 md:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CreditCard size={24} />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-wide text-black/40">
          Configurazione pagamenti
        </p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Collega Stripe per {tenantName}</h1>
        <p className="mt-4 text-sm leading-7 text-black/62">
          Verrai reindirizzato a Stripe per accedere o creare un account aziendale. Al termine,
          Stripe rimandera&rsquo; a {brand} e abiliteremo i pagamenti online per il tenant.
        </p>

        <div className="mt-6 rounded-xl bg-[#f7f4ef] p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={18} />
            <p className="text-sm leading-6 text-black/60">
              Non gestiamo i numeri di carta e non conserviamo le credenziali del tuo account
              Stripe. Salviamo solo l&rsquo;identificativo tecnico dell&rsquo;account collegato.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={authorizeUrl}
            className="inline-flex items-center justify-center rounded-full bg-[#171411] px-6 py-3 text-sm font-black text-white transition hover:bg-black"
          >
            Collega account Stripe
          </a>
          <a
            href="https://support.stripe.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-black/15 px-6 py-3 text-sm font-black text-black/70 transition hover:border-black/30"
          >
            Aiuto Stripe
          </a>
        </div>
      </section>
    </main>
  );
}
