import { notFound } from "next/navigation";
import { Users, Clock, Power } from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { openTableSession, closeTableSession } from "./actions";
import { demoTavoli } from "@/lib/demo-fixtures";
import { getGestioneTranslations } from "@/i18n/gestione";
import { getActiveGestioneLocation } from "@/lib/gestione-location";

type Table = { id: string; label: string; area: string; seats: number | null };
type Session = { id: string; table_id: string; opened_at: string; declared_covers: number | null; code: string };

async function fetchPlanner(tenantSlug: string, locationId: string): Promise<{ tables: Table[]; openByTable: Map<string, Session> }> {
  const svc = createSupabaseServiceClient();
  if (!svc) return { tables: [], openByTable: new Map() };

  const { data: tables } = await svc
    .from("tables")
    .select("id, label, area, seats")
    .eq("tenant_id", tenantSlug)
    .eq("location_id", locationId)
    .order("area")
    .order("label");
  const tableIds = (tables ?? []).map((table) => table.id);
  const { data: sessions } = tableIds.length > 0
    ? await svc
        .from("table_sessions")
        .select("id, table_id, opened_at, declared_covers, code")
        .eq("tenant_id", tenantSlug)
        .in("table_id", tableIds)
        .eq("status", "aperta")
    : { data: [] };

  const map = new Map<string, Session>();
  for (const s of sessions ?? []) map.set(s.table_id, s as Session);
  return { tables: (tables ?? []) as Table[], openByTable: map };
}

function durationSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(ms / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export default async function TavoliPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) return null;
  const gt = await getGestioneTranslations();
  const tt = gt.tables;

  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();

  const isServices = tenant.vertical === "services" || tenant.vertical === "creative";
  const demoVertical = tenant.vertical === "food" ? "food" : "services";
  const activeLocation = auth.isDemo ? null : await getActiveGestioneLocation(tenantSlug);
  const planner = auth.isDemo
    ? demoTavoli(demoVertical)
    : activeLocation
      ? await fetchPlanner(tenantSlug, activeLocation.id)
      : { tables: [], openByTable: new Map<string, Session>() };

  const byArea = new Map<string, Table[]>();
  for (const t of planner.tables) {
    const arr = byArea.get(t.area) ?? [];
    arr.push(t);
    byArea.set(t.area, arr);
  }
  const areas = [...byArea.keys()].sort();

  const totals = {
    total: planner.tables.length,
    open: planner.openByTable.size,
    free: planner.tables.length - planner.openByTable.size,
  };

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">{tt.eyebrow}</span>
        <h1 className="ga-heading">{isServices ? tt.titleServices : tt.titleFood}</h1>
        <p className="ga-lead">
          {isServices ? tt.leadServices : tt.leadFood}
        </p>
      </header>

      <section className="ga-kpi-grid">
        <div className="ga-kpi">
          <span className="ga-kpi-label">{isServices ? tt.stations : tt.tables}</span>
          <span className="ga-kpi-value">{totals.total}</span>
        </div>
        <div className="ga-kpi">
          <span className="ga-kpi-label">{isServices ? tt.working : tt.occupied}</span>
          <span className="ga-kpi-value">{totals.open}</span>
        </div>
        <div className="ga-kpi">
          <span className="ga-kpi-label">{tt.free}</span>
          <span className="ga-kpi-value">{totals.free}</span>
        </div>
      </section>

      {planner.tables.length === 0 ? (
        <div className="ga-empty">
          {auth.isDemo
            ? tt.demoEmpty
            : isServices ? tt.emptyServices : tt.emptyFood}
        </div>
      ) : (
        areas.map((area) => (
          <section key={area} className="ga-section">
            <div className="ga-section-head">
              <h2 className="ga-section-title">{area}</h2>
              <span className="ga-section-hint">
                {byArea.get(area)!.length} {isServices ? tt.stationCount : tt.tableCount}
              </span>
            </div>
            <div className="ga-tables-grid">
              {byArea.get(area)!.map((t) => {
                const session = planner.openByTable.get(t.id);
                const isOpen = Boolean(session);
                return (
                  <article key={t.id} className="ga-table" data-open={isOpen}>
                    <header>
                      <span className="ga-table-label">{t.label}</span>
                      <span className="ga-module-status" data-status={isOpen ? "warn" : "ok"}>
                        {isOpen ? (isServices ? tt.workingOne : tt.occupiedOne) : tt.freeOne}
                      </span>
                    </header>
                    <div className="ga-table-meta">
                      {t.seats != null && (
                        <span><Users size={12} strokeWidth={2.2} /> {t.seats} {tt.seats}</span>
                      )}
                      {session && (
                        <span><Clock size={12} strokeWidth={2.2} /> {durationSince(session.opened_at)}</span>
                      )}
                      {session?.declared_covers && (
                        <span><Users size={12} strokeWidth={2.2} /> {session.declared_covers} {tt.peopleShort}</span>
                      )}
                    </div>
                    <div className="ga-table-actions">
                      {isOpen && session ? (
                        <form action={closeTableSession}>
                          <input type="hidden" name="tenantSlug" value={tenantSlug} />
                          <input type="hidden" name="sessionId" value={session.id} />
                          <button type="submit" className="ga-btn ga-btn-ghost" disabled={auth.isDemo}>
                            <Power size={14} strokeWidth={2.4} /> {tt.close}
                          </button>
                        </form>
                      ) : (
                        <form action={openTableSession}>
                          <input type="hidden" name="tenantSlug" value={tenantSlug} />
                          <input type="hidden" name="tableId" value={t.id} />
                          <input
                            type="number"
                            name="covers"
                            min={1}
                            max={t.seats ?? 99}
                            placeholder={isServices ? tt.clients : tt.covers}
                            className="ga-input ga-table-input"
                          />
                          <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                            <Power size={14} strokeWidth={2.4} /> {tt.open}
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
