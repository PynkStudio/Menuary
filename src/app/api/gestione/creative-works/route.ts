/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getTenantById } from "@/lib/data/tenant";
import { valentinaCreativeWorks, type ValentinaCreativeWork } from "@/components/tenants/valentina-orciuoli/content";

type LooseClient = { from(table: string): any };

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : crypto.randomUUID();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100) || crypto.randomUUID();
}

function sanitizeWorks(raw: unknown): ValentinaCreativeWork[] {
  if (!Array.isArray(raw)) return [];
  const usedSlugs = new Set<string>();

  return raw.flatMap((item) => {
    const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const title = text(value.title, 160);
    if (!title) return [];
    let slug = slugify(text(value.slug, 100) || title);
    let suffix = 2;
    while (usedSlugs.has(slug)) slug = `${slugify(title)}-${suffix++}`;
    usedSlugs.add(slug);

    return [{
      id: validUuid(value.id),
      slug,
      title,
      description: text(value.description, 1200),
      secondaryText: text(value.secondaryText, 2400),
      coverImageUrl: text(value.coverImageUrl, 1000),
      backgroundMediaUrl: text(value.backgroundMediaUrl, 1000),
      ctaLabel: text(value.ctaLabel, 80) || "Scopri",
      ctaHref: text(value.ctaHref, 1000),
      enabled: value.enabled !== false,
    }];
  }).slice(0, 100);
}

async function context(tenantId: string) {
  const auth = await authorizeGestione(tenantId);
  if (!auth.ok || (!auth.isDemo && !auth.isAdmin)) {
    return { error: NextResponse.json({ error: "Non autorizzato." }, { status: 403 }) };
  }
  const tenant = await getTenantById(tenantId);
  if (!tenant?.features.worksCatalog) {
    return { error: NextResponse.json({ error: "Catalogo opere non attivo." }, { status: 403 }) };
  }
  return { auth };
}

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId")?.trim() ?? "";
  const ctx = await context(tenantId);
  if ("error" in ctx) return ctx.error;
  if (ctx.auth.isDemo) return NextResponse.json({ works: valentinaCreativeWorks });

  const db = createSupabaseServiceClient() as unknown as LooseClient | null;
  if (!db) return NextResponse.json({ error: "Database non disponibile." }, { status: 503 });
  const { data, error } = await db
    .from("tenant_creative_works")
    .select("id,slug,title,description,secondary_text,cover_image_url,background_media_url,cta_label,cta_href,enabled")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = text(body?.tenantId, 120);
  const ctx = await context(tenantId);
  if ("error" in ctx) return ctx.error;
  const works = sanitizeWorks(body?.works);
  if (ctx.auth.isDemo) return NextResponse.json({ ok: true, works });

  const db = createSupabaseServiceClient() as unknown as LooseClient | null;
  if (!db) return NextResponse.json({ error: "Database non disponibile." }, { status: 503 });
  const ids = works.map((work) => work.id);
  const deleteQuery = db.from("tenant_creative_works").delete().eq("tenant_id", tenantId);
  const { error: deleteError } = ids.length
    ? await deleteQuery.not("id", "in", `(${ids.join(",")})`)
    : await deleteQuery;
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (works.length) {
    const now = new Date().toISOString();
    const { error } = await db.from("tenant_creative_works").upsert(
      works.map((work, position) => ({
        id: work.id,
        tenant_id: tenantId,
        slug: work.slug,
        title: work.title,
        description: work.description,
        secondary_text: work.secondaryText,
        cover_image_url: work.coverImageUrl || null,
        background_media_url: work.backgroundMediaUrl || null,
        cta_label: work.ctaLabel,
        cta_href: work.ctaHref || null,
        position,
        enabled: work.enabled,
        updated_at: now,
      })),
      { onConflict: "id" },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, works });
}
