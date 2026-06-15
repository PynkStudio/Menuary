import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getInboxUnreadCounts } from "@/lib/email/inbound-queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const assigned = new URL(request.url).searchParams.get("assigned");
    if (assigned === "me") {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ unread: 0 });

      const { data: siteadmin } = await supabase
        .from("siteadmin")
        .select("id")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .maybeSingle();
      if (!siteadmin?.id) return NextResponse.json({ unread: 0 });

      const admin = createSupabaseAdminClient();
      const { count } = await admin
        .from("inbound_emails")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to_user_id", siteadmin.id)
        .eq("read", false)
        .eq("archived", false);
      return NextResponse.json({ unread: count ?? 0 });
    }

    const counts = await getInboxUnreadCounts();
    return NextResponse.json({ unread: counts.unread_total });
  } catch {
    return NextResponse.json({ unread: 0 });
  }
}
