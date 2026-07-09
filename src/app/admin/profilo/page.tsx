import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminProfileForm } from "@/components/admin/profile/admin-profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildAutoSignature } from "@/lib/email/signature-queries";
import { buildPasskeysUrl } from "@/lib/login-url";
import type { InboundEmailBrand } from "@/lib/email/inbound-types";

export const metadata: Metadata = {
  title: "Profilo · Menuary Admin",
};

export const dynamic = "force-dynamic";

const SIGNATURE_BRANDS: { brand: InboundEmailBrand; label: string }[] = [
  { brand: "menuary",     label: "Menuary" },
  { brand: "bizery",      label: "Bizery" },
  { brand: "orpheo",      label: "Orpheo" },
  { brand: "pynkstudio",  label: "PynkStudio" },
];

export default async function AdminProfiloPage() {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createSupabaseAdminClient();
  const { data: sa } = await admin
    .from("siteadmin")
    .select("id, email, role, first_name, last_name, display_name, phone, work_hours, signature_role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (!sa) notFound();

  const canEditSignatureRole = sa.role === "superadmin" || sa.role === "admin";

  const previews = SIGNATURE_BRANDS.map(({ brand, label }) => ({
    label,
    html: buildAutoSignature(sa, brand).html,
  }));

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="menuary-admin-page-title">Il tuo profilo</h1>
        <p className="menuary-admin-page-subtitle">
          Informazioni personali e di contatto. Vengono usate per popolare la
          firma email automatica e mostrate negli strumenti interni.
        </p>
      </div>

      <AdminProfileForm
        initial={{
          email:         sa.email,
          role:          sa.role,
          firstName:     sa.first_name  ?? "",
          lastName:      sa.last_name   ?? "",
          phone:         sa.phone       ?? "",
          workHours:     sa.work_hours  ?? "",
          signatureRole: sa.signature_role ?? "",
        }}
        canEditSignatureRole={canEditSignatureRole}
      />

      <section className="menuary-admin-card mt-6 p-6">
        <h2 className="menuary-admin-page-title" style={{ fontSize: "1.25rem" }}>
          Passkey
        </h2>
        <p className="menuary-admin-page-subtitle">
          Crea una passkey per accedere con biometria, PIN dispositivo o chiave di sicurezza.
        </p>
        <a href={buildPasskeysUrl({ from: "admin", next: "/profilo" })} className="menuary-admin-action-btn mt-4 inline-flex">
          Gestisci passkey
        </a>
      </section>

      <div className="mt-10 space-y-4">
        <h2 className="menuary-admin-page-title" style={{ fontSize: "1.25rem" }}>
          Anteprima firma email
        </h2>
        <p className="menuary-admin-page-subtitle">
          Generata automaticamente dai dati qui sopra. Cambia se aggiorni il
          profilo.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {previews.map((p) => (
            <SignaturePreviewCard key={p.label} label={p.label} html={p.html} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SignaturePreviewCard({ label, html }: { label: string; html: string }) {
  return (
    <div className="menuary-admin-card p-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--ma-muted)]">
        {label}
      </p>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
