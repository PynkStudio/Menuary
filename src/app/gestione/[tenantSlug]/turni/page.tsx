import { notFound } from "next/navigation";
import { Plus, Trash2, Clock } from "lucide-react";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createShift, deleteShift } from "./actions";
import { demoTurni } from "@/lib/demo-fixtures";
import { getActiveGestioneLocation } from "@/lib/gestione-location";

type Shift = {
  id: string;
  employee_id: string;
  start_at: string;
  end_at: string;
  role: string | null;
  status: string;
  note: string | null;
};

type Employee = {
  user_id: string;
  display_name: string | null;
  email: string;
  role: string;
};

function weekRange(): { from: Date; to: Date } {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0 = lunedì
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from, to };
}

async function fetchTurni(tenantSlug: string, locationId: string): Promise<{ shifts: Shift[]; employees: Employee[] }> {
  const svc = createSupabaseServiceClient();
  if (!svc) return { shifts: [], employees: [] };
  const { from, to } = weekRange();
  const [{ data: shifts }, { data: employees }] = await Promise.all([
    svc
      .from("shifts")
      .select("id, employee_id, start_at, end_at, role, status, note")
      .eq("tenant_id", tenantSlug)
      .eq("location_id", locationId)
      .gte("start_at", from.toISOString())
      .lt("start_at", to.toISOString())
      .order("start_at"),
    svc
      .from("employee")
      .select("user_id, display_name, email, role")
      .eq("tenant_id", tenantSlug)
      .eq("enabled", true),
  ]);
  return {
    shifts: (shifts ?? []) as Shift[],
    employees: ((employees ?? []) as Employee[]).filter((e) => e.user_id),
  };
}

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function dayIndex(iso: string, weekFrom: Date): number {
  const d = new Date(iso);
  const ms = d.getTime() - weekFrom.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function fmtHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export default async function TurniPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();

  const activeLocation = auth.isDemo ? null : await getActiveGestioneLocation(tenantSlug);
  const data = auth.isDemo
    ? demoTurni()
    : activeLocation
      ? await fetchTurni(tenantSlug, activeLocation.id)
      : { shifts: [], employees: [] };
  const { from } = weekRange();
  const employeesById = new Map(data.employees.map((e) => [e.user_id, e]));

  // griglia: 7 giorni → lista turni
  const grid: Shift[][] = Array.from({ length: 7 }, () => []);
  for (const s of data.shifts) {
    const i = dayIndex(s.start_at, from);
    if (i >= 0 && i < 7) grid[i].push(s);
  }

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Squadra</span>
        <h1 className="ga-heading">Turni</h1>
        <p className="ga-lead">Pianifica i turni della settimana corrente. Gli orari sono visibili allo staff.</p>
      </header>

      <section className="ga-card">
        <div className="ga-section-head">
          <h2 className="ga-section-title">Nuovo turno</h2>
        </div>
        {data.employees.length === 0 ? (
          <div className="ga-empty">Nessun membro dello staff attivo. Aggiungili dalla sezione Staff.</div>
        ) : (
          <form action={createShift} className="ga-form-inline">
            <input type="hidden" name="tenantSlug" value={tenantSlug} />
            <select name="employeeId" className="ga-select" required>
              {data.employees.map((e) => (
                <option key={e.user_id} value={e.user_id}>
                  {e.display_name ?? e.email}
                </option>
              ))}
            </select>
            <input type="datetime-local" name="startAt" required className="ga-input" />
            <input type="datetime-local" name="endAt" required className="ga-input" />
            <input type="text" name="role" placeholder="Ruolo (opz.)" className="ga-input" />
            <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
              <Plus size={14} strokeWidth={2.4} /> Aggiungi
            </button>
          </form>
        )}
      </section>

      <section className="ga-shifts-week">
        {DAYS.map((day, i) => {
          const date = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
          return (
            <div key={day} className="ga-shifts-day">
              <header>
                <span className="ga-shifts-day-name">{day}</span>
                <span className="ga-shifts-day-date">{date.getDate()}/{date.getMonth() + 1}</span>
              </header>
              {grid[i].length === 0 ? (
                <div className="ga-shifts-empty">—</div>
              ) : (
                grid[i].map((s) => {
                  const e = employeesById.get(s.employee_id);
                  return (
                    <article key={s.id} className="ga-shift">
                      <div>
                        <div className="ga-shift-name">{e?.display_name ?? e?.email ?? "Staff"}</div>
                        <div className="ga-shift-time">
                          <Clock size={11} strokeWidth={2.2} /> {fmtHour(s.start_at)}–{fmtHour(s.end_at)}
                          {s.role && ` · ${s.role}`}
                        </div>
                      </div>
                      <form action={deleteShift}>
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="ga-shift-delete" aria-label="Elimina turno" disabled={auth.isDemo}>
                          <Trash2 size={12} strokeWidth={2.2} />
                        </button>
                      </form>
                    </article>
                  );
                })
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
