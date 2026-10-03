import { GestioneTabs } from "@/components/gestione/gestione-tabs";
import { requireGestioneSection } from "@/lib/gestione-page";
import { getProgram } from "@/lib/fidelity/queries";
import { saveProgram } from "./actions";
import { NewsletterManager } from "@/components/gestione/newsletter-manager";
import { getNewsletterDashboard } from "@/lib/newsletter/server";

export const dynamic = "force-dynamic";

const FIDELITY_TABS = [
  { path: "fidelity", label: "Programma" },
  { path: "fidelity/regole", label: "Regole punti" },
  { path: "fidelity/premi", label: "Premi" },
  { path: "fidelity/iscritti", label: "Iscritti" },
];

export default async function FidelityProgramPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const { tenant, auth } = await requireGestioneSection(tenantSlug, "loyalty");

  if (tenant.vertical === "creative") {
    let newsletterData = undefined;
    let newsletterError = null;
    try {
      // Gli iscritti alla newsletter sono dati personali: niente lettura in demo.
      if (auth.isDemo) throw new Error("non disponibile nella demo pubblica");
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

  const expiryKind = program?.expiry_kind ?? "days_from_accrual";

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Fedeltà</span>
        <h1 className="ga-heading">Programma fedeltà</h1>
        <p className="ga-lead">Nome del programma, iscrizione al checkout e scadenza dei punti.</p>
      </header>
      <GestioneTabs items={FIDELITY_TABS} label="Sezioni fedeltà" />

      <form action={saveProgram} className="ga-card ga-form-grid">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />

        <label className="ga-inline-check ga-field-wide">
          <input type="checkbox" name="is_active" className="ga-checkbox" defaultChecked={program?.is_active ?? false} />
          <span>Programma attivo</span>
        </label>

        <label className="ga-field">
          <span className="ga-label-text">Nome programma</span>
          <input name="program_name" className="ga-input" defaultValue={program?.program_name ?? "Programma Fedeltà"} required />
        </label>

        <label className="ga-field">
          <span className="ga-label-text">Come chiami i punti</span>
          <input name="points_label" className="ga-input" defaultValue={program?.points_label ?? "punti"} placeholder="punti, stelle, crediti" />
        </label>

        <fieldset className="ga-fieldset ga-field-wide">
          <legend className="ga-label-text">Scadenza punti</legend>
          {[
            { v: "never", l: "Mai: i punti non scadono" },
            { v: "yearly_dec31", l: "Ogni 31 dicembre" },
            { v: "custom_date", l: "Ogni anno in una data scelta" },
            { v: "days_from_accrual", l: "Dopo un numero di giorni dall'accredito" },
          ].map((o) => (
            <label key={o.v} className="ga-inline-check">
              <input type="radio" name="expiry_kind" value={o.v} defaultChecked={expiryKind === o.v} />
              <span>{o.l}</span>
            </label>
          ))}
          <div className="ga-form-grid">
            <label className="ga-field">
              <span className="ga-label-text">Giorni</span>
              <input type="number" name="expiry_days" min={1} className="ga-input" defaultValue={program?.expiry_days ?? 365} />
            </label>
            <label className="ga-field">
              <span className="ga-label-text">Data annuale</span>
              <input type="date" name="expiry_custom_date" className="ga-input" defaultValue={program?.expiry_custom_date ?? ""} />
            </label>
          </div>
        </fieldset>

        <label className="ga-field ga-field-wide">
          <span className="ga-label-text">Testo di iscrizione al checkout (GDPR)</span>
          <textarea
            name="optin_text"
            rows={3}
            className="ga-textarea"
            defaultValue={program?.optin_text ?? "Iscrivendomi accetto il regolamento del programma fedeltà e la privacy policy."}
          />
        </label>

        <label className="ga-field ga-field-wide">
          <span className="ga-label-text">Link al regolamento (facoltativo)</span>
          <input type="url" name="terms_url" className="ga-input" defaultValue={program?.terms_url ?? ""} placeholder="https://..." />
        </label>

        <div className="ga-form-actions ga-field-wide">
          <button type="submit" className="ga-btn ga-btn-primary">Salva programma</button>
        </div>
      </form>
    </div>
  );
}
