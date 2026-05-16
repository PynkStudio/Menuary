import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SignatureEditor } from "@/components/admin/inbox/signature-editor";
import { getSignature } from "@/lib/email/signature-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Firma email · Menuary Admin",
};

export const dynamic = "force-dynamic";

const COMPOSE_ROLES = new Set(["superadmin", "admin", "amministrazione", "venditore"]);

export default async function InboxImpostazioniPage() {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createSupabaseAdminClient();
  const { data: sa } = await admin
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (!sa || !COMPOSE_ROLES.has(sa.role as string)) notFound();

  // Carica firme esistenti per entrambi i brand in parallelo
  const [sigMenuary, sigBizery] = await Promise.all([
    getSignature(user.id, "menuary"),
    getSignature(user.id, "bizery"),
  ]);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/inbox"
          className="menuary-admin-nav-link !w-auto !px-2 !py-1.5"
          title="Torna alla posta"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="menuary-admin-page-title">Firma email</h1>
          <p className="menuary-admin-page-subtitle">
            Personalizza la firma per ogni brand
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <SignatureEditor brand="menuary" initial={sigMenuary} />
        <SignatureEditor brand="bizery"  initial={sigBizery} />
      </div>
    </div>
  );
}
