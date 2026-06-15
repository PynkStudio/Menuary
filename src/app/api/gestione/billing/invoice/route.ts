import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

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
  const paymentId = req.nextUrl.searchParams.get("payment");
  if (!tenantId || !paymentId) {
    return NextResponse.json({ error: "tenant e payment obbligatori" }, { status: 400 });
  }
  if (!(await canAccessTenant(tenantId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "Storage non configurato" }, { status: 503 });
  // I tipi generati Supabase verranno aggiornati dopo la migrazione invoice.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platformDb = db as any;

  const { data: payment, error } = await platformDb
    .from("platform_payments")
    .select("id, invoice_number, invoice_file_path, invoice_file_name, platform_subscriptions!inner(tenant_id)")
    .eq("id", paymentId)
    .eq("platform_subscriptions.tenant_id", tenantId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!payment?.invoice_file_path) return NextResponse.json({ error: "Fattura non disponibile" }, { status: 404 });

  const { data, error: downloadError } = await db.storage.from("platform-documents").download(payment.invoice_file_path);
  if (downloadError || !data) return NextResponse.json({ error: "File non trovato" }, { status: 404 });

  const filename = payment.invoice_file_name ?? `Fattura-${payment.invoice_number ?? payment.id}.pdf`;
  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
