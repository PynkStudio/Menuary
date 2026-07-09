import type { Metadata } from "next";
import { headers } from "next/headers";
import "@/lib/mailapp-runtime";
import { MailApp } from "@pynkstudio/mailapp/react";
import { getInboundEmails, getInboxUnreadCounts, getInboxUnreadCountForUser } from "@pynkstudio/mailapp/email";
import { getSentDeliveryIssueCount, getSentEmails } from "@pynkstudio/mailapp/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Posta · Menuary Admin",
};

export const dynamic = "force-dynamic";

const COMPOSE_ROLES = new Set(["superadmin", "admin", "amministrazione", "venditore"]);

export default async function AdminInboxPage() {
  // Risolve utente corrente e poi carica tutto in parallelo
  let currentSiteadminId: string | null = null;
  let currentUserEmail: string | null = null;
  let canCompose = false;

  try {
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie") ?? "";
    const supabase = await createSupabaseServerClient(".menuary.it");
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      currentUserEmail = user.email ?? null;
      const admin = createSupabaseAdminClient();
      const { data: sa } = await admin
        .from("siteadmin")
        .select("id, role")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .maybeSingle();

      if (sa) {
        currentSiteadminId = sa.id as string;
        canCompose = COMPOSE_ROLES.has(sa.role as string);
      }
    }
    void cookieHeader;
  } catch {
    // accesso degradato: nessuna personalizzazione
  }

  const [inbox, sent, counts, unreadMine, deliveryIssueCount] = await Promise.all([
    getInboundEmails({ archived: false }),
    getSentEmails(),
    getInboxUnreadCounts(),
    currentSiteadminId ? getInboxUnreadCountForUser(currentSiteadminId) : Promise.resolve(0),
    getSentDeliveryIssueCount(),
  ]);

  return (
    <div>
      <MailApp
        initialInbox={inbox}
        initialSent={sent}
        unreadTotal={counts.unread_total}
        unreadMine={unreadMine}
        deliveryIssueCount={deliveryIssueCount}
        currentSiteadminId={currentSiteadminId}
        canCompose={canCompose}
        currentUserEmail={currentUserEmail}
      />
    </div>
  );
}
