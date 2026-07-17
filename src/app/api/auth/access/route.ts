import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { portalEntriesForAccess, resolveUserAccessForUserId } from "@/lib/user-access-server";

export async function GET() {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const access = await resolveUserAccessForUserId(user.id);
  return NextResponse.json({ access, portals: portalEntriesForAccess(access) });
}
