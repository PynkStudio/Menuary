import { NextResponse } from "next/server";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import { findTenantById } from "@/lib/tenant-registry";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await ctx.params;
  if (!findTenantById(tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  try {
    const account = await getTenantPaymentAccount(tenantId);
    return NextResponse.json({
      onSite: true,
      stripe:
        account?.status === "connected" &&
        account.chargesEnabled &&
        Boolean(account.stripeAccountId),
    });
  } catch {
    return NextResponse.json({ onSite: true, stripe: false });
  }
}
