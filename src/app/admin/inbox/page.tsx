import type { Metadata } from "next";
import { headers } from "next/headers";
import { MailApp } from "@/components/admin/inbox/mail-app";
import { getInboundEmails, getInboxUnreadCounts } from "@/lib/email/inbound-queries";
import { getSentEmails } from "@/lib/email/sent-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Posta · Menuary Admin",
};

export const dynamic = "force-dynamic";

const COMPOSE_ROLES = new Set(["superadmin", "admin", "amministrazione", "venditore"]);

export default async function AdminInboxPage() {
  // Carica dati in parallelo
  const [inbox, sent, counts] = await Promise.all([
    getInboundEmails({ archived: false }),
    getSentEmails(),
    getInboxUnreadCounts(),
  ]);

  // Determina se l'utente corrente può comporre email
  let canCompose = false;
  try {
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie") ?? "";
    const supabase = await createSupabaseServerClient(".menuary.it");
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const admin = createSupabaseAdminClient();
      const { data: sa } = await admin
        .from("siteadmin")
        .select("role")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .maybeSingle();

      canCompose = Boolean(sa && COMPOSE_ROLES.has(sa.role as string));
      void cookieHeader;
    }
  } catch {
    canCompose = false;
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="menuary-admin-page-title">Posta</h1>
        <p className="menuary-admin-page-subtitle">
          Email di @menuary.it e @bizery.it
        </p>
      </div>
      <MailApp
        initialInbox={inbox}
        initialSent={sent}
        unreadTotal={counts.unread_total}
        canCompose={canCompose}
      />
    </div>
  );
}
