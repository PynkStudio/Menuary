import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { getTenantLinktreeItems } from "@/lib/tenant-linktree";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const tenant = findTenantById(tenantId);
  if (!tenant) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  if (!tenant.features.linktree) return NextResponse.json({ links: [] });

  const links = await getTenantLinktreeItems(tenantId);
  return NextResponse.json({ links });
}
