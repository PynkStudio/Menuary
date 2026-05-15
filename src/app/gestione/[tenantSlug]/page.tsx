import { TENANTS } from "@/lib/tenant-registry";

export default async function GestioneDashboardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">
        Pannello di controllo
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Benvenuto su {tenant?.name}
      </h1>
      <p className="mt-3 max-w-xl opacity-70">
        Da qui gestisci ordini, menu, prenotazioni, staff e fatturazione del tuo locale.
      </p>
    </div>
  );
}
