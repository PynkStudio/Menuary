import type { Metadata } from "next";
import { MailApp } from "@/components/admin/inbox/mail-app";
import { getInboundEmails, getInboxUnreadCounts, getInboxUnreadCountForUser } from "@/lib/email/inbound-queries";
import { getSentEmails } from "@/lib/email/sent-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Posta · PynkStudio Admin",
};

export const dynamic = "force-dynamic";

const COMPOSE_ROLES = new Set(["superadmin", "admin", "amministrazione", "venditore"]);

export default async function PynkAdminInboxPage() {
  let currentSiteadminId: string | null = null;
  let canCompose = false;

  try {
    const supabase = await createSupabaseServerClient(".pynkstudio.it");
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
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
  } catch {
    // accesso degradato
  }

  const [inbox, sent, counts, unreadMine] = await Promise.all([
    getInboundEmails({ archived: false }),
    getSentEmails(),
    getInboxUnreadCounts(),
    currentSiteadminId ? getInboxUnreadCountForUser(currentSiteadminId) : Promise.resolve(0),
  ]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="pynk-admin-page-title">Posta</h1>
        <p className="pynk-admin-page-subtitle">
          Email di @pynkstudio.it e dei verticali (@menuary.it, @bizery.it, @weuseorpheo.com)
        </p>
      </div>
      <MailApp
        initialInbox={inbox}
        initialSent={sent}
        unreadTotal={counts.unread_total}
        unreadMine={unreadMine}
        currentSiteadminId={currentSiteadminId}
        canCompose={canCompose}
      />
    </div>
  );
}
