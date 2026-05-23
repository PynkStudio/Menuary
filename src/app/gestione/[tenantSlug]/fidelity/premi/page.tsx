import Link from "next/link";
import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { listRewards } from "@/lib/fidelity/queries";
import type { FidelityReward, FidelityRewardKind } from "@/lib/fidelity/types";
import { removeReward, saveReward } from "../actions";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<FidelityRewardKind, string> = {
  order_discount_amount: "Sconto su totale ordine (€)",
  free_product: "Prodotto gratis",
  external_coupon_code: "Codice coupon esterno",
  category_percent_discount: "Sconto % su categoria",
};

function PayloadFields({ reward }: { reward?: FidelityReward }) {
  const kind = reward?.kind ?? "order_discount_amount";
  const p = (reward?.payload ?? {}) as Record<string, unknown>;
  switch (kind) {
    case "order_discount_amount":
      return (
        <label>Importo sconto (€)
          <input type="number" name="amount_eur" min={0.01} step="0.01" defaultValue={(p.amount_eur as number) ?? 5} style={{ display: "block", padding: ".4rem" }} />
        </label>
      );
    case "free_product":
      return (
        <label>ID prodotto menu
          <input name="menu_item_id" defaultValue={(p.menu_item_id as string) ?? ""} placeholder="uuid prodotto" style={{ display: "block", width: "100%", padding: ".4rem" }} />
        </label>
      );
    case "external_coupon_code":
      return (
        <>
          <label>Prefisso codice
            <input name="code_prefix" defaultValue={(p.code_prefix as string) ?? "FID"} style={{ display: "block", padding: ".4rem" }} />
          </label>
          <label>Lunghezza
            <input type="number" name="code_length" min={4} max={16} defaultValue={(p.code_length as number) ?? 8} style={{ display: "block", padding: ".4rem", width: 100 }} />
          </label>
        </>
      );
    case "category_percent_discount":
      return (
        <>
          <label>ID categoria
            <input name="category_id" defaultValue={(p.category_id as string) ?? ""} style={{ display: "block", width: "100%", padding: ".4rem" }} />
          </label>
          <label>Percentuale
            <input type="number" name="percent" min={1} max={100} defaultValue={(p.percent as number) ?? 20} style={{ display: "block", padding: ".4rem", width: 100 }} />
          </label>
        </>
      );
  }
}

export default async function FidelityRewardsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();
  const access = getGestioneModuleAccess(tenant.features);
  if (!access.canManageFidelity) notFound();

  let rewards: FidelityReward[] = [];
  try {
    rewards = await listRewards(tenantSlug);
  } catch {}

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900 }}>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", fontSize: 14 }}>
        <Link href={`/gestione/${tenantSlug}/fidelity`}>Programma</Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/regole`}>Regole punti</Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/premi`}><b>Premi</b></Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/iscritti`}>Iscritti</Link>
      </nav>

      <h1>Premi</h1>
      <p style={{ color: "#666" }}>I premi che gli iscritti possono richiedere spendendo i propri punti.</p>

      <h2 style={{ marginTop: "2rem" }}>Aggiungi premio</h2>
      <form action={saveReward} style={{ display: "grid", gap: ".75rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 6 }}>
        <input type="hidden" name="tenantSlug" value={tenantSlug} />
        <label>Nome
          <input name="name" required style={{ display: "block", width: "100%", padding: ".4rem" }} />
        </label>
        <label>Descrizione
          <input name="description" style={{ display: "block", width: "100%", padding: ".4rem" }} />
        </label>
        <label>Tipo
          <select name="kind" defaultValue="order_discount_amount" style={{ display: "block", padding: ".4rem" }}>
            {Object.entries(KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <PayloadFields />
        <label>Punti richiesti
          <input type="number" name="points_cost" min={1} defaultValue={100} required style={{ display: "block", padding: ".4rem", width: 120 }} />
        </label>
        <div style={{ display: "flex", gap: "1rem" }}>
          <label>Stock (vuoto = illimitato)
            <input type="number" name="stock" min={0} placeholder="" style={{ display: "block", padding: ".4rem", width: 120 }} />
          </label>
          <label>Valido dal
            <input type="date" name="valid_from" style={{ display: "block", padding: ".4rem" }} />
          </label>
          <label>Valido al
            <input type="date" name="valid_to" style={{ display: "block", padding: ".4rem" }} />
          </label>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <label>Ordinamento
            <input type="number" name="sort_order" defaultValue={100} style={{ display: "block", padding: ".4rem", width: 100 }} />
          </label>
          <label style={{ alignSelf: "end" }}><input type="checkbox" name="is_active" defaultChecked /> Attivo</label>
        </div>
        <button type="submit" style={{ padding: ".5rem 1rem", background: "#111", color: "#fff", border: 0, borderRadius: 6, justifySelf: "start" }}>
          Aggiungi
        </button>
      </form>

      <h2 style={{ marginTop: "2rem" }}>Premi esistenti</h2>
      {rewards.length === 0 && <p style={{ color: "#999" }}>Nessun premio configurato.</p>}
      {rewards.map((r) => (
        <details key={r.id} style={{ padding: ".75rem", border: "1px solid #eee", borderRadius: 6, marginBottom: ".5rem" }}>
          <summary>
            <b>{r.name}</b> · {r.points_cost} punti · {KIND_LABELS[r.kind]} {!r.is_active && <em style={{ color: "#999" }}>(disattivato)</em>}
          </summary>
          <form action={saveReward} style={{ display: "grid", gap: ".5rem", marginTop: ".75rem" }}>
            <input type="hidden" name="tenantSlug" value={tenantSlug} />
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="kind" value={r.kind} />
            <label>Nome
              <input name="name" defaultValue={r.name} style={{ display: "block", width: "100%", padding: ".4rem" }} />
            </label>
            <label>Descrizione
              <input name="description" defaultValue={r.description ?? ""} style={{ display: "block", width: "100%", padding: ".4rem" }} />
            </label>
            <PayloadFields reward={r} />
            <label>Punti
              <input type="number" name="points_cost" min={1} defaultValue={r.points_cost} style={{ display: "block", padding: ".4rem", width: 120 }} />
            </label>
            <label>Stock
              <input type="number" name="stock" defaultValue={r.stock ?? ""} style={{ display: "block", padding: ".4rem", width: 120 }} />
            </label>
            <label>Ordinamento
              <input type="number" name="sort_order" defaultValue={r.sort_order} style={{ display: "block", padding: ".4rem", width: 100 }} />
            </label>
            <label><input type="checkbox" name="is_active" defaultChecked={r.is_active} /> Attivo</label>
            <button type="submit" style={{ padding: ".4rem .8rem", justifySelf: "start" }}>Salva</button>
          </form>
          <form action={removeReward} style={{ marginTop: ".5rem" }}>
            <input type="hidden" name="tenantSlug" value={tenantSlug} />
            <input type="hidden" name="id" value={r.id} />
            <button type="submit" style={{ padding: ".4rem .8rem", color: "#a00" }}>Elimina</button>
          </form>
        </details>
      ))}
    </div>
  );
}
