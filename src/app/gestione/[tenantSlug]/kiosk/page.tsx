import { notFound } from "next/navigation";
import { headers } from "next/headers";
import {
  MonitorSmartphone, RefreshCw, Trash2, Power, PowerOff, Copy, Wifi, WifiOff, Plus,
} from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
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

async function fetchKiosks(tenantSlug: string): Promise<{
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

function lastSeenLabel(lastSeen: string | null): string {
  if (!lastSeen) return "Mai connesso";
  const ms = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "ora";
  if (mins < 60) return `${mins} min fa`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}

export default async function KioskGestionePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) return null;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();
  if (!auth.isDemo && !auth.isAdmin) notFound();
  if (!tenant.features.orderKiosk) notFound();

  const { devices, locations } = auth.isDemo ? demoKiosks() : await fetchKiosks(tenantSlug);

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Operatività</span>
        <h1 className="ga-heading">Kiosk self-service</h1>
        <p className="ga-lead">
          Registra ogni postazione kiosk, attivala/disattivala e configura i passaggi della UX e i metodi di pagamento disponibili al cliente.
        </p>
      </header>

      <section className="ga-card">
        <div className="ga-section-head">
          <h2 className="ga-section-title">Aggiungi kiosk</h2>
          <span className="ga-section-hint">Dopo la creazione, sul dispositivo apri il link kiosk e inserisci il codice di pairing.</span>
        </div>
        <form action={createKioskDevice} className="ga-form-inline">
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          <input type="text" name="name" placeholder="Es. Kiosk ingresso" required className="ga-input" />
          {locations.length > 1 && (
            <select name="locationId" className="ga-select" defaultValue="">
              <option value="">Tutte le sedi</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
          <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
            <Plus size={14} strokeWidth={2.4} /> Crea kiosk
          </button>
        </form>
      </section>

      {devices.length === 0 ? (
        <div className="ga-empty">
          {auth.isDemo
            ? "In modalità demo i dispositivi reali non vengono mostrati."
            : "Nessun kiosk registrato. Aggiungi il primo qui sopra."}
        </div>
      ) : (
        devices.map((d) => {
          const online = isOnline(d.last_seen_at);
          const locationName = locations.find((l) => l.id === d.location_id)?.name ?? "Tutte le sedi";
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
                    {!d.enabled ? "Disattivato" : online ? "Online" : "Offline"}
                  </span>
                  <span className="ga-section-hint">Ultimo contatto: {lastSeenLabel(d.last_seen_at)}</span>
                </div>
              </div>

              <div className="ga-kiosk-pairing">
                <div>
                  <div className="ga-label-text">Codice di pairing</div>
                  {d.paired_at ? (
                    <div className="ga-kiosk-paired">
                      <span className="ga-module-status" data-status="ok">Accoppiato</span>
                      <span className="ga-section-hint">il {new Date(d.paired_at).toLocaleString("it-IT")}</span>
                    </div>
                  ) : (
                    <code className="ga-kiosk-code">{d.pairing_code}</code>
                  )}
                </div>
                <form action={regeneratePairingCode}>
                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                    <RefreshCw size={14} strokeWidth={2.4} /> Rigenera codice
                  </button>
                </form>
                <form action={toggleKioskDevice}>
                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="enable" value={d.enabled ? "false" : "true"} />
                  <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                    {d.enabled ? <PowerOff size={14} strokeWidth={2.4} /> : <Power size={14} strokeWidth={2.4} />}
                    {d.enabled ? "Disattiva" : "Attiva"}
                  </button>
                </form>
                <form action={deleteKioskDevice}>
                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo} aria-label="Elimina">
                    <Trash2 size={14} strokeWidth={2.4} />
                  </button>
                </form>
              </div>

              <form action={updateKioskConfig} className="ga-kiosk-config">
                <input type="hidden" name="tenantSlug" value={tenantSlug} />
                <input type="hidden" name="id" value={d.id} />

                <div className="ga-kiosk-group">
                  <div className="ga-label-text">Passaggi della UX</div>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="step_language" defaultChecked={d.config.steps?.language_picker} />
                    <span>Selezione lingua all&apos;avvio</span>
                  </label>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="step_dine_in_takeaway" defaultChecked={d.config.steps?.dine_in_takeaway} />
                    <span>Chiedi mangia qui / asporto</span>
                  </label>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="step_table_number" defaultChecked={d.config.steps?.table_number} />
                    <span>Chiedi numero tavolo (solo se mangia qui)</span>
                  </label>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="step_customer_name" defaultChecked={d.config.steps?.customer_name} />
                    <span>Chiedi nome cliente</span>
                  </label>
                </div>

                <div className="ga-kiosk-group">
                  <div className="ga-label-text">Metodi di pagamento</div>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="pay_cash" defaultChecked={d.config.payments?.cash} />
                    <span>Paga in cassa (contanti / carta al banco)</span>
                  </label>
                  <label className="ga-kiosk-toggle">
                    <input type="checkbox" name="pay_stripe_qr" defaultChecked={d.config.payments?.stripe_qr} />
                    <span>Stripe QR (paga col telefono)</span>
                  </label>
                  <label className="ga-kiosk-toggle" data-disabled="true">
                    <input type="checkbox" name="pay_satispay" defaultChecked={d.config.payments?.satispay} disabled />
                    <span>Satispay <em>(in arrivo)</em></span>
                  </label>
                  <label className="ga-kiosk-toggle" data-disabled="true">
                    <input type="checkbox" name="pay_pos" defaultChecked={d.config.payments?.pos} disabled />
                    <span>POS fisico <em>(in arrivo)</em></span>
                  </label>
                </div>

                <div className="ga-kiosk-actions">
                  <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                    <Copy size={14} strokeWidth={2.4} /> Salva configurazione
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
