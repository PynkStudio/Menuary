import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminProfileForm } from "@/components/admin/profile/admin-profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildAutoSignature } from "@/lib/email/signature-queries";

export const metadata: Metadata = {
  title: "Profilo · Menuary Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminProfiloPage() {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createSupabaseAdminClient();
  const { data: sa } = await admin
    .from("siteadmin")
    .select("id, email, role, first_name, last_name, display_name, phone, work_hours")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (!sa) notFound();

  const previewMenuary = buildAutoSignature(sa, "menuary").html;
  const previewBizery  = buildAutoSignature(sa, "bizery").html;

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
          email:      sa.email,
          role:       sa.role,
          firstName:  sa.first_name  ?? "",
          lastName:   sa.last_name   ?? "",
          phone:      sa.phone       ?? "",
          workHours:  sa.work_hours  ?? "",
        }}
      />

      <div className="mt-10 space-y-4">
        <h2 className="menuary-admin-page-title" style={{ fontSize: "1.25rem" }}>
          Anteprima firma email
        </h2>
        <p className="menuary-admin-page-subtitle">
          Generata automaticamente dai dati qui sopra. Cambia se aggiorni il
          profilo.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <SignaturePreviewCard label="Menuary" html={previewMenuary} />
          <SignaturePreviewCard label="Bizery"  html={previewBizery} />
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
