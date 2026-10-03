import { GestioneTabs } from "@/components/gestione/gestione-tabs";
import { requireGestioneSection } from "@/lib/gestione-page";
import { listMembers } from "@/lib/fidelity/queries";
import type { FidelityMember } from "@/lib/fidelity/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { adjustPoints } from "../actions";

export const dynamic = "force-dynamic";

const FIDELITY_TABS = [
  { path: "fidelity", label: "Programma" },
  { path: "fidelity/regole", label: "Regole punti" },
  { path: "fidelity/premi", label: "Premi" },
  { path: "fidelity/iscritti", label: "Iscritti" },
];

type CustomerIdentity = { name: string | null; contact: string | null };

/** Nome e contatto dalla scheda cliente del tenant: l'id utente da solo non dice nulla al gestore. */
async function loadIdentities(tenantSlug: string, userIds: string[]): Promise<Map<string, CustomerIdentity>> {
  const db = createSupabaseServiceClient();
  const out = new Map<string, CustomerIdentity>();
  if (!db || userIds.length === 0) return out;
  const { data } = await db
    .from("customers")
    .select("menuary_user_id, display_name, email, phone")
    .eq("tenant_id", tenantSlug)
    .in("menuary_user_id", userIds);
  for (const row of data ?? []) {
    if (!row.menuary_user_id) continue;
    out.set(row.menuary_user_id, { name: row.display_name, contact: row.email ?? row.phone });
  }
  return out;
}

export default async function FidelityMembersPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const { auth } = await requireGestioneSection(tenantSlug, "loyalty");

  // Gli iscritti sono dati personali: la demo pubblica non li mostra.
  let members: FidelityMember[] = [];
  if (!auth.isDemo) {
    try {
      members = await listMembers(tenantSlug);
    } catch {}
  }
  const identities = await loadIdentities(tenantSlug, members.map((member) => member.user_id));

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Fedeltà</span>
        <h1 className="ga-heading">Iscritti al programma</h1>
        <p className="ga-lead">
          {members.length} {members.length === 1 ? "iscritto" : "iscritti"}. Puoi correggere il saldo indicando sempre il motivo.
        </p>
      </header>
      <GestioneTabs items={FIDELITY_TABS} label="Sezioni fedeltà" />

      {members.length === 0 ? (
        <div className="ga-empty">
          Nessun iscritto. I clienti si iscrivono dal checkout quando il programma è attivo.
        </div>
      ) : (
        <div className="ga-card ga-table-scroll">
          <table className="ga-data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Iscritto il</th>
                <th className="ga-num">Saldo</th>
                <th className="ga-num">Accumulati</th>
                <th className="ga-num">Spesi</th>
                <th>Correggi saldo</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const identity = identities.get(m.user_id);
                return (
                  <tr key={m.id}>
                    <td>
                      <strong>{identity?.name ?? "Cliente senza nome"}</strong>
                      <span className="ga-cell-hint">{identity?.contact ?? `ID ${m.user_id.slice(0, 8)}`}</span>
                    </td>
                    <td>{new Date(m.enrolled_at).toLocaleDateString("it-IT")}</td>
                    <td className="ga-num"><strong>{m.points_balance}</strong></td>
                    <td className="ga-num">{m.lifetime_earned}</td>
                    <td className="ga-num">{m.lifetime_spent}</td>
                    <td>
                      <form action={adjustPoints} className="ga-inline-form">
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="memberId" value={m.id} />
                        <input type="number" name="points" placeholder="± punti" className="ga-input" aria-label="Punti da aggiungere o togliere" required />
                        <input type="text" name="note" placeholder="Motivo" className="ga-input" aria-label="Motivo della correzione" required />
                        <button type="submit" className="ga-btn ga-btn-ghost">Applica</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
