import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import { getSpecialHours } from "@/lib/data/special-hours";
import { HoursSyncPanel } from "@/components/gestione/google/hours-sync-panel";
import { SpecialHoursEditor } from "@/components/gestione/google/special-hours-editor";
import Link from "next/link";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { DaySchedule } from "@/lib/venue-hours";
import { defaultHoursWeekForTenant } from "@/lib/venue-hours";
import { headers } from "next/headers";
import { getGestioneBaseHref, getGestioneModuleAccess } from "@/lib/gestione-routing";
import { getActiveGestioneLocation } from "@/lib/gestione-location";

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

type LocationRow = {
  id: string;
  slug: string;
  name: string;
  is_default: boolean;
  hours: unknown;
};

export default async function OrariPage({ params }: Props) {
  const { tenantSlug } = await params;

  const tenant = await getTenantById(tenantSlug);
  if (!tenant || !getGestioneModuleAccess(tenant.features).canManageReservations) notFound();

  const db = createSupabaseServiceClient();
  if (!db) notFound();

  // Sedi del tenant (ordinate default-first). locations.hours dalla
  // migrazione 20260526: cast finché i tipi non vengono rigenerati.
  const { data: locationsRaw } = (await db
    .from("locations")
    .select("id,slug,name,is_default,hours" as never)
    .eq("tenant_id", tenantSlug)
    .order("is_default", { ascending: false })
    .order("name")) as { data: LocationRow[] | null };

  const locations: LocationRow[] = locationsRaw ?? [];

  const selectedLocation = await getActiveGestioneLocation(tenantSlug);
  const activeLocation = selectedLocation
    ? locations.find((location) => location.id === selectedLocation.id)
    : undefined;

  // Fallback orari: location.hours → tenants.hours → default
  let hours: DaySchedule[] = [];
  if (activeLocation) {
    const locHours = activeLocation.hours as DaySchedule[] | null;
    if (locHours?.length) hours = locHours;
  }
  if (hours.length === 0) {
    const { data: tenantRow } = await db
      .from("tenants")
      .select("hours")
      .eq("id", tenantSlug)
      .single();
    const tHours = tenantRow?.hours as DaySchedule[] | null;
    hours = tHours?.length ? tHours : defaultHoursWeekForTenant(tenantSlug);
  }

  const [googleLoc, specialHours] = await Promise.all([
    getPrimaryLocation(tenantSlug, activeLocation?.id),
    getSpecialHours(tenantSlug, activeLocation?.id),
  ]);
  const googleConnected = !!googleLoc;
  const googleHref = `${getGestioneBaseHref((await headers()).get("host"), tenant)}/google`;
  const isMulti = locations.length > 1;

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
          <h2 className="headline text-xl">
            Settimana standard{activeLocation && isMulti ? ` · ${activeLocation.name}` : ""}
          </h2>
          <p className="text-sm text-pork-ink/50 mt-1">
            {isMulti
              ? "Ogni sede ha i propri orari. Cambia sede in alto per modificare un'altra."
              : "Questi orari compaiono sulla tua scheda Google Maps ogni settimana."}
            {googleConnected && " Dopo la modifica, usa il pulsante Sync per aggiornarli su Google."}
          </p>
        </div>
        <HoursSyncPanel
          tenantId={tenantSlug}
          locationId={activeLocation?.id}
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
        <SpecialHoursEditor
          tenantId={tenantSlug}
          initialData={specialHours}
          locationId={activeLocation?.id}
        />

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
