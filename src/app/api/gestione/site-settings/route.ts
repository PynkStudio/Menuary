import { NextResponse } from "next/server";
import { requireGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { pickServerSiteSettings, siteSettingsPatchRequirement } from "@/lib/site-settings-sync";

type SiteSettingsRow = { settings: Record<string, unknown> | null };
type UntypedClient = {
  from(table: "tenant_site_settings"): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: SiteSettingsRow | null; error: { message: string } | null }>;
      };
    };
    upsert(
      row: Record<string, unknown>,
      options: { onConflict: string },
    ): Promise<{ error: { message: string } | null }>;
  };
};

// PUT { tenantId, settings }: unisce la patch alle impostazioni salvate.
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as { tenantId?: string; settings?: unknown } | null;
  const tenantId = body?.tenantId?.trim() ?? "";
  const patch = pickServerSiteSettings(body?.settings);
  if (!tenantId || Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
  }

  const auth = await requireGestione(tenantId, siteSettingsPatchRequirement(patch));
  if (!auth.ok) return NextResponse.json({ error: "Non autorizzato" }, { status: auth.status });
  if (auth.isDemo) return NextResponse.json({ ok: true, demo: true });

  const db = createSupabaseServiceClient() as unknown as UntypedClient | null;
  if (!db) return NextResponse.json({ error: "DB non disponibile" }, { status: 503 });

  const { data: current, error: readError } = await db
    .from("tenant_site_settings")
    .select("settings")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const { error } = await db.from("tenant_site_settings").upsert(
    {
      tenant_id: tenantId,
      settings: { ...(current?.settings ?? {}), ...patch },
      updated_at: new Date().toISOString(),
      updated_by: auth.userId === "demo" ? null : auth.userId,
    },
    { onConflict: "tenant_id" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
