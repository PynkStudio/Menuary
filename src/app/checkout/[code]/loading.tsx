import { headers } from "next/headers";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";

// Fallback Suspense mostrato istantaneamente mentre la route force-dynamic
// recupera l'ordine dal DB (token, upsell, account Stripe). Senza questo lo
// schermo resta bianco per tutta la fetch e l'utente pensa che il link sia rotto.
// Usa il tema del tenant per non sembrare un caricamento di una piattaforma terza.
export default async function CheckoutLoading() {
  const h = await headers();
  const tenant = resolveTenantFromHost(h.get("host"));

  const bar = "rgb(var(--tenant-ink) / 0.08)";

  return (
    <div style={tenantThemeCssVars(tenant.theme) as React.CSSProperties} data-tenant-surface={tenant.id}>
      <div
        className="min-h-screen px-4 py-6 sm:py-10"
        style={{
          backgroundColor: "rgb(var(--tenant-cream) / 0.45)",
          backgroundImage: `
            radial-gradient(circle at 18% 0%, rgb(var(--tenant-red) / 0.14), transparent 34rem),
            radial-gradient(circle at 92% 10%, rgb(var(--tenant-mustard) / 0.18), transparent 30rem),
            linear-gradient(180deg, rgb(var(--tenant-cream) / 0.82), rgb(var(--tenant-cream) / 0.38))
          `,
        }}
      >
        <div className="mx-auto max-w-xl animate-pulse">
          <header
            className="rounded-[2rem] p-5 shadow-sm sm:p-6"
            style={{ backgroundColor: "#fff", boxShadow: `0 24px 70px rgb(var(--tenant-ink) / 0.10)` }}
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-2xl" style={{ backgroundColor: bar }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-full" style={{ backgroundColor: bar }} />
                <div className="h-3 w-28 rounded-full" style={{ backgroundColor: bar }} />
              </div>
              <div className="h-10 w-16 rounded-xl" style={{ backgroundColor: bar }} />
            </div>
          </header>

          <div
            className="-mt-4 rounded-[1.75rem] p-5 sm:p-6"
            style={{ backgroundColor: "rgb(var(--tenant-ink))" }}
          >
            <div className="space-y-3 py-1">
              <div className="h-3 w-24 rounded-full" style={{ backgroundColor: "rgb(255 255 255 / 0.14)" }} />
              <div className="h-7 w-48 rounded-xl" style={{ backgroundColor: "rgb(255 255 255 / 0.18)" }} />
              <div className="h-3 w-56 max-w-full rounded-full" style={{ backgroundColor: "rgb(255 255 255 / 0.10)" }} />
              <div className="mt-4 flex items-start gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="h-7 w-7 rounded-full" style={{ backgroundColor: "rgb(255 255 255 / 0.12)" }} />
                    <div className="h-2 w-10 rounded-full" style={{ backgroundColor: "rgb(255 255 255 / 0.10)" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="mt-4 space-y-4 rounded-[1.75rem] p-5"
            style={{ backgroundColor: "#fff", boxShadow: `0 18px 50px rgb(var(--tenant-ink) / 0.08)` }}
          >
            <div className="h-4 w-40 rounded-full" style={{ backgroundColor: bar }} />
            <div className="h-3 w-full rounded-full" style={{ backgroundColor: bar }} />
            <div className="h-3 w-3/4 rounded-full" style={{ backgroundColor: bar }} />
            <div className="h-12 w-full rounded-2xl" style={{ backgroundColor: bar }} />
          </div>
        </div>
      </div>
    </div>
  );
}
