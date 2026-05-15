import { NextResponse } from "next/server";
import { buildOAuthUrl } from "@/lib/google/my-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/gestione/google/connect?tenantId=bepork
// Restituisce l'URL OAuth da cui il gestore deve essere reindirizzato.
export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = buildOAuthUrl(tenantId);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
