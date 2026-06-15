import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(siteadmin?.role) && hasAdminPermission(siteadmin.role, "subscriptions:view");
}

function cleanFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120) || "fattura.pdf";
}

export async function GET(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const paymentId = req.nextUrl.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId obbligatorio" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "Storage non configurato" }, { status: 503 });
  // I tipi generati Supabase verranno aggiornati dopo la migrazione invoice.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platformDb = db as any;

  const { data: payment, error } = await platformDb
    .from("platform_payments")
    .select("id, invoice_number, invoice_file_path, invoice_file_name")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!payment?.invoice_file_path) {
    return NextResponse.json({ error: "Fattura non disponibile" }, { status: 404 });
  }

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

export async function POST(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const paymentId = form?.get("paymentId");
  const invoiceNumber = form?.get("invoiceNumber");
  const invoiceDate = form?.get("invoiceDate");
  const file = form?.get("file");
  if (typeof paymentId !== "string" || !paymentId) {
    return NextResponse.json({ error: "paymentId obbligatorio" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "File fattura obbligatorio" }, { status: 400 });
  }
  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json({ error: "Carica una fattura in PDF" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "Storage non configurato" }, { status: 503 });
  // I tipi generati Supabase verranno aggiornati dopo la migrazione invoice.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platformDb = db as any;

  const { data: payment, error: paymentError } = await platformDb
    .from("platform_payments")
    .select("id, status, subscription_id, lead_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 500 });
  if (!payment) return NextResponse.json({ error: "Pagamento non trovato" }, { status: 404 });
  if (payment.status !== "paid") {
    return NextResponse.json({ error: "La fattura si carica solo dopo la conferma del pagamento" }, { status: 409 });
  }

  const filename = cleanFileName(file.name);
  const objectPath = `invoices/${payment.subscription_id}/${payment.id}-${Date.now()}-${filename}`;
  const { error: uploadError } = await db.storage.from("platform-documents").upload(objectPath, file, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await platformDb
    .from("platform_payments")
    .update({
      invoice_number: typeof invoiceNumber === "string" && invoiceNumber.trim() ? invoiceNumber.trim() : null,
      invoice_date: typeof invoiceDate === "string" && invoiceDate ? invoiceDate : now.slice(0, 10),
      invoice_file_path: objectPath,
      invoice_file_name: filename,
      invoice_uploaded_at: now,
      updated_at: now,
    })
    .eq("id", payment.id)
    .select("*")
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ payment: updated });
}
