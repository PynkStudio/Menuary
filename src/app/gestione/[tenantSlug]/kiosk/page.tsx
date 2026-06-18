import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  MonitorSmartphone, RefreshCw, Trash2, Power, PowerOff, Copy, Wifi, WifiOff, Plus,
} from "lucide-react";
import { getTenantById } from "@/lib/data/tenant";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { fetchLocations } from "@/lib/location";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import {
  createKioskDevice,
  toggleKioskDevice,
  deleteKioskDevice,
  regeneratePairingCode,
  updateKioskConfig,
  type KioskConfig,
} from "./actions";
import { demoKiosks } from "@/lib/demo-fixtures";
import { getGestioneTranslations, interpolate, type GestioneMessages } from "@/i18n/gestione";
import { getActiveGestioneLocation } from "@/lib/gestione-location";

type DeviceRow = {
  id: string;
  name: string;
  location_id: string | null;
  pairing_code: string;
  device_token: string | null;
  enabled: boolean;
  paired_at: string | null;
  last_seen_at: string | null;
  config: KioskConfig;
};

async function fetchKiosks(tenantSlug: string, locationId: string): Promise<{
  devices: DeviceRow[];
  locations: { id: string; name: string; slug: string }[];
}> {
  const svc = createSupabaseServiceClient();
  if (!svc) return { devices: [], locations: [] };

  const host = (await headers()).get("host") ?? "";
  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
  const locations = await fetchLocations(supabase, tenantSlug);

  const { data: devices } = await svc
    .from("kiosk_devices")
    .select("id, name, location_id, pairing_code, device_token, enabled, paired_at, last_seen_at, config")
    .eq("tenant_id", tenantSlug)
    .eq("location_id", locationId)
    .order("created_at", { ascending: true });

  return {
    devices: (devices ?? []) as DeviceRow[],
    locations: locations.map((l) => ({ id: l.id, name: l.name, slug: l.slug })),
  };
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 90_000;
}

function lastSeenLabel(lastSeen: string | null, t: GestioneMessages["kiosk"]): string {
  if (!lastSeen) return t.neverConnected;
  const ms = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return t.now;
  if (mins < 60) return interpolate(t.minutesAgo, { count: mins });
  const h = Math.floor(mins / 60);
  if (h < 24) return interpolate(t.hoursAgo, { count: h });
  return interpolate(t.daysAgo, { count: Math.floor(h / 24) });
}

export default async function KioskGestionePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant) return null;
  const gt = await getGestioneTranslations();
  const t = gt.kiosk;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();
  if (!auth.isDemo && !auth.isAdmin) notFound();
  if (!tenant.features.orderKiosk) notFound();

  const activeLocation = auth.isDemo ? null : await getActiveGestioneLocation(tenantSlug);
  const { devices, locations } = auth.isDemo
    ? demoKiosks()
    : activeLocation
      ? await fetchKiosks(tenantSlug, activeLocation.id)
      : { devices: [], locations: [] };

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">{t.eyebrow}</span>
        <h1 className="ga-heading">{t.title}</h1>
        <p className="ga-lead">
          {t.lead}
        </p>
      </header>

      <section className="ga-card">
        <div className="ga-section-head">
          <h2 className="ga-section-title">{t.addTitle}</h2>
          <span className="ga-section-hint">{t.addHint}</span>
        </div>
        <form action={createKioskDevice} className="ga-form-inline">
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          {activeLocation && <input type="hidden" name="locationId" value={activeLocation.id} />}
          <input type="text" name="name" placeholder={t.namePlaceholder} required className="ga-input" />
          <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
            <Plus size={14} strokeWidth={2.4} /> {t.create}
          </button>
        </form>
      </section>

      {devices.length === 0 ? (
        <div className="ga-empty">
          {auth.isDemo
            ? t.demoEmpty
            : t.empty}
        </div>
      ) : (
        devices.map((d) => {
          const online = isOnline(d.last_seen_at);
          const locationName = locations.find((l) => l.id === d.location_id)?.name ?? t.allLocations;
          return (
            <section key={d.id} className="ga-card ga-kiosk">
              <div className="ga-kiosk-head">
                <div className="ga-kiosk-title">
                  <MonitorSmartphone size={18} strokeWidth={2.2} />
                  <div>
                    <h2 className="ga-section-title">{d.name}</h2>
                    <div className="ga-section-hint">{locationName}</div>
                  </div>
                </div>
                <div className="ga-kiosk-status">
                  <span className="ga-module-status" data-status={d.enabled ? (online ? "ok" : "warn") : "muted"}>
                    {online ? <Wifi size={11} strokeWidth={2.4} /> : <WifiOff size={11} strokeWidth={2.4} />}
                    {!d.enabled ? t.disabled : online ? t.online : t.offline}
                  </span>
                  <span className="ga-section-hint">{interpolate(t.lastContact, { value: lastSeenLabel(d.last_seen_at, t) })}</span>
                </div>
              </div>

              <div className="ga-kiosk-pairing">
                <div>
                  <div className="ga-label-text">{t.pairingCode}</div>
                  {d.paired_at ? (
                    <div className="ga-kiosk-paired">
                      <span className="ga-module-status" data-status="ok">{t.paired}</span>
                      <span className="ga-section-hint">{interpolate(t.pairedAt, { value: new Date(d.paired_at).toLocaleString("it-IT") })}</span>
                    </div>
                  ) : (
                    <code className="ga-kiosk-code">{d.pairing_code}</code>
                  )}
                </div>
                <form action={regeneratePairingCode}>
                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                    <RefreshCw size={14} strokeWidth={2.4} /> {t.regenerate}
                  </button>
                </form>
                <form action={toggleKioskDevice}>
                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="enable" value={d.enabled ? "false" : "true"} />
                  <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                    {d.enabled ? <PowerOff size={14} strokeWidth={2.4} /> : <Power size={14} strokeWidth={2.4} />}
                    {d.enabled ? t.disable : t.enable}
                  </button>
                </form>
                <form action={deleteKioskDevice}>
                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo} aria-label={t.delete}>
                    <Trash2 size={14} strokeWidth={2.4} />
                  </button>
                </form>
              </div>

              <form action={updateKioskConfig} className="ga-kiosk-config">
                <input type="hidden" name="tenantSlug" value={tenantSlug} />
                <input type="hidden" name="id" value={d.id} />

                <div className="ga-kiosk-group">
                  <div className="ga-label-text">{t.steps}</div>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="step_language" defaultChecked={d.config.steps?.language_picker} />
                    <span>{t.language}</span>
                  </label>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="step_dine_in_takeaway" defaultChecked={d.config.steps?.dine_in_takeaway} />
                    <span>{t.dine}</span>
                  </label>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="step_table_number" defaultChecked={d.config.steps?.table_number} />
                    <span>{t.table}</span>
                  </label>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="step_customer_name" defaultChecked={d.config.steps?.customer_name} />
                    <span>{t.customerName}</span>
                  </label>
                </div>

                <div className="ga-kiosk-group">
                  <div className="ga-label-text">{t.payments}</div>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="pay_cash" defaultChecked={d.config.payments?.cash} />
                    <span>{t.cash}</span>
                  </label>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="pay_stripe_qr" defaultChecked={d.config.payments?.stripe_qr} />
                    <span>{t.stripe}</span>
                  </label>
                  <label className="ga-kiosk-toggle" data-disabled="true">
                    <input type="checkbox" name="pay_satispay" defaultChecked={d.config.payments?.satispay} disabled />
                    <span>Satispay <em>({t.comingSoon})</em></span>
                  </label>
                  <label className="ga-kiosk-toggle" data-disabled="true">
                    <input type="checkbox" name="pay_pos" defaultChecked={d.config.payments?.pos} disabled />
                    <span>POS <em>({t.comingSoon})</em></span>
                  </label>
                </div>

                <div className="ga-kiosk-actions">
                  <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                    <Copy size={14} strokeWidth={2.4} /> {t.save}
                  </button>
                </div>
              </form>
            </section>
          );
        })
      )}
    </div>
  );
}
