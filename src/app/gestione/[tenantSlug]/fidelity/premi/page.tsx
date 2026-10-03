import { GestioneTabs } from "@/components/gestione/gestione-tabs";
import { REWARD_KIND_LABELS, RewardKindFields } from "@/components/gestione/fidelity-fields";
import { requireGestioneSection } from "@/lib/gestione-page";
import { listRewards } from "@/lib/fidelity/queries";
import type { FidelityReward } from "@/lib/fidelity/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { removeReward, saveReward } from "../actions";

export const dynamic = "force-dynamic";

const FIDELITY_TABS = [
  { path: "fidelity", label: "Programma" },
  { path: "fidelity/regole", label: "Regole punti" },
  { path: "fidelity/premi", label: "Premi" },
  { path: "fidelity/iscritti", label: "Iscritti" },
];

async function loadMenuOptions(tenantSlug: string) {
  const db = createSupabaseServiceClient();
  if (!db) return { products: [], categories: [] };
  const [{ data: items }, { data: categories }] = await Promise.all([
    db.from("menu_items").select("id,name").eq("tenant_id", tenantSlug).order("name"),
    db.from("menu_categories").select("id,title").eq("tenant_id", tenantSlug).order("position"),
  ]);
  return {
    products: (items ?? []).map((item) => ({ id: item.id, label: item.name })),
    categories: (categories ?? []).map((category) => ({ id: category.id, label: category.title })),
  };
}

export default async function FidelityRewardsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const { auth } = await requireGestioneSection(tenantSlug, "loyalty");

  let rewards: FidelityReward[] = [];
  try {
    rewards = await listRewards(tenantSlug);
  } catch {}
  const { products, categories } = auth.isDemo ? { products: [], categories: [] } : await loadMenuOptions(tenantSlug);

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Fedeltà</span>
        <h1 className="ga-heading">Premi</h1>
        <p className="ga-lead">I premi che gli iscritti possono richiedere spendendo i propri punti.</p>
      </header>
      <GestioneTabs items={FIDELITY_TABS} label="Sezioni fedeltà" />

      <section className="ga-section">
        <h2 className="ga-section-title">Aggiungi premio</h2>
        <form action={saveReward} className="ga-card ga-form-grid">
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          <label className="ga-field">
            <span className="ga-label-text">Nome</span>
            <input name="name" className="ga-input" required />
          </label>
          <label className="ga-field">
            <span className="ga-label-text">Descrizione</span>
            <input name="description" className="ga-input" />
          </label>
          <RewardKindFields products={products} categories={categories} />
          <label className="ga-field">
            <span className="ga-label-text">Punti richiesti</span>
            <input type="number" name="points_cost" min={1} defaultValue={100} className="ga-input" required />
          </label>
          <label className="ga-field">
            <span className="ga-label-text">Disponibilità (vuoto = illimitata)</span>
            <input type="number" name="stock" min={0} className="ga-input" />
          </label>
          <label className="ga-field">
            <span className="ga-label-text">Valido dal</span>
            <input type="date" name="valid_from" className="ga-input" />
          </label>
          <label className="ga-field">
            <span className="ga-label-text">Valido fino al</span>
            <input type="date" name="valid_to" className="ga-input" />
          </label>
          <label className="ga-field">
            <span className="ga-label-text">Ordine di visualizzazione</span>
            <input type="number" name="sort_order" defaultValue={100} className="ga-input" />
          </label>
          <label className="ga-inline-check">
            <input type="checkbox" name="is_active" className="ga-checkbox" defaultChecked />
            <span>Attivo</span>
          </label>
          <div className="ga-form-actions ga-field-wide">
            <button type="submit" className="ga-btn ga-btn-primary">Aggiungi premio</button>
          </div>
        </form>
      </section>

      <section className="ga-section">
        <h2 className="ga-section-title">Premi esistenti</h2>
        {rewards.length === 0 && <div className="ga-empty">Nessun premio configurato.</div>}
        {rewards.map((r) => (
          <details key={r.id} className="ga-card ga-disclosure">
            <summary>
              <strong>{r.name}</strong>
              <span className="ga-section-hint">
                {r.points_cost} punti · {REWARD_KIND_LABELS[r.kind]}
                {!r.is_active && " · disattivato"}
              </span>
            </summary>
            <form action={saveReward} className="ga-form-grid">
              <input type="hidden" name="tenantSlug" value={tenantSlug} />
              <input type="hidden" name="id" value={r.id} />
              <label className="ga-field">
                <span className="ga-label-text">Nome</span>
                <input name="name" defaultValue={r.name} className="ga-input" />
              </label>
              <label className="ga-field">
                <span className="ga-label-text">Descrizione</span>
                <input name="description" defaultValue={r.description ?? ""} className="ga-input" />
              </label>
              <RewardKindFields
                lockedKind={r.kind}
                payload={(r.payload ?? {}) as Record<string, unknown>}
                products={products}
                categories={categories}
              />
              <label className="ga-field">
                <span className="ga-label-text">Punti richiesti</span>
                <input type="number" name="points_cost" min={1} defaultValue={r.points_cost} className="ga-input" />
              </label>
              <label className="ga-field">
                <span className="ga-label-text">Disponibilità</span>
                <input type="number" name="stock" defaultValue={r.stock ?? ""} className="ga-input" />
              </label>
              <label className="ga-field">
                <span className="ga-label-text">Ordine di visualizzazione</span>
                <input type="number" name="sort_order" defaultValue={r.sort_order} className="ga-input" />
              </label>
              <label className="ga-inline-check">
                <input type="checkbox" name="is_active" className="ga-checkbox" defaultChecked={r.is_active} />
                <span>Attivo</span>
              </label>
              <div className="ga-form-actions ga-field-wide">
                <button type="submit" className="ga-btn ga-btn-primary">Salva</button>
                <button type="submit" formAction={removeReward} className="ga-btn ga-btn-danger">Elimina</button>
              </div>
            </form>
          </details>
        ))}
      </section>
    </div>
  );
}
