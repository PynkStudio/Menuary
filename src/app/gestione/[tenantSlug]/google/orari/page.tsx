import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import { getSpecialHours } from "@/lib/data/special-hours";
import { HoursSyncPanel } from "@/components/gestione/google/hours-sync-panel";
import { SpecialHoursEditor } from "@/components/gestione/google/special-hours-editor";
import Link from "next/link";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { DaySchedule } from "@/lib/venue-hours";
import { defaultHoursWeek } from "@/lib/venue-hours";
import { headers } from "next/headers";
import { getGestioneBaseHref, getGestioneModuleAccess } from "@/lib/gestione-routing";

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

export default async function OrariPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant || !getGestioneModuleAccess(tenant.features).canManageReservations) notFound();

  const db = createSupabaseServiceClient();
  const [location, specialHours, tenantRow] = await Promise.all([
    getPrimaryLocation(tenantSlug),
    getSpecialHours(tenantSlug),
    db
      ? db.from("tenants").select("hours").eq("id", tenantSlug).single().then((r) => r.data)
      : Promise.resolve(null),
  ]);

  const hours: DaySchedule[] = (tenantRow?.hours as DaySchedule[] | null) ?? defaultHoursWeek();
  const googleConnected = !!location;
  const googleHref = `${getGestioneBaseHref((await headers()).get("host"), tenant)}/google`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href={googleHref}
          className="rounded-full p-1.5 text-pork-ink/40 hover:text-pork-ink"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <p className="impact-title text-xs text-pork-red">Google Business</p>
          <h1 className="headline text-2xl">Orari</h1>
        </div>
      </div>

      {googleConnected && (
        <div className="flex items-center justify-end">
          <form action="/api/gestione/google/sync-hours" method="POST">
            <input type="hidden" name="tenantId" value={tenantSlug} />
            <input type="hidden" name="mode" value="all" />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              <RefreshCw size={14} />
              Sincronizza tutto su Google
            </button>
          </form>
        </div>
      )}

      {/* Orari settimanali */}
      <section className="rounded-2xl border-2 border-pork-ink/10 bg-white p-6 space-y-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Orario tipo</p>
          <h2 className="headline text-xl">Settimana standard</h2>
          <p className="text-sm text-pork-ink/50 mt-1">
            Questi orari compaiono sulla tua scheda Google Maps ogni settimana.
            {googleConnected && " Dopo la modifica, usa il pulsante Sync per aggiornarli su Google."}
          </p>
        </div>
        <HoursSyncPanel
          tenantId={tenantSlug}
          initialHours={hours}
          googleConnected={googleConnected}
        />
      </section>

      {/* Orari straordinari */}
      <section className="rounded-2xl border-2 border-pork-ink/10 bg-white p-6 space-y-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Eccezioni</p>
          <h2 className="headline text-xl">Orari straordinari</h2>
          <p className="text-sm text-pork-ink/50 mt-1">
            Date specifiche con orario diverso dal solito — aperture/chiusure straordinarie,
            festività, eventi. Vengono pubblicati su Google Maps come «orario speciale».
          </p>
        </div>
        <SpecialHoursEditor tenantId={tenantSlug} initialData={specialHours} />

        {googleConnected && specialHours.some((s) => !s.synced_to_google) && (
          <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
            <p className="text-sm font-semibold text-orange-700">
              Hai orari straordinari non ancora sincronizzati su Google.
            </p>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/gestione/google/sync-hours", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ tenantId: tenantSlug, mode: "special" }),
                });
              }}
              className="rounded-full bg-orange-600 px-4 py-1.5 text-xs font-bold text-white hover:opacity-90"
            >
              Sync ora
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
