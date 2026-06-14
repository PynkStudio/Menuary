import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { getContract } from "@/lib/contracts/contract-queries";

export const dynamic = "force-dynamic";

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(sa?.role) && hasAdminPermission(sa.role, "crm:create")
    ? user
    : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id obbligatorio" }, { status: 400 });
  }

  const contract = await getContract(id);
  if (!contract) {
    return NextResponse.json(
      { error: "Contratto non trovato" },
      { status: 404 },
    );
  }

  if (!contract.signed_document_path) {
    return NextResponse.json(
      { error: "PDF firmato non disponibile" },
      { status: 404 },
    );
  }

  const db = createSupabaseServiceClient();
  if (!db) {
    return NextResponse.json(
      { error: "Storage non configurato" },
      { status: 500 },
    );
  }

  const { data, error } = await db.storage
    .from("platform-documents")
    .download(contract.signed_document_path);

  if (error || !data) {
    return NextResponse.json(
      { error: "File non trovato nello storage" },
      { status: 404 },
    );
  }

  const arrayBuf = await data.arrayBuffer();
  const filename = `Firmato-${contract.numero}.pdf`;

  return new NextResponse(arrayBuf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
