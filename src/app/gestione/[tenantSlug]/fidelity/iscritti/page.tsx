import Link from "next/link";
import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { listMembers } from "@/lib/fidelity/queries";
import type { FidelityMember } from "@/lib/fidelity/types";
import { adjustPoints } from "../actions";

export const dynamic = "force-dynamic";

export default async function FidelityMembersPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();
  const access = getGestioneModuleAccess(tenant.features);
  if (!access.canManageFidelity) notFound();

  let members: FidelityMember[] = [];
  try {
    members = await listMembers(tenantSlug);
  } catch {}

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1100 }}>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", fontSize: 14 }}>
        <Link href={`/gestione/${tenantSlug}/fidelity`}>Programma</Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/regole`}>Regole punti</Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/premi`}>Premi</Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/iscritti`}><b>Iscritti</b></Link>
      </nav>

      <h1>Iscritti al programma</h1>
      <p style={{ color: "#666" }}>{members.length} {members.length === 1 ? "iscritto" : "iscritti"}.</p>

      <table style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: ".5rem" }}>User ID</th>
            <th style={{ padding: ".5rem" }}>Iscritto il</th>
            <th style={{ padding: ".5rem", textAlign: "right" }}>Saldo</th>
            <th style={{ padding: ".5rem", textAlign: "right" }}>Accumulati</th>
            <th style={{ padding: ".5rem", textAlign: "right" }}>Spesi</th>
            <th style={{ padding: ".5rem" }}>Aggiusta</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: ".5rem", fontFamily: "monospace", fontSize: 12 }}>{m.user_id.slice(0, 8)}…</td>
              <td style={{ padding: ".5rem", fontSize: 12 }}>{new Date(m.enrolled_at).toLocaleDateString("it")}</td>
              <td style={{ padding: ".5rem", textAlign: "right" }}><b>{m.points_balance}</b></td>
              <td style={{ padding: ".5rem", textAlign: "right", color: "#666" }}>{m.lifetime_earned}</td>
              <td style={{ padding: ".5rem", textAlign: "right", color: "#666" }}>{m.lifetime_spent}</td>
              <td style={{ padding: ".5rem" }}>
                <form action={adjustPoints} style={{ display: "flex", gap: ".25rem" }}>
                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                  <input type="hidden" name="memberId" value={m.id} />
                  <input type="number" name="points" placeholder="±punti" style={{ width: 80, padding: ".25rem" }} required />
                  <input type="text" name="note" placeholder="motivo" style={{ width: 160, padding: ".25rem" }} />
                  <button type="submit" style={{ padding: ".25rem .5rem" }}>OK</button>
                </form>
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#999" }}>
              Nessun iscritto. I clienti potranno iscriversi dal checkout una volta attivato il programma.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
