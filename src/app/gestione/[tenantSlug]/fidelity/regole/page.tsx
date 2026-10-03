import { GestioneTabs } from "@/components/gestione/gestione-tabs";
import { EARN_KIND_LABELS, EarnRuleKindFields } from "@/components/gestione/fidelity-fields";
import { requireGestioneSection } from "@/lib/gestione-page";
import { listEarnRules } from "@/lib/fidelity/queries";
import type { FidelityEarnRule } from "@/lib/fidelity/types";
import { removeEarnRule, saveEarnRule } from "../actions";

export const dynamic = "force-dynamic";

const FIDELITY_TABS = [
  { path: "fidelity", label: "Programma" },
  { path: "fidelity/regole", label: "Regole punti" },
  { path: "fidelity/premi", label: "Premi" },
  { path: "fidelity/iscritti", label: "Iscritti" },
];

export default async function FidelityRulesPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await requireGestioneSection(tenantSlug, "loyalty");

  let rules: FidelityEarnRule[] = [];
  try {
    rules = await listEarnRules(tenantSlug);
  } catch { /* tabella non ancora migrata */ }

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Fedeltà</span>
        <h1 className="ga-heading">Regole punti</h1>
        <p className="ga-lead">Come i clienti accumulano punti. A parità di condizioni vale la regola con priorità più alta.</p>
      </header>
      <GestioneTabs items={FIDELITY_TABS} label="Sezioni fedeltà" />

      <section className="ga-section">
        <h2 className="ga-section-title">Aggiungi regola</h2>
        <form action={saveEarnRule} className="ga-card ga-form-grid">
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          <label className="ga-field">
            <span className="ga-label-text">Nome regola</span>
            <input name="label" required placeholder="Es. 1 punto per ogni €" className="ga-input" />
          </label>
          <EarnRuleKindFields />
          <label className="ga-field">
            <span className="ga-label-text">Priorità</span>
            <input type="number" name="priority" defaultValue={100} className="ga-input" />
          </label>
          <label className="ga-inline-check">
            <input type="checkbox" name="is_active" className="ga-checkbox" defaultChecked />
            <span>Attiva</span>
          </label>
          <div className="ga-form-actions ga-field-wide">
            <button type="submit" className="ga-btn ga-btn-primary">Aggiungi regola</button>
          </div>
        </form>
      </section>

      <section className="ga-section">
        <h2 className="ga-section-title">Regole esistenti</h2>
        {rules.length === 0 && <div className="ga-empty">Nessuna regola configurata.</div>}
        {rules.map((r) => (
          <details key={r.id} className="ga-card ga-disclosure">
            <summary>
              <strong>{r.label}</strong>
              <span className="ga-section-hint">
                {EARN_KIND_LABELS[r.kind]}
                {!r.is_active && " · disattivata"}
              </span>
            </summary>
            <form action={saveEarnRule} className="ga-form-grid">
              <input type="hidden" name="tenantSlug" value={tenantSlug} />
              <input type="hidden" name="id" value={r.id} />
              <label className="ga-field">
                <span className="ga-label-text">Nome regola</span>
                <input name="label" defaultValue={r.label} className="ga-input" />
              </label>
              <EarnRuleKindFields lockedKind={r.kind} params={(r.params ?? {}) as Record<string, unknown>} />
              <label className="ga-field">
                <span className="ga-label-text">Priorità</span>
                <input type="number" name="priority" defaultValue={r.priority} className="ga-input" />
              </label>
              <label className="ga-inline-check">
                <input type="checkbox" name="is_active" className="ga-checkbox" defaultChecked={r.is_active} />
                <span>Attiva</span>
              </label>
              <div className="ga-form-actions ga-field-wide">
                <button type="submit" className="ga-btn ga-btn-primary">Salva</button>
                <button type="submit" formAction={removeEarnRule} className="ga-btn ga-btn-danger">Elimina</button>
              </div>
            </form>
          </details>
        ))}
      </section>
    </div>
  );
}
