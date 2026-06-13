/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const tenant = findTenantById(tenantId);
  if (!tenant) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  if (!tenant.features.worksCatalog) return NextResponse.json({ works: [] });

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ works: [] });
  const { data, error } = await (db as any)
    .from("tenant_creative_works")
    .select("id,slug,title,description,secondary_text,cover_image_url,background_media_url,cta_label,cta_href,enabled")
    .eq("tenant_id", tenantId)
    .eq("enabled", true)
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ works: [] });

  return NextResponse.json({
    works: (data ?? []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      secondaryText: row.secondary_text,
      coverImageUrl: row.cover_image_url ?? "",
      backgroundMediaUrl: row.background_media_url ?? "",
      ctaLabel: row.cta_label,
      ctaHref: row.cta_href ?? "",
      enabled: row.enabled,
    })),
  });
}
