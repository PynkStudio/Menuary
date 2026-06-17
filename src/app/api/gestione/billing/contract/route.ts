import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getCountersignedContractByTenant } from "@/lib/contracts/contract-queries";

export const dynamic = "force-dynamic";

async function canAccessTenant(tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: tenantAdmin } = await supabase
    .from("tenantadmin")
    .select("email")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .eq("enabled", true)
    .maybeSingle();
  return Boolean(tenantAdmin);
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenant");
  if (!tenantId) return NextResponse.json({ error: "tenant obbligatorio" }, { status: 400 });
  if (!(await canAccessTenant(tenantId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contract = await getCountersignedContractByTenant(tenantId);
  if (!contract?.signed_document_path) {
    return NextResponse.json({ error: "Contratto firmato non disponibile" }, { status: 404 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "Storage non configurato" }, { status: 503 });
  const { data, error } = await db.storage.from("platform-documents").download(contract.signed_document_path);
  if (error || !data) return NextResponse.json({ error: "File non trovato" }, { status: 404 });

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Contratto-${contract.numero}.pdf"`,
    },
  });
}
