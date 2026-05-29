import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const HUBRISE_TOKEN_URL = "https://manager.hubrise.com/oauth2/v1/token";
const HUBRISE_ME_URL = "https://api.hubrise.com/v1/location";

type TokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  account_id?: string;
  location_id?: string;
  catalog_id?: string;
  customer_list_id?: string;
};

type LocationInfo = {
  id: string;
  name?: string;
  account?: { id: string };
  catalog?: { id: string } | null;
  customer_list?: { id: string } | null;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expectedState = jar.get("hubrise_oauth_state")?.value;
  const ctxRaw = jar.get("hubrise_oauth_ctx")?.value;

  jar.delete("hubrise_oauth_state");
  jar.delete("hubrise_oauth_ctx");

  if (!code || !state || state !== expectedState || !ctxRaw) {
    return NextResponse.redirect(new URL("/admin/tenant?error=state", req.url));
  }
  const ctx = JSON.parse(ctxRaw) as { tenantId: string; locationId: string | null };

  const clientId = process.env.HUBRISE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.HUBRISE_OAUTH_CLIENT_SECRET;
  const callbackUrl = process.env.HUBRISE_OAUTH_CALLBACK_URL;
  if (!clientId || !clientSecret || !callbackUrl) {
    return NextResponse.json({ error: "hubrise_oauth_unconfigured" }, { status: 500 });
  }

  const tokenRes = await fetch(HUBRISE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL(`/admin/tenant?error=token_exchange&tenant=${ctx.tenantId}`, req.url));
  }
  const token = (await tokenRes.json()) as TokenResponse;

  // Recupera info location/catalog se non presenti nella token response.
  const meRes = await fetch(HUBRISE_ME_URL, {
    headers: { "X-Access-Token": token.access_token },
  });
  const me = meRes.ok ? ((await meRes.json()) as LocationInfo) : null;

  const hubriseLocationId = token.location_id ?? me?.id;
  if (!hubriseLocationId) {
    return NextResponse.redirect(new URL(`/admin/tenant?error=missing_location&tenant=${ctx.tenantId}`, req.url));
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  await supabase
    .from("hubrise_links" as never)
    .upsert(
      {
        tenant_id: ctx.tenantId,
        location_id: ctx.locationId,
        hubrise_account_id: token.account_id ?? me?.account?.id ?? null,
        hubrise_location_id: hubriseLocationId,
        location_name: me?.name ?? null,
        location_token: token.access_token,
        catalog_id: token.catalog_id ?? me?.catalog?.id ?? null,
        customer_list_id: token.customer_list_id ?? me?.customer_list?.id ?? null,
        status: "active",
        menu_push_enabled: true,
        orders_inbound_enabled: true,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "tenant_id,location_id" },
    );

  return NextResponse.redirect(
    new URL(`/admin/tenant?ok=1&tenant=${ctx.tenantId}`, req.url),
  );
}
