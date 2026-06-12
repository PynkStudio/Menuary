import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { getProgram } from "@/lib/fidelity/queries";
import { saveProgram } from "./actions";
import { NewsletterManager } from "@/components/gestione/newsletter-manager";
import { getNewsletterDashboard } from "@/lib/newsletter/server";

export const dynamic = "force-dynamic";

export default async function FidelityProgramPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant) notFound();
  const access = getGestioneModuleAccess(tenant.features);
  if (!access.canManageFidelity) notFound();

  if (tenant.vertical === "creative") {
    let newsletterData = undefined;
    let newsletterError = null;
    try {
      newsletterData = await getNewsletterDashboard(tenantSlug);
    } catch (error) {
      newsletterError = error instanceof Error
        ? `Newsletter non ancora inizializzata: ${error.message}`
        : "Newsletter non ancora inizializzata.";
    }
    return (
      <NewsletterManager
        tenantId={tenantSlug}
        initialData={newsletterData}
        initialError={newsletterError}
      />
    );
  }

  let program = null;
  try {
    program = await getProgram(tenantSlug);
  } catch {
    program = null;
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900 }}>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", fontSize: 14 }}>
        <Link href={`/gestione/${tenantSlug}/fidelity`}><b>Programma</b></Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/regole`}>Regole punti</Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/premi`}>Premi</Link>
        <Link href={`/gestione/${tenantSlug}/fidelity/iscritti`}>Iscritti</Link>
      </nav>

      <h1 style={{ marginBottom: "0.5rem" }}>Programma fedeltà</h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Configura il nome del programma, l&apos;opt-in al checkout e la scadenza dei punti.
      </p>

      <form action={saveProgram} style={{ display: "grid", gap: "1rem" }}>
        <input type="hidden" name="tenantSlug" value={tenantSlug} />

        <label style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <input type="checkbox" name="is_active" defaultChecked={program?.is_active ?? false} />
          Programma attivo
        </label>

        <label>
          Nome programma
          <input
            name="program_name"
            defaultValue={program?.program_name ?? "Programma Fedeltà"}
            required
            style={{ display: "block", width: "100%", padding: ".5rem" }}
          />
        </label>

        <label>
          Etichetta punti (es. &quot;punti&quot;, &quot;stelle&quot;, &quot;crediti&quot;)
          <input
            name="points_label"
            defaultValue={program?.points_label ?? "punti"}
            style={{ display: "block", width: "100%", padding: ".5rem" }}
          />
        </label>

        <fieldset style={{ border: "1px solid #ddd", padding: "1rem", borderRadius: 6 }}>
          <legend>Scadenza punti</legend>
          {[
            { v: "never", l: "Mai (i punti non scadono)" },
            { v: "yearly_dec31", l: "Ogni 31 dicembre" },
            { v: "custom_date", l: "Data personalizzata (annuale)" },
            { v: "days_from_accrual", l: "Dopo X giorni dall'accredito (default 365)" },
          ].map((o) => (
            <label key={o.v} style={{ display: "block", padding: ".25rem 0" }}>
              <input
                type="radio"
                name="expiry_kind"
                value={o.v}
                defaultChecked={(program?.expiry_kind ?? "days_from_accrual") === o.v}
              />{" "}
              {o.l}
            </label>
          ))}
          <div style={{ display: "flex", gap: "1rem", marginTop: ".75rem" }}>
            <label>
              Giorni
              <input
                type="number"
                name="expiry_days"
                min={1}
                defaultValue={program?.expiry_days ?? 365}
                style={{ display: "block", padding: ".4rem", width: 100 }}
              />
            </label>
            <label>
              Data
              <input
                type="date"
                name="expiry_custom_date"
                defaultValue={program?.expiry_custom_date ?? ""}
                style={{ display: "block", padding: ".4rem" }}
              />
            </label>
          </div>
        </fieldset>

        <label>
          Testo opt-in al checkout (GDPR)
          <textarea
            name="optin_text"
            defaultValue={
              program?.optin_text ??
              "Iscrivendomi accetto il regolamento del programma fedeltà e la privacy policy."
            }
            rows={3}
            style={{ display: "block", width: "100%", padding: ".5rem" }}
          />
        </label>

        <label>
          URL regolamento (opzionale)
          <input
            type="url"
            name="terms_url"
            defaultValue={program?.terms_url ?? ""}
            placeholder="https://..."
            style={{ display: "block", width: "100%", padding: ".5rem" }}
          />
        </label>

        <button
          type="submit"
          style={{ padding: ".75rem 1.5rem", background: "#111", color: "#fff", border: 0, borderRadius: 6, justifySelf: "start" }}
        >
          Salva programma
        </button>
      </form>
    </div>
  );
}
