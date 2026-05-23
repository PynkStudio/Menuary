import Link from "next/link";
import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { listEarnRules } from "@/lib/fidelity/queries";
import type { FidelityEarnKind, FidelityEarnRule } from "@/lib/fidelity/types";
import { removeEarnRule, saveEarnRule } from "../actions";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<FidelityEarnKind, string> = {
  signup_bonus: "Bonus iscrizione",
  per_euro_spent: "Punti per € spesi",
  per_order_count: "Punti per ordine",
  day_of_week_bonus: "Bonus giorno settimana",
  date_range_bonus: "Bonus intervallo date",
};

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

function ParamsFields({ rule }: { rule?: FidelityEarnRule }) {
  const kind = rule?.kind ?? "per_euro_spent";
  const p = (rule?.params ?? {}) as Record<string, unknown>;
  switch (kind) {
    case "signup_bonus":
      return (
        <label>Punti accreditati all'iscrizione
          <input type="number" name="points" min={1} defaultValue={(p.points as number) ?? 50} style={{ display: "block", padding: ".4rem" }} />
        </label>
      );
    case "per_euro_spent":
      return (
        <>
          <label>Punti per ogni €
            <input type="number" name="points_per_euro" min={0} step="0.01" defaultValue={(p.points_per_euro as number) ?? 1} style={{ display: "block", padding: ".4rem" }} />
          </label>
          <label>Soglia minima ordine (€)
            <input type="number" name="min_order" min={0} step="0.01" defaultValue={(p.min_order as number) ?? 0} style={{ display: "block", padding: ".4rem" }} />
          </label>
        </>
      );
    case "per_order_count":
      return (
        <>
          <label>Punti per ordine
            <input type="number" name="points_per_order" min={1} defaultValue={(p.points_per_order as number) ?? 10} style={{ display: "block", padding: ".4rem" }} />
          </label>
          <label>Soglia minima ordine (€)
            <input type="number" name="min_order" min={0} step="0.01" defaultValue={(p.min_order as number) ?? 0} style={{ display: "block", padding: ".4rem" }} />
          </label>
        </>
      );
    case "day_of_week_bonus":
      return (
        <>
          <label>Giorno
            <select name="weekday" defaultValue={String((p.weekday as number) ?? 1)} style={{ display: "block", padding: ".4rem" }}>
              {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </label>
          <label>Moltiplicatore (es. 2 = doppi punti)
            <input type="number" name="multiplier" min={1} step="0.1" defaultValue={(p.multiplier as number) ?? 2} style={{ display: "block", padding: ".4rem" }} />
          </label>
        </>
      );
    case "date_range_bonus":
      return (
        <>
          <label>Dal
            <input type="date" name="from" defaultValue={(p.from as string) ?? ""} style={{ display: "block", padding: ".4rem" }} required />
          </label>
          <label>Al
            <input type="date" name="to" defaultValue={(p.to as string) ?? ""} style={{ display: "block", padding: ".4rem" }} required />
          </label>
          <label>Moltiplicatore
            <input type="number" name="multiplier" min={1} step="0.1" defaultValue={(p.multiplier as number) ?? 2} style={{ display: "block", padding: ".4rem" }} />
          </label>
        </>
      );
  }
}

export default async function FidelityRulesPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();
  const access = getGestioneModuleAccess(tenant.features);
  if (!access.canManageFidelity) notFound();

  let rules: FidelityEarnRule[] = [];
  try {
    rules = await listEarnRules(tenantSlug);
  } catch { /* tabella non ancora migrata */ }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900 }}>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", fontSize: 14 }}>
        <Link href={`/gestione/${tenantSlug}/fidelity`}>Programma</Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/regole`}><b>Regole punti</b></Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/premi`}>Premi</Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/iscritti`}>Iscritti</Link>
      </nav>

      <h1>Regole punti</h1>
      <p style={{ color: "#666" }}>Definisci come i clienti accumulano punti.</p>

      <h2 style={{ marginTop: "2rem" }}>Aggiungi regola</h2>
      <form action={saveEarnRule} style={{ display: "grid", gap: ".75rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 6 }}>
        <input type="hidden" name="tenantSlug" value={tenantSlug} />
        <label>Nome regola
          <input name="label" required placeholder="es. 1 punto per €" style={{ display: "block", width: "100%", padding: ".4rem" }} />
        </label>
        <label>Tipo
          <select name="kind" defaultValue="per_euro_spent" style={{ display: "block", padding: ".4rem" }}>
            {Object.entries(KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <ParamsFields />
        <div style={{ display: "flex", gap: "1rem" }}>
          <label>Priorità
            <input type="number" name="priority" defaultValue={100} style={{ display: "block", padding: ".4rem", width: 100 }} />
          </label>
          <label style={{ alignSelf: "end" }}>
            <input type="checkbox" name="is_active" defaultChecked /> Attiva
          </label>
        </div>
        <button type="submit" style={{ padding: ".5rem 1rem", background: "#111", color: "#fff", border: 0, borderRadius: 6, justifySelf: "start" }}>
          Aggiungi
        </button>
      </form>

      <h2 style={{ marginTop: "2rem" }}>Regole esistenti</h2>
      {rules.length === 0 && <p style={{ color: "#999" }}>Nessuna regola configurata.</p>}
      {rules.map((r) => (
        <details key={r.id} style={{ padding: ".75rem", border: "1px solid #eee", borderRadius: 6, marginBottom: ".5rem" }}>
          <summary>
            <b>{r.label}</b> · {KIND_LABELS[r.kind]} {!r.is_active && <em style={{ color: "#999" }}>(disattivata)</em>}
          </summary>
          <form action={saveEarnRule} style={{ display: "grid", gap: ".5rem", marginTop: ".75rem" }}>
            <input type="hidden" name="tenantSlug" value={tenantSlug} />
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="kind" value={r.kind} />
            <label>Nome
              <input name="label" defaultValue={r.label} style={{ display: "block", width: "100%", padding: ".4rem" }} />
            </label>
            <ParamsFields rule={r} />
            <label>Priorità
              <input type="number" name="priority" defaultValue={r.priority} style={{ display: "block", padding: ".4rem", width: 100 }} />
            </label>
            <label><input type="checkbox" name="is_active" defaultChecked={r.is_active} /> Attiva</label>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button type="submit" style={{ padding: ".4rem .8rem" }}>Salva</button>
            </div>
          </form>
          <form action={removeEarnRule} style={{ marginTop: ".5rem" }}>
            <input type="hidden" name="tenantSlug" value={tenantSlug} />
            <input type="hidden" name="id" value={r.id} />
            <button type="submit" style={{ padding: ".4rem .8rem", color: "#a00" }}>Elimina</button>
          </form>
        </details>
      ))}
    </div>
  );
}
