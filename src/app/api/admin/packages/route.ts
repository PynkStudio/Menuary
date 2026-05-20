import { NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole, type SiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeMarketCode } from "@/lib/markets";

async function requirePackagesPermission() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { error: "Non autenticato.", status: 401 as const };

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  const role = isSiteadminRole(siteadmin?.role) ? (siteadmin!.role as SiteadminRole) : null;
  if (!hasAdminPermission(role, "packages:manage")) {
    return { error: "Non autorizzato.", status: 403 as const };
  }
  return { error: null, status: 200 as const };
}

function numeric(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  const auth = await requirePackagesPermission();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createSupabaseAdminClient();
  const { data: packages, error } = await admin
    .from("platform_packages")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const slugs = (packages ?? []).map((pkg) => pkg.slug);
  const { data: marketPrices } = await (admin as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        in: (column: string, values: string[]) => Promise<{ data: unknown[] | null }>;
      };
    };
  })
    .from("platform_package_market_prices")
    .select("*")
    .in("package_slug", slugs);

  return NextResponse.json({ packages: packages ?? [], market_prices: marketPrices ?? [] });
}

export async function PUT(request: Request) {
  const auth = await requirePackagesPermission();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body non valido." }, { status: 400 });

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const marketingName = typeof body.marketing_name === "string" ? body.marketing_name.trim() : "";
  if (!slug || !marketingName) {
    return NextResponse.json({ error: "Slug e nome commerciale sono obbligatori." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const packageRow = {
    name: slug,
    slug,
    description: typeof body.marketing_description === "string" ? body.marketing_description : null,
    package_kind: body.package_kind === "addon" ? "addon" : "base",
    min_package_slug: typeof body.min_package_slug === "string" && body.min_package_slug ? body.min_package_slug : null,
    settings: body.settings && typeof body.settings === "object" ? body.settings : {},
    price_monthly: numeric(body.price_monthly) ?? 0,
    price_monthly_billing: numeric(body.price_monthly_billing),
    price_yearly: (numeric(body.price_monthly) ?? 0) * 12,
    currency: "EUR",
    modules: Array.isArray(body.modules) ? body.modules : [],
    is_active: body.is_active !== false,
    sort_order: numeric(body.sort_order) ?? 0,
    marketing_name: marketingName,
    tagline: typeof body.tagline === "string" ? body.tagline : null,
    marketing_description:
      typeof body.marketing_description === "string" ? body.marketing_description : null,
    setup_from: typeof body.setup_from === "string" ? body.setup_from : null,
    marketing_items: Array.isArray(body.marketing_items) ? body.marketing_items : [],
    is_featured: body.is_featured === true,
    cta_label: typeof body.cta_label === "string" ? body.cta_label : null,
    updated_at: new Date().toISOString(),
  };

  const id = typeof body.id === "string" && body.id.length === 36 ? body.id : null;
  const mutation = id
    ? admin.from("platform_packages").update(packageRow as never).eq("id", id).select("*").single()
    : admin.from("platform_packages").insert(packageRow as never).select("*").single();
  const { data: savedPackage, error: packageError } = await mutation;

  if (packageError) return NextResponse.json({ error: packageError.message }, { status: 500 });

  const inputPrices = Array.isArray(body.market_prices) ? body.market_prices : [];
  const rows = inputPrices
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const countryCode = normalizeMarketCode(row.country_code);
      const priceMonthly = numeric(row.price_monthly);
      const currency = typeof row.currency === "string" ? row.currency.trim() : "";
      if (!countryCode || !currency || priceMonthly == null) return null;
      return {
        package_id: savedPackage.id,
        package_slug: slug,
        country_code: countryCode,
        currency,
        price_monthly: priceMonthly,
        price_monthly_billing: numeric(row.price_monthly_billing),
        setup_from: typeof row.setup_from === "string" ? row.setup_from : null,
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  await (admin as unknown as {
    from: (table: string) => {
      delete: () => { eq: (column: string, value: string) => Promise<{ error: unknown }> };
      insert: (rows: unknown[]) => Promise<{ error: { message?: string } | null }>;
    };
  })
    .from("platform_package_market_prices")
    .delete()
    .eq("package_slug", slug);

  if (rows.length > 0) {
    const { error: pricesError } = await (admin as unknown as {
      from: (table: string) => { insert: (rows: unknown[]) => Promise<{ error: { message?: string } | null }> };
    })
      .from("platform_package_market_prices")
      .insert(rows);
    if (pricesError) {
      return NextResponse.json({ error: pricesError.message ?? "Errore salvataggio listini." }, { status: 500 });
    }
  }

  return NextResponse.json({ package: savedPackage, market_prices: rows });
}
