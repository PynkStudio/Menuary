import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { getContract } from "@/lib/contracts/contract-queries";
import {
  BRAND_INFO,
  FORNITORE,
  type ContractBrand,
} from "@/lib/contracts/menuary-contract";
import { PLATFORM_BRANDS, resolveSenderForVertical, sendEmail } from "@/lib/email/sender";
import { resolveDocumensoSignerEmail } from "@/lib/contracts/documenso";
import { buildMarketingEmail } from "@/lib/email/templates/marketing";

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: admin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(admin?.role) && hasAdminPermission(admin.role, "crm:create");
}

export async function POST(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const contract = body?.contractId ? await getContract(body.contractId) : null;
  const audience = body?.audience === "supplier" ? "supplier" : "customer";
  if (!contract) {
    return NextResponse.json({ error: "Contratto non trovato" }, { status: 404 });
  }

  const data = contract.contract_data;
  const brandMeta = BRAND_INFO[data.brand as ContractBrand];
  const brand = PLATFORM_BRANDS[brandMeta.vertical];
  const sender = resolveSenderForVertical(brandMeta.vertical);
  const isSupplier = audience === "supplier";
  const url = isSupplier
    ? contract.counterparty_signing_url
    : contract.signing_url;
  const recipient = isSupplier
    ? resolveDocumensoSignerEmail(
        data.documenso_provider ?? "cloud",
        FORNITORE.email,
      )
    : data.cliente.email || data.cliente.pec;

  if (!url) {
    return NextResponse.json({ error: "Link firma non disponibile" }, { status: 409 });
  }
  if (!recipient) {
    return NextResponse.json({ error: "Email destinatario mancante" }, { status: 409 });
  }

  const result = await sendEmail({
    to: recipient,
    subject: `${isSupplier ? "Controfirma" : "Firma"} contratto ${contract.numero} — ${brand.name}`,
    html: buildMarketingEmail({
      brand,
      preheader: `Documento da ${isSupplier ? "controfirmare" : "firmare"} — ${contract.numero}`,
      title: isSupplier ? "Contratto da controfirmare" : "Contratto da firmare",
      body: `<p>È disponibile il contratto <strong>${contract.numero}</strong> per la firma elettronica.</p>`,
      cta: { label: "Apri e firma il contratto", url },
    }),
    fromOverride: sender.from,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ sent: true, url });
}
