import { notFound } from "next/navigation";
import { requireGestioneSection } from "@/lib/gestione-page";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import { getSpecialHours } from "@/lib/data/special-hours";
import { GoogleSyncButton } from "@/components/gestione/google/google-sync-button";
import { HoursSyncPanel } from "@/components/gestione/google/hours-sync-panel";
import { SpecialHoursEditor } from "@/components/gestione/google/special-hours-editor";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { DaySchedule } from "@/lib/venue-hours";
import { defaultHoursWeekForTenant } from "@/lib/venue-hours";
import { headers } from "next/headers";
import { getGestioneBaseHref } from "@/lib/gestione-routing";
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

  const { tenant } = await requireGestioneSection(tenantSlug, "google");

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
    <div className="ga-dashboard">
      <header>
        <Link href={googleHref} className="ga-back-link">
          <ChevronLeft size={14} aria-hidden="true" /> Google Business
        </Link>
        <h1 className="ga-heading">Orari</h1>
        <p className="ga-lead">
          {isMulti
            ? "Ogni sede ha i propri orari: cambia sede dal menu a sinistra per modificarne un'altra."
            : googleConnected
              ? "Gli orari vengono pubblicati sulla scheda Google dopo la sincronizzazione."
              : "Collega Google Business per pubblicare questi orari anche sulla scheda Maps."}
        </p>
      </header>

      {googleConnected && (
        <div>
          <GoogleSyncButton tenantId={tenantSlug} mode="all" label="Sincronizza tutto su Google" />
        </div>
      )}

      <section className="ga-card ga-section">
        <div>
          <h2 className="ga-section-title">
            Settimana standard{activeLocation && isMulti ? ` · ${activeLocation.name}` : ""}
          </h2>
          <p className="ga-card-hint">Gli orari di ogni settimana, mostrati sul sito e ai clienti.</p>
        </div>
        <HoursSyncPanel
          tenantId={tenantSlug}
          locationId={activeLocation?.id}
          initialHours={hours}
          googleConnected={googleConnected}
        />
      </section>

      <section className="ga-card ga-section">
        <div>
          <h2 className="ga-section-title">Orari straordinari</h2>
          <p className="ga-card-hint">
            Date con orario diverso dal solito: aperture o chiusure straordinarie, festività, eventi.
            {googleConnected && " Su Google compaiono come orario speciale."}
          </p>
        </div>
        <SpecialHoursEditor tenantId={tenantSlug} initialData={specialHours} locationId={activeLocation?.id} />

        {googleConnected && specialHours.some((s) => !s.synced_to_google) && (
          <div className="ga-notice" data-tone="warning">
            <span>Alcuni orari straordinari non sono ancora su Google.</span>
            <GoogleSyncButton tenantId={tenantSlug} mode="special" label="Sincronizza ora" variant="ghost" />
          </div>
        )}
      </section>
    </div>
  );
}
