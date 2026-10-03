import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { pickServerSiteSettings } from "@/lib/site-settings-sync";

type SiteSettingsRow = { settings: unknown; updated_at: string };
type UntypedClient = {
  from(table: "tenant_site_settings"): {
    select(columns: string): {
      eq(column: string, value: string): {
        maybeSingle(): Promise<{ data: SiteSettingsRow | null; error: { message: string } | null }>;
      };
    };
  };
};

// Lettura pubblica: sono le impostazioni che il sito mostra a chiunque.
export async function GET(_request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ settings: {}, updatedAt: null });

  const { data, error } = await (db as unknown as UntypedClient)
    .from("tenant_site_settings")
    .select("settings, updated_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { settings: pickServerSiteSettings(data?.settings), updatedAt: data?.updated_at ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
